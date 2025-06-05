import {
  AfterViewInit,
  OnChanges,
  Component,
  ElementRef,
  Input,
  ViewChild,
  Output,
  EventEmitter,
  OnDestroy,
  SimpleChanges,
} from "@angular/core";
import * as d3 from "d3";
import { Slider, SliderModule } from "primeng/slider";
import { BehaviorSubject, combineLatest, debounceTime, filter, map, max, takeLast, tap, throttleTime } from "rxjs";
import { FormsModule } from "@angular/forms";
import { AsyncPipe } from "@angular/common";

export type ScaleType = 'linear' | 'log';

@Component({
  selector: "app-density-plot",
  templateUrl: "./density-plot.component.html",
  styleUrls: ["./density-plot.component.scss"],
  standalone: true,
  imports: [
    SliderModule,
    FormsModule,
  ],
})
export class DensityPlotComponent implements OnChanges, AfterViewInit {
  @ViewChild("container") container: ElementRef<HTMLDivElement>;
  @Input() data: number[] = [];
  @Input() scaleType: ScaleType = 'linear';
  @Input() bandwidth = 0.05;
  @Input() highlightValue?: number;

  private density: [number, number][] = [];
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private plotContainer: d3.Selection<SVGGElement, unknown, null, undefined>;
  private x: d3.ScaleLinear<number, number> | d3.ScaleLogarithmic<number, number>;
  private y: d3.ScaleLinear<number, number>;
  private width = 0;
  private height = 0;
  private margin = { top: 40, right: 30, bottom: 30, left: 30 };
  private thresholds: number[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['scaleType'] || changes['bandwidth']) {
      this.updateDensity();
      this.initializeChart();
      this.render();
    }
  }

  ngAfterViewInit(): void {
    this.updateDensity();
    this.initializeChart();
    this.render();
  }

  private initializeChart(): void {
    if (!this.container?.nativeElement) return;

    const containerEl = this.container.nativeElement;
    this.width = containerEl.clientWidth - this.margin.left - this.margin.right;
    this.height = containerEl.clientHeight - this.margin.top - this.margin.bottom;

    const svgElement = containerEl.querySelector('svg');
    if (!svgElement) return;

    this.svg = d3.select<SVGSVGElement, unknown>(svgElement);
    this.plotContainer = this.svg.select<SVGGElement>('.plot-container');

    this.svg
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom);

    this.plotContainer
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    this.initializeScales();
  }

  private initializeScales(): void {
    if (!this.density.length) return;

    let min = this.thresholds[0];
    let max = this.thresholds[this.thresholds.length - 1];

    // Adjust domain if highlight value is outside current range
    if (this.highlightValue !== undefined) {
      if (this.scaleType === 'log') {
        min = Math.min(min, this.highlightValue);
        max = Math.max(max, this.highlightValue);
      } else {
        min = Math.min(min, this.highlightValue);
        max = Math.max(max, this.highlightValue);
      }
    }

    this.x = this.scaleType === 'log' 
      ? d3.scaleLog().domain([min, max]).range([0, this.width])
      : d3.scaleLinear().domain([min, max]).range([0, this.width]);

    this.y = d3.scaleLinear()
      .range([this.height, 0])
      .domain([0, 1]);
  }

  private updateDensity(): void {
    if (!this.data.length) return;

    const min = Math.min(...this.data);
    const max = Math.max(...this.data);
    this.thresholds = this.generateThresholds(min, max);
    this.density = this.calculateDensity();
  }

  private generateThresholds(min: number, max: number): number[] {
    const numPoints = 100;
    const thresholds: number[] = [];

    if (this.scaleType === 'log') {
      const logMin = min;
      const logMax = max;
      const logStep = (Math.log10(logMax) - Math.log10(logMin)) / numPoints;
      
      for (let i = 0; i <= numPoints; i++) {
        thresholds.push(Math.pow(10, Math.log10(logMin) + i * logStep));
      }
    } else {
      const step = (max - min) / numPoints;
      for (let i = 0; i <= numPoints; i++) {
        thresholds.push(min + i * step);
      }
    }

    return thresholds;
  }

  private calculateDensity(): [number, number][] {
    const density: [number, number][] = [[this.thresholds[0], 0]];

    function epanechnikov(bandwidth: number) {
      return (x: number) =>
        Math.abs((x /= bandwidth)) <= 1
          ? (0.75 * (1 - x * x)) / bandwidth
          : 0;
    }

    function kde(kernel: Function, thresholds: number[], data: number[]) {
      return thresholds.map((t) => [t, d3.mean(data, (d) => kernel(t - d))]);
    }

    density.push(
      ...(kde(epanechnikov(this.bandwidth), this.thresholds, this.data) as [number, number][]),
    );

    density.push([density[density.length - 1][0], 0]);

    // Normalize the density
    const maxDensity = d3.max(density.map((d) => d[1]))!;
    return density.map(([x, y]) => [x, y / maxDensity]) as [number, number][];
  }

  private render(): void {
    if (!this.plotContainer || !this.density.length) return;

    const lineGenerator = d3
      .line<[number, number]>()
      .curve(d3.curveBasis)
      .x((d) => this.x(d[0]))
      .y((d) => this.y(d[1]));

    // Update the density curve
    this.plotContainer
      .select<SVGPathElement>('.density-curve')
      .attr("d", lineGenerator(this.density));

    this.updateAxes();
  }

  private formatScientificNotation(value: number): string {
    if (this.scaleType === 'log') {
      const exponent = Math.log10(value);
      return value === 1 ? '1' : `10${exponent}`;
    }
    return value.toFixed(2);
  }

  private updateAxes(): void {
    const max = Math.max(...this.data);
    const min = Math.min(...this.data);
    let tickValues = this.scaleType === 'log'
      ? d3.range(Math.floor(Math.log10(min)), Math.ceil(Math.log10(max)) + 1)
          .map(exp => Math.pow(10, exp))
      : [min, max, 0.25, 0.5, 0.75, 1.0];

    // Always include min and max values
    tickValues = [...new Set([min, ...tickValues, max])].sort((a, b) => a - b);

    // Add highlight value to tick values if it exists
    if (this.highlightValue !== undefined) {
      tickValues = [...new Set([...tickValues, this.highlightValue])].sort((a, b) => a - b);
    }

    // Update x-axis
    const xAxis = this.plotContainer.select<SVGGElement>('#x-axis')
      .attr("transform", `translate(0,${this.height})`);

    const xAxisGenerator = d3.axisBottom(this.x)
      .tickFormat((d: any) => this.formatScientificNotation(d))
      .tickSize(-this.height + 10)
      .tickValues(tickValues);

    xAxis.call(xAxisGenerator);

    xAxis.selectAll<SVGLineElement, unknown>(".tick line")
      .attr("stroke", "#DEE2E6aa")
      .attr("stroke-dasharray", "5")
      .attr("transform", "scale(1, 0.8)")
      .attr("stroke-width", "2");

    xAxis.select<SVGPathElement>(".domain").attr("stroke", "transparent");

    // Handle regular ticks
    xAxis.selectAll<SVGTextElement, unknown>(".tick text")
      .attr("fill", "#495057")
      .attr("font-weight", "300")
      .attr("transform", `translate(0, 20) rotate(-60)`)
      .each(function(d: any) {
        const text = d3.select(this);
        const value = text.text();
        if (value.startsWith('10')) {
          const exponent = value.substring(2);
          text.text('10');
          text.append('tspan')
            .attr('baseline-shift', 'super')
            .attr('font-size', '0.7em')
            .text(exponent);
        }
      });

    // Style the highlight tick differently
    if (this.highlightValue) {
      xAxis.selectAll<SVGGElement, unknown>(".tick")
        .filter((d: any) => d === this.highlightValue)
        .each((d: any, i, g) => {
          d3.select(g[0]).select("line")
            .attr("stroke", "white")
            .attr("stroke-width", "2")
            .attr("transform", "scale(1, 1.3)")
            .style("mix-blend-mode", "difference");
          d3.select(g[0]).select("text")
            .attr("font-weight", "bold")
            .attr("font-size", ".8rem")
            .attr("fill", "white")
            .style("mix-blend-mode", "difference")
            .attr('transform', `translate(0, ${-this.height - 25})`)
            .text(
              (this.highlightValue! > 1000 || this.highlightValue! < 0.0001)
                ? this.highlightValue!.toExponential(0)
                : this.highlightValue!.toFixed(4)
            );
        });
    }

    // Style min and max ticks
    xAxis.selectAll<SVGGElement, unknown>(".tick")
      .filter((d: any) => d === min)
      .each((d: any, i, g: any) => {
        d3.select(g[0]).select("line")
          .attr("stroke", "#495057")
          .attr("stroke-width", "2")
          .style("mix-blend-mode", "difference")
          .attr("transform", "scale(1, 1.2)");
        d3.select(g[0]).select("text")
          .attr("font-weight", "bold")
          .attr("font-size", ".8rem")
          .attr("fill", "#495057")
          .style("mix-blend-mode", "difference")
          .attr('transform', `translate(0, ${-this.height - 25})`)
          .html((d > 1000 || d < 0.0001)  
            ? d.toExponential(2).replace(/e+?([+|-])?(\d+)/, '&times;10<tspan baseline-shift="super" font-size="0.5rem">$1$2</tspan>')
            : d.toFixed(4));
      });

    xAxis.selectAll<SVGGElement, unknown>(".tick")
      .filter((d: any) => d === max)
      .each((d: any, i, g: any) => {
        d3.select(g[0]).select("line")
          .attr("stroke", "#495057")
          .attr("stroke-width", "2")
          .style("mix-blend-mode", "difference")
          .attr("transform", "scale(1, 1.2)");
        d3.select(g[0]).select("text")
          .attr("font-weight", "bold")
          .attr("font-size", ".8rem")
          .attr("fill", "#495057")
          .style("mix-blend-mode", "difference")
          .attr('transform', `translate(0, ${-this.height - 25})`)
          .html((d > 1000 || d < 0.0001)  
            ? d.toExponential(2).replace(/e\+?(-)?(\d+)/, '&times;10<tspan baseline-shift="super" font-size="0.5rem">$1$2</tspan>')
            : d.toFixed(4));
      });

    // Update y-axis
    const yAxis = this.plotContainer.select<SVGGElement>('#y-axis');
    yAxis.select<SVGPathElement>(".domain").attr("stroke", "transparent");
  }

  exportPNG(filename: string) {
    // this.somnService.exportPNG(
    //   this.container.nativeElement.querySelector("svg")!, 
    //   `${filename}-density_plot`
    // );
  }
}
