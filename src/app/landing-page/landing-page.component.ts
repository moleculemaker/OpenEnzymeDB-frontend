import { ChangeDetectorRef, Component, computed, ElementRef, QueryList, ViewChild, ViewChildren } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { OpenEnzymeDBService } from "../services/open-enzyme-db.service";
import { ChartModule, UIChart } from "primeng/chart";
import { CommonModule } from "@angular/common";
import { TableModule } from "primeng/table";
import { PanelModule } from "primeng/panel";
import { combineLatest, combineLatestAll } from "rxjs";
import { DropdownModule } from "primeng/dropdown";
import { FormsModule } from "@angular/forms";
import { SkeletonModule } from "primeng/skeleton";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { active } from "d3";
import { DialogModule } from "primeng/dialog";
import { TutorialService } from "../services/tutorial.service";
import { CheckboxModule } from "primeng/checkbox";

type ChartData = {
  status: 'loading' | 'loaded',
  data: any,
  options: any,
  plugins: any[],
};

type PieChartState = 'focused'
  | 'hovering'
  | 'mouseout'
  | 'default'
  | 'hovering-ec'
  | 'mouseout-ec';

type BarChartState = 'focused'
  | 'hovering'
  | 'mouseout'
  | 'default'
  | 'hovering-ec'
  | 'mouseout-ec';

@Component({
  selector: "landing-page",
  templateUrl: "./landing-page.component.html",
  styleUrls: ["./landing-page.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    RouterLink,
    RouterLinkActive,
    ChartModule,
    TableModule,
    PanelModule,
    DropdownModule,
    FormsModule,
    SkeletonModule,
    ProgressSpinnerModule,
    DialogModule,
    CheckboxModule,
  ],
  host: {
    class: 'flex flex-col justify-center items-center w-full'
  }
})
export class LandingPageComponent {
  @ViewChildren(UIChart) charts!: QueryList<UIChart>;
  @ViewChild('dataSnapshot') dataSnapshot!: ElementRef<HTMLDivElement>;

  readonly whitePaperUrl = this.service.WHITE_PAPER_URL;
  readonly visionUrl = this.service.VISION_URL;
  readonly feedbackUrl = this.service.FEEDBACK_URL;

  dropdownOptions = [
    { label: 'Kinetic Parameters Summary', value: 'pieChart' },
    { label: 'EC Class Summary', value: 'barChart' },
  ];

  displayTutorial = true;

  #chartStates: Record<'pieChart' | 'barChart', {
    state: PieChartState | BarChartState,
    payload: any
  }> = {
      pieChart: {
        state: 'default',
        payload: null,
      },
      barChart: {
        state: 'default',
        payload: null,
      }
    }

  get chartState() {
    return this.#chartStates[this.currentChart];
  }

  set chartState(state: {
    state: PieChartState | BarChartState,
    payload: any
  }) {
    const currentState = this.#chartStates[this.currentChart].state;
    const stateStr = `${currentState}--->${state.state}`;

    if (this.currentChart === 'pieChart') {
      switch (stateStr) {
        case 'default--->hovering':
        case 'default--->focused':
        case 'default--->hovering-ec':
        case 'hovering--->focused':
        case 'hovering--->hovering':
        case 'hovering--->hovering-ec':
        case 'hovering-ec--->hovering-ec':
        case 'hovering-ec--->focused':
        case 'hovering-ec--->hovering':
        case 'mouseout--->focused':
        case 'mouseout--->hovering':
        case 'mouseout--->hovering-ec':
        case 'mouseout-ec--->focused':
        case 'mouseout-ec--->hovering':
        case 'mouseout-ec--->hovering-ec':
        case 'focused--->focused':
          console.log('highlighting pie: ', stateStr, state.payload);
          this.highlightAllPieCharts(state.payload);
          break;

        case 'hovering--->mouseout':
        case 'hovering-ec--->mouseout-ec':
        case 'focused--->default':
          console.log('resetting pie highlight: ', stateStr);
          this.resetPieChartHighlight();
          break;

        case 'focused--->mouseout':
        case 'focused--->hovering':
        case 'focused--->mouseout-ec':
        case 'focused--->hovering-ec':
          // prevent mouseout from resetting the highlight
          return;
      }
    } else {
      switch (stateStr) {
        case 'default--->hovering':
        case 'mouseout--->hovering':
        case 'hovering-ec--->hovering':
        case 'hovering--->hovering':
        case 'mouseout-ec--->hovering':
        // console.log('highlighting single bar chart', state.payload);
        // this.highlightSingleBarChart(state.payload);
        // break;

        case 'default--->hovering-ec':
        case 'mouseout--->hovering-ec':
        case 'hovering--->hovering-ec':
        case 'hovering-ec--->hovering-ec':
        case 'mouseout-ec--->hovering-ec':

        case 'hovering--->focused':
        case 'hovering-ec--->focused':
        case 'mouseout--->focused':
        case 'mouseout-ec--->focused':
        case 'focused--->focused':
          console.log('highlighting bar: ', stateStr, state.payload);
          this.highlightAllBarCharts(state.payload);
          break;

        case 'hovering--->mouseout':
        case 'hovering-ec--->mouseout-ec':
        case 'focused--->default':
          console.log('resetting bar highlight: ', stateStr);
          this.resetBarChartHighlight();
          break;

        case 'focused--->mouseout':
        case 'focused--->hovering':
        case 'focused--->mouseout-ec':
        case 'focused--->hovering-ec':
          // prevent mouseout from resetting the highlight
          return;
      }
    }

    this.#chartStates[this.currentChart] = state;
    this.cdr.detectChanges();
  }

  kineticsLabelsMap = new Map<string, string>([
    ['kcat', '<span class="mr-2"><span class="italic">k</span><sub>cat</sub></span>'],
    ['km', '<span class="mr-2"><span class="italic">K</span><sub>m</sub></span>'],
    ['kcat_km', '<span class="mr-2"><span class="italic">k</span><sub>cat</sub> / <span class="italic">K</span><sub>m</sub></span>'],
  ]);

  currentChart: 'pieChart' | 'barChart' = 'pieChart';

  chartConfigs: {
    pieChart: {
      data: {
        kcat: ChartData,
        km: ChartData,
        kcat_km: ChartData,
      },
      styleConfig: any,
    },
    barChart: {
      data: ChartData,
      styleConfig: any,
    }
  } = {
      pieChart: {
        data: {
          kcat: {
            status: 'loading',
            data: [],
            options: {},
            plugins: [],
          },
          km: {
            status: 'loading',
            data: [],
            options: {},
            plugins: [],
          },
          kcat_km: {
            status: 'loading',
            data: [],
            options: {},
            plugins: [],
          },
        },
        styleConfig: {},
      },

      barChart: {
        data: {
          status: 'loading',
          data: [],
          options: {},
          plugins: [],
        },
        styleConfig: {},
      }
    }

  ecSummary = [
    { label: 'EC 1', longLabel: 'EC 1 - Oxidoreductases', description: 'Catalyze oxidation-reduction reactions.' },
    { label: 'EC 2', longLabel: 'EC 2 - Transferases', description: 'Transfer a functional group from one molecule to another.' },
    { label: 'EC 3', longLabel: 'EC 3 - Hydrolases', description: 'Catalyze hydrolysis reactions, breaking down molecules by adding water.' },
    { label: 'EC 4', longLabel: 'EC 4 - Lyases', description: 'Cleave chemical bonds by mechanisms other than hydrolysis, often forming double bonds.' },
    { label: 'EC 5', longLabel: 'EC 5 - Isomerases', description: 'Rearrange atoms within a molecule to create isomers.' },
    { label: 'EC 6', longLabel: 'EC 6 - Ligases', description: 'Join two molecules together, usually using ATP.' },
    { label: 'EC 7', longLabel: 'EC 7 - Translocases', description: 'Move ions, molecules across membranes.' },
  ]

  // datasetSummary: any[] = [];
  summary: {
    kcat: any,
    km: any,
    kcat_km: any,
    dataset: any,
    status: 'na' | 'loading' | 'loaded',
  } = {
      status: 'na',
      kcat: null,
      km: null,
      kcat_km: null,
      dataset: null,
    }

  constructor(
    protected service: OpenEnzymeDBService,
    private cdr: ChangeDetectorRef,
    protected tutorialService: TutorialService,
  ) {

    combineLatest([
      service.KCAT_DF$,
      service.KM_DF$,
      service.KCAT_KM_DF$,
    ]).subscribe((dfs) => {
      const [kcatDf, kmDf, kcatKmDf] = dfs;
      this.chartConfigs['pieChart']['data']['kcat'] = this.generatePieChart('kcat', kcatDf);
      this.chartConfigs['pieChart']['data']['km'] = this.generatePieChart('km', kmDf);
      this.chartConfigs['pieChart']['data']['kcat_km'] = this.generatePieChart('kcat_km', kcatKmDf);
      this.chartConfigs['barChart']['data'] = this.generateHistogram(dfs);

      this.summary = {
        ...this.generateSummary(kcatDf, kmDf, kcatKmDf),
        status: 'loaded',
      };
    });

    const documentStyle = getComputedStyle(document.documentElement);
    const colorLayer = ['500', '300', '100', '50'];
    const colors = ['blue', 'green', 'orange', 'purple', 'pink', 'teal', 'red'];
    const dimOpacity = 0.2;
    this.chartConfigs['pieChart']['styleConfig'] = {
      dimOpacity,
      textColor: documentStyle.getPropertyValue('--text-color'),
      backgroundColor: colors.map((color) => documentStyle.getPropertyValue(`--${color}-${colorLayer[0]}`)),
      hoverBackgroundColor: colors.map((color) => documentStyle.getPropertyValue(`--${color}-${colorLayer[0]}`))
    }

    const barChartColors = ['blue', 'cyan', 'teal'];
    this.chartConfigs['barChart']['styleConfig'] = {
      dimOpacity,
      textColor: documentStyle.getPropertyValue('--text-color'),
      backgroundColor: barChartColors.map((color) => documentStyle.getPropertyValue(`--${color}-${colorLayer[0]}`)),
      hoverBackgroundColor: barChartColors.map((color) => documentStyle.getPropertyValue(`--${color}-${colorLayer[0]}`))
    }

    document.addEventListener('click', (e) => {
      this.chartState = {
        state: 'default',
        payload: null,
      };
    });
  }

  generateSummary(kcat: any, km: any, kcatKm: any) {
    function getSummary(df: any) {
      const substratesSet = new Set(df.map((row: any) => row['SUBSTRATE']));
      const organismsSet = new Set(df.map((row: any) => row['ORGANISM']));
      const ecNumbersSet = new Set(df.map((row: any) => row['EC']));
      const uniprotIdsSet = new Set(df.map((row: any) => row['UNIPROT']));

      return {
        substrates: substratesSet.size,
        organisms: organismsSet.size,
        ecNumbers: ecNumbersSet.size,
        uniprotIds: uniprotIdsSet.size,
        total: df.length,
      };
    }

    const kcatSummary = getSummary(kcat);
    const kmSummary = getSummary(km);
    const kcatKmSummary = getSummary(kcatKm);

    // transpose the summary
    const dataset = [
      { label: 'Unique Substrates', kcat: kcatSummary.substrates, km: kmSummary.substrates, kcat_km: kcatKmSummary.substrates },
      { label: 'Unique Organisms', kcat: kcatSummary.organisms, km: kmSummary.organisms, kcat_km: kcatKmSummary.organisms },
      { label: 'Unique Uniprot IDs', kcat: kcatSummary.uniprotIds, km: kmSummary.uniprotIds, kcat_km: kcatKmSummary.uniprotIds },
      { label: 'Unique EC Numbers', kcat: kcatSummary.ecNumbers, km: kmSummary.ecNumbers, kcat_km: kcatKmSummary.ecNumbers },
      { label: 'Total Entries', kcat: kcatSummary.total, km: kmSummary.total, kcat_km: kcatKmSummary.total },
    ];

    return {
      kcat: kcatSummary,
      km: kmSummary,
      kcat_km: kcatKmSummary,
      dataset,
    };
  }

  generateECMap(df: any): Record<string, number> {
    const ecMap: Record<string, number> = {};

    df.forEach((row: any) => {
      // EC number is in format of x.x.x.x, build ecMap hierarchy
      let acc = '';
      for (let i = 0; i < 4; i++) {
        acc += row['EC'].split('.')[i] + '.';
        const ecLabel = acc + Array(3 - i).fill('*').join('.');
        ecMap[ecLabel] = (ecMap[ecLabel] || 0) + 1;
      }
    });

    return ecMap;
  }

  generatePieChart(type: 'kcat' | 'km' | 'kcat_km', df: any): ChartData {
    const ecMap: Record<string, number> = this.generateECMap(df);

    const data = Object.entries(ecMap)
      .filter(([ec, count]) => ec.match(/\d+\.\*\.\*\.\*/))
      .map(([ec, count]) => ({ ec, count }));

    return {
      status: 'loaded',
      data: {
        labels: data.map((d) => d.ec),
        datasets: [
          {
            data: data.map((d) => d.count),
            total: data.reduce((acc, d) => acc + d.count, 0),
            backgroundColor: this.chartConfigs['pieChart']['styleConfig']['backgroundColor'],
            hoverBackgroundColor: this.chartConfigs['pieChart']['styleConfig']['hoverBackgroundColor'],
          },
        ],
      },
      options: {
        // events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
        onHover: (e: any, chartElement: any) => {
          if (chartElement.length > 0) {
            this.chartState = {
              state: 'hovering',
              payload: chartElement[0].index,
            };
          }
        },
        onClick: (e: any, chartElement: any) => {
          if (chartElement.length > 0) {
            this.chartState = {
              state: 'focused',
              payload: chartElement[0].index,
            };
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: false,
            external: (context: any) => {
              // Tooltip Element
              let tooltipEl = document.getElementById('chartjs-tooltip1');

              // Create element on first render
              if (!tooltipEl) {
                tooltipEl = document.createElement('div');
                tooltipEl.id = 'chartjs-tooltip1';
                document.body.appendChild(tooltipEl);
              }

              // Hide if no tooltip
              const tooltipModel = context.tooltip;
              if (tooltipModel.opacity === 0) {
                tooltipEl.style.opacity = '0';
                return;
              }

              // Set caret Position
              tooltipEl.classList.remove('above', 'below', 'no-transform');
              if (tooltipModel.yAlign) {
                tooltipEl.classList.add(tooltipModel.yAlign);
              } else {
                tooltipEl.classList.add('no-transform');
              }
              // Set Text
              if (tooltipModel.body) {
                const dataPoint = context.tooltip.dataPoints[0];

                console.log(dataPoint);
                // console.log(this.ecSummary[dataPoint.dataIndex]);

                tooltipEl.innerHTML = `
                  <div class="flex flex-col bg-black/90 text-sm p-2 text-white rounded-md shadow-sm gap-2">
                    <div class="font-semibold">${this.kineticsLabelsMap.get(type)}</div>
                    <hr class="border-b-white border border-solid">
                    <div class="flex w-full justify-between gap-4">
                      <div class="flex items-center gap-1">
                        <div class="
                          w-4 h-4 rounded-full 
                          border border-solid border-white" 
                          style="background-color: ${this.chartConfigs['pieChart']['styleConfig']['backgroundColor'][dataPoint.dataIndex]}">
                        </div>
                        <span>${this.ecSummary[dataPoint.dataIndex].label}</span>
                      </div>
                      <div class="flex font-semibold">
                        ${dataPoint.formattedValue} (${(dataPoint.raw / dataPoint.dataset.total * 100).toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                `;
              }


              const position = context.chart.canvas.getBoundingClientRect();

              // Display, position, and set styles for font
              tooltipEl.style.opacity = '1';
              tooltipEl.style.position = 'absolute';
              tooltipEl.style.left = position.left + window.scrollX + tooltipModel.caretX + 'px';
              tooltipEl.style.top = position.top + window.scrollY + tooltipModel.caretY + 'px';
              tooltipEl.style.font = '12px sans-serif';
              tooltipEl.style.padding = '10px 15px';
              tooltipEl.style.pointerEvents = 'none';
            }
          },
        }
      },
      plugins: [
        {
          id: 'event-catcher',
          beforeEvent: (chart: any, args: any) => {
            if (args.event.type === 'mouseout') {
              this.chartState = {
                state: 'mouseout',
                payload: null,
              };
            }
          }
        }
      ],
    };
  }

  generateHistogram(dfs: any[]): ChartData {
    const ecMaps: { ec: string, count: number }[][] = dfs
      .map((df) => Object.entries(this.generateECMap(df))
        .filter(([ec, count]) => ec.match(/\d+\.\*\.\*\.\*/)) // only use top level ECs
        .map(([ec, count]) => ({ ec, count }))
      );

    return {
      status: 'loaded',
      data: {
        labels: ecMaps[0].map((_, i) => this.ecSummary[i].label),
        datasets: ecMaps.map((ecMap, i) => ({
          label: ['kcat', 'km', 'kcat/km'][i],
          data: ecMap.map((d) => d.count),
          total: ecMap.reduce((acc, d) => acc + d.count, 0),
          backgroundColor: this.chartConfigs['barChart']['styleConfig']['backgroundColor'][i],
          hoverBackgroundColor: this.chartConfigs['barChart']['styleConfig']['hoverBackgroundColor'][i],
        })),
      },
      options: {
        onClick: (e: any, chartElement: any) => {
          if (chartElement.length > 0) {
            this.chartState = {
              state: 'focused',
              payload: chartElement[0].index,
            };
          }
        },
        onHover: (e: any, chartElement: any) => {
          if (chartElement.length > 0) {
            this.chartState = {
              state: 'hovering',
              payload: {
                activeIndex: chartElement[0].index,
                datasetIndex: chartElement[0].datasetIndex,
              },
            };
          }
        },
        plugins: {
          legend: { display: false },
          htmlLegend: {
            containerID: 'legend-container',
          },
          tooltip: {
            enabled: false,
            external: (context: any) => {
              // Tooltip Element
              let tooltipEl = document.getElementById('chartjs-tooltip');

              // Create element on first render
              if (!tooltipEl) {
                tooltipEl = document.createElement('div');
                tooltipEl.id = 'chartjs-tooltip';
                document.body.appendChild(tooltipEl);
              }

              // Hide if no tooltip
              const tooltipModel = context.tooltip;
              if (tooltipModel.opacity === 0) {
                tooltipEl.style.opacity = '0';
                return;
              }

              // Set caret Position
              tooltipEl.classList.remove('above', 'below', 'no-transform');
              if (tooltipModel.yAlign) {
                tooltipEl.classList.add(tooltipModel.yAlign);
              } else {
                tooltipEl.classList.add('no-transform');
              }
              // Set Text
              if (tooltipModel.body) {

                const dataPoint = context.tooltip.dataPoints[0];

                tooltipEl.innerHTML = `
                  <div class="flex flex-col bg-black/90 text-sm p-2 text-white rounded-md shadow-sm gap-2">
                    <div class="font-semibold">${context.tooltip.title}</div>
                    <hr class="border-b-white border border-solid">
                    <div class="flex w-full justify-between gap-4">
                      <div class="flex items-center gap-1">
                        <div class="
                          w-4 h-4 rounded-full 
                          border border-solid border-white" 
                          style="background-color: ${this.chartConfigs['barChart']['styleConfig']['backgroundColor'][dataPoint.datasetIndex]}">
                        </div>
                        <span>${Array.from(this.kineticsLabelsMap.values())[dataPoint.datasetIndex]}</span>
                      </div>
                      <div class="flex font-semibold">
                        ${dataPoint.formattedValue} (${(dataPoint.raw / dataPoint.dataset.total * 100).toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                `;
              }


              const position = context.chart.canvas.getBoundingClientRect();

              // Display, position, and set styles for font
              tooltipEl.style.opacity = '1';
              tooltipEl.style.position = 'absolute';
              tooltipEl.style.left = position.left + window.scrollX + tooltipModel.caretX + 'px';
              tooltipEl.style.top = position.top + window.scrollY + tooltipModel.caretY + 'px';
              tooltipEl.style.font = '12px sans-serif';
              tooltipEl.style.padding = '10px 15px';
              tooltipEl.style.pointerEvents = 'none';
            }
          },
        }
      },
      plugins: [
        {
          id: 'event-catcher',
          beforeEvent: (chart: any, args: any) => {
            if (args.event.type === 'mouseout') {
              this.chartState = {
                state: 'mouseout',
                payload: null,
              };
            }
          }
        },
        {
          id: 'htmlLegend',
          afterUpdate: (chart: any, args: any, options: any) => {
            const legendContainer = document.getElementById(options.containerID);
            let listContainer = legendContainer?.querySelector('ul');

            if (!listContainer) {
              listContainer = document.createElement('ul');
              listContainer.style.display = 'flex';
              listContainer.style.flexDirection = 'row';
              listContainer.style.margin = '0';
              listContainer.style.padding = '0';

              legendContainer?.appendChild(listContainer);
            }

            // Remove old legend items
            while (listContainer?.firstChild) {
              listContainer.firstChild.remove();
            }

            // Reuse the built-in legendItems generator
            const items = chart.options.plugins.legend.labels.generateLabels(chart);

            items.forEach((item: any, index: number) => {
              const li = document.createElement('li');
              li.style.alignItems = 'center';
              li.style.cursor = 'pointer';
              li.style.display = 'flex';
              li.style.flexDirection = 'row';
              li.style.marginLeft = '.5rem';

              li.onclick = () => {
                chart.setDatasetVisibility(item.datasetIndex, !chart.isDatasetVisible(item.datasetIndex));
                chart.update();
              };

              // Color box
              const boxSpan = document.createElement('span');
              boxSpan.style.background = this.chartConfigs['barChart']['styleConfig']['backgroundColor'][index];
              boxSpan.style.borderColor = item.strokeStyle;
              boxSpan.style.borderWidth = item.lineWidth + 'px';
              boxSpan.style.display = 'inline-block';
              boxSpan.style.flexShrink = '0';
              boxSpan.style.height = '.75rem';
              boxSpan.style.marginRight = '.5rem';
              boxSpan.style.width = '3rem';

              // Text
              const textContainer = document.createElement('p');
              textContainer.style.color = item.fontColor;
              textContainer.style.margin = '0';
              textContainer.style.padding = '0';
              textContainer.style.textDecoration = item.hidden ? 'line-through' : '';
              textContainer.innerHTML = Array.from(this.kineticsLabelsMap.values())[index];

              li.appendChild(boxSpan);
              li.appendChild(textContainer);
              listContainer?.appendChild(li);
            });
          }
        }
      ],
    };
  }

  highlightAllPieCharts(activeIndex: number) {
    // Reset all segments
    const pieChartStyleConfig = this.chartConfigs['pieChart']['styleConfig'];
    this.charts.filter((chart) => chart.type === 'pie').forEach((chart) => {
      const hexDimOpacity = Math.round(pieChartStyleConfig['dimOpacity'] * 255).toString(16);
      chart.data.datasets[0].backgroundColor = [...pieChartStyleConfig['backgroundColor'].map((color: string) => color + hexDimOpacity)];
      chart.data.datasets[0].backgroundColor[activeIndex] = pieChartStyleConfig['hoverBackgroundColor'][activeIndex];
      chart.chart.update();
    });
  }

  highlightAllBarCharts(activeIndex: number) {
    // Reset all segments
    const barChartStyleConfig = this.chartConfigs['barChart']['styleConfig'];
    this.charts.filter((chart) => chart.type === 'bar').forEach((chart) => {
      // console.log(chart, bar);
      const hexDimOpacity = Math.round(barChartStyleConfig['dimOpacity'] * 255).toString(16);
      chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
        dataset.backgroundColor = Array(dataset.data.length).fill(barChartStyleConfig['backgroundColor'][datasetIndex] + hexDimOpacity);
        dataset.backgroundColor[activeIndex] = barChartStyleConfig['backgroundColor'][datasetIndex];
      });
      chart.chart.update();
    });
  }

  highlightSingleBarChart({ activeIndex, datasetIndex }: { activeIndex: number, datasetIndex: number }) {
    // Reset all segments
    console.log('highlighting single bar chart', activeIndex, datasetIndex);
    const barChartStyleConfig = this.chartConfigs['barChart']['styleConfig'];
    this.charts.filter((chart) => chart.type === 'bar').forEach((chart) => {
      // console.log(chart, bar);
      const hexDimOpacity = Math.round(barChartStyleConfig['dimOpacity'] * 255).toString(16);
      chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
        dataset.backgroundColor = Array(dataset.data.length).fill(barChartStyleConfig['backgroundColor'][datasetIndex] + hexDimOpacity);
      });
      chart.data.datasets[datasetIndex].backgroundColor[activeIndex] = barChartStyleConfig['backgroundColor'][datasetIndex];
      chart.chart.update();
    });
  }

  resetPieChartHighlight() {
    this.charts.filter((chart) => chart.type === 'pie').forEach((chart) => {
      chart.data.datasets[0].backgroundColor = [...this.chartConfigs['pieChart']['styleConfig']['backgroundColor']];
      chart.chart.update();
    });
  }

  resetBarChartHighlight() {
    const barChartStyleConfig = this.chartConfigs['barChart']['styleConfig'];
    this.charts.filter((chart) => chart.type === 'bar').forEach((chart) => {
      chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
        dataset.backgroundColor = Array(dataset.data.length).fill(barChartStyleConfig['backgroundColor'][datasetIndex]);
      });
      chart.chart.update();
    });
  }

  scrollToDataSnapshot() {
    this.dataSnapshot.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }
}
