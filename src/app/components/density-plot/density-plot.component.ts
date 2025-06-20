import {
  AfterViewInit,
  OnChanges,
  Component,
  ElementRef,
  Input,
  ViewChild,
  SimpleChanges,
} from "@angular/core";
import * as d3 from "d3";
import { SliderModule } from "primeng/slider";
import { FormsModule } from "@angular/forms";
import { OpenEnzymeDBService } from "~/app/services/openenzymedb.service";

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
  @Input() highlightValue: number = 0;
  @Input() colors: string[] = ['#3a1c71', '#38688f', '#56ab2f', '#c3d40c'];

  private density: [number, number][] = [];
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private plotContainer: d3.Selection<SVGGElement, unknown, null, undefined>;
  private x: d3.ScaleLinear<number, number> | d3.ScaleLogarithmic<number, number>;
  private y: d3.ScaleLinear<number, number>;
  private width = 0;
  private height = 0;
  private margin = { top: 40, right: 30, bottom: 40, left: 30 };

  constructor(
    private openenzymedbService: OpenEnzymeDBService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['scaleType'] || changes['bandwidth']) {
      const { density } = this.openenzymedbService.createDensityFor(this.data, this.scaleType);
      this.density = density;

      this.initializeChart();
      this.render();
    }
  }

  ngAfterViewInit(): void {
    const { density } = this.openenzymedbService.createDensityFor(this.data, this.scaleType);
    this.density = density;

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

    let min = Math.min(...this.data);
    let max = Math.max(...this.data);

    // Adjust domain if highlight value is outside current range
    if (this.highlightValue !== undefined) {
      min = Math.min(min, this.highlightValue);
      max = Math.max(max, this.highlightValue);
    }

    this.x = this.scaleType === 'log' 
      ? d3.scaleLog().domain([min, max]).range([0, this.width])
      : d3.scaleLinear().domain([min, max]).range([0, this.width]);

    this.y = d3.scaleLinear()
      .range([this.height, 0])
      .domain([0, 1]);
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

  private updateAxes(): void {
    const max = Math.max(...this.data);
    const min = Math.min(...this.data);
    let tickValues = this.scaleType === 'log'
      ? ((min, max) => {
        let values = [];
        let start = Math.floor(Math.log10(min));
        let end = Math.ceil(Math.log10(max));
        for (let i = start; i <= end; i++) {
          values.push(Math.pow(10, i));
        }
        return values;
      })(min, max)
      : [0.25, 0.5, 0.75, 1.0];

    // Always include min and max values
    tickValues = [...new Set([min, ...tickValues, max])].sort((a, b) => a - b);

    // Add highlight value to tick values if it exists
    if (this.highlightValue !== undefined) {
      tickValues = [...tickValues, this.highlightValue].sort((a, b) => a - b);
    }

    // Update x-axis
    const xAxis = this.plotContainer.select<SVGGElement>('#x-axis')
      .attr("transform", `translate(0,${this.height})`);

    // console.log(tickValues);
    const xAxisGenerator = d3.axisBottom(this.x)
      .tickSize(-this.height + 10)
      .tickValues(tickValues);

    xAxis.call(xAxisGenerator);

    xAxis.selectAll<SVGLineElement, unknown>(".tick line")
      .attr("stroke", "#DEE2E6aa")
      .attr("stroke-dasharray", "5")
      .attr("transform", "scale(1, 0.8)")
      .attr("stroke-width", "2")
      .attr("opacity", 0);

    xAxis.select<SVGPathElement>(".domain").attr("stroke", "transparent");

    // Handle regular ticks
    xAxis.selectAll<SVGTextElement, unknown>(".tick text")
      .attr("fill", "#495057")
      .attr("font-weight", "300")
      .attr("transform", `translate(-5, 20) rotate(-45)`)
      .html((d: any) => {
        const exponent = Math.log10(d);
        if (d === 1) {
          return '1';
        }
        return `10<tspan baseline-shift="super" font-size="0.5rem">${exponent}</tspan>`;
      });

    // Style the highlight tick differently
    if (this.highlightValue) {
      const percentile = Math.floor(((this.data.sort((a, b) => a - b).findIndex((d) => d > this.highlightValue) - 1) / this.data.length) * 100);
      xAxis.selectAll<SVGGElement, unknown>(".tick")
        .filter((d: any) => d === this.highlightValue)
        .each((d: any, i, g) => {
          const [f, ...rest] = Array.from(g);
          d3.select(f).select("line")
            .attr("stroke", "#224063")
            .attr("stroke-width", "2")
            .attr("opacity", 1)
            .attr("transform", "scale(1, 1.3)");

          d3.select(f).select("text")
            .attr("font-weight", "bold")
            .attr("font-size", ".8rem")
            .attr("fill", "black")
            .attr('transform', `translate(0, ${-this.height - 25})`)
            .html(this.highlightValue ? `
<tspan>${this.highlightValue.toFixed(4)} </tspan><tspan> (${percentile}
<tspan dx="-3" dy="0" baseline-shift="super" font-size="0.5rem">${`${percentile}`.endsWith('1') 
  ? 'st' : (`${percentile}`.endsWith('2') 
    ? 'nd' : (`${percentile}`.endsWith('3') 
      ? 'rd' : 'th'))}</tspan>)</tspan>
              ` : '');

          // const color = this.openenzymedbService.getColorForDensityPoint(this.highlightValue!, this.density, this.colors);

          // Add background rectangle
          // const text = d3.select(f).select("text");
          // const textNode = text.node() as SVGTextElement;
          // if (textNode) {
          //   const bbox = textNode.getBBox();
          //   d3.select(f).insert("rect", "text")
          //     .attr("x", bbox.x - 4)
          //     .attr("y", bbox.y - 2)
          //     .attr('transform', `translate(-16, ${-this.height - 22})`)
          //     .attr("width", 12)
          //     .attr("height", 12)
          //     .attr("fill", color);
          // }

          rest.forEach((g) => {
            d3.select(g).attr("opacity", 0);
          });
        });
    }

    // Style min and max ticks
    xAxis.selectAll<SVGGElement, unknown>(".tick")
      .filter((d: any) => d === min)
      .each((d: any, i, g: any) => {
        d3.select(g[0]).select("line")
          .attr("stroke", "#DEE2E6")
          .attr("stroke-width", "2")
          .attr("opacity", 1)
          .attr("transform", "scale(1, 1.2)");
        d3.select(g[0]).select("text")
          .attr("font-size", ".8rem")
          .attr("fill", "#6C757D")
          .attr('transform', `translate(0, ${-this.height - 25})`)
          .html((d > 1000 || d < 0.0001)  
            ? d.toExponential(2).replace(/e+?([+|-])?(\d+)/, '&times;10<tspan baseline-shift="super" font-size="0.5rem">$1$2</tspan>')
            : d.toFixed(4));
      });

    xAxis.selectAll<SVGGElement, unknown>(".tick")
      .filter((d: any) => d === max)
      .each((d: any, i, g: any) => {
        d3.select(g[0]).select("line")
          .attr("stroke", "#DEE2E6")
          .attr("stroke-width", "2")
          .attr("opacity", 1)
          .attr("transform", "scale(1, 1.2)");
        d3.select(g[0]).select("text")
          .attr("font-size", ".8rem")
          .attr("fill", "#6C757D")
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
