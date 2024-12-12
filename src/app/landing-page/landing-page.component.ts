import { ChangeDetectorRef, Component, ElementRef, QueryList, ViewChild, ViewChildren } from "@angular/core";
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
  ],
  host: {
    class: 'flex flex-col justify-center items-center w-full'
  }
})
export class LandingPageComponent {
  @ViewChildren(UIChart) charts!: QueryList<UIChart>;
  @ViewChild('dataSnapshot') dataSnapshot!: ElementRef<HTMLDivElement>;

  dropdownOptions = [
    { label: 'Kinetic Parameters Summary', value: 'pieChart' },
    { label: 'EC Number Summary', value: 'barChart' },
  ];

  chartConfigs: {
    currentChart: 'pieChart' | 'barChart',
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
    currentChart: 'pieChart',

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

  #pieChartState: {
    state: PieChartState,
    payload: any
  } = {
    state: 'default',
    payload: null,
  }

  get pieChartState() {
    return this.#pieChartState;
  }

  set pieChartState(state: { 
    state: PieChartState, 
    payload: any 
  }) {
    const stateStr = `${this.#pieChartState.state}--->${state.state}`;

    switch (stateStr) {

      case 'default--->hovering':
      case 'default--->focused':
      case 'hovering--->focused':
      case 'hovering--->hovering':
      case 'hovering--->hovering-ec':
      case 'hovering-ec--->hovering-ec':
      case 'focused--->focused':
      case 'mouseout--->focused':
      case 'mouseout--->hovering':
        console.log('highlighting: ', stateStr, state.payload);
        this.highlightAllPieCharts(state.payload);
        break;

      case 'hovering--->mouseout':
      case 'hovering-ec--->mouseout-ec':
      case 'focused--->default':
        console.log('resetting highlight: ', stateStr);
        this.resetHighlight();
        break;

      case 'focused--->mouseout':
      case 'focused--->hovering':
      case 'focused--->mouseout-ec':
      case 'focused--->hovering-ec':
        // prevent mouseout from resetting the highlight
        return;

      default:
        // do nothing
        break;

    }

    this.#pieChartState = state;
    this.cdr.detectChanges();
  }

  #barChartState: {
    state: 'focused' | 'default',
    payload: any
  } = {
    state: 'default',
    payload: null,
  }

  get barChartState() {
    return this.#barChartState;
  }

  set barChartState(state: { 
    state: 'focused' | 'default', 
    payload: any 
  }) {
    this.#pieChartState = state;
    this.cdr.detectChanges();
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
  ) {

    combineLatest([
      service.KCAT_DF$,
      service.KM_DF$,
      service.KCAT_KM_DF$,
    ]).subscribe((dfs) => {
      const [kcatDf, kmDf, kcatKmDf] = dfs;
      this.chartConfigs['pieChart']['data']['kcat'] = this.generatePieChart(kcatDf);
      this.chartConfigs['pieChart']['data']['km'] = this.generatePieChart(kmDf);
      this.chartConfigs['pieChart']['data']['kcat_km'] = this.generatePieChart(kcatKmDf);
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
      this.pieChartState = {
        state: 'default',
        payload: null,
      };
      this.barChartState = {
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

  generatePieChart(df: any): ChartData {
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
            this.pieChartState = {
              state: 'hovering',
              payload: chartElement[0].index,
            };
          }
        },
        onClick: (e: any, chartElement: any) => {
          if (chartElement.length > 0) {
            this.pieChartState = {
              state: 'focused',
              payload: chartElement[0].index,
            };
          }
        },
        plugins: { 
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (tooltipItem: any) => {
                return `${this.ecSummary[tooltipItem.dataIndex].label}: ${tooltipItem.formattedValue} (${(tooltipItem.raw / tooltipItem.dataset.total * 100).toFixed(1)}%)`;
              }
            }
          },
        }
      },
      plugins: [
        {
          id: 'event-catcher',
          beforeEvent: (chart: any, args: any) => {
            if (args.event.type === 'mouseout') {
              this.pieChartState = {
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
          console.log(chartElement[0]);
          if (chartElement.length > 0) {
            this.barChartState = {
              state: 'focused',
              payload: chartElement[0].index,
            };
          }
        },
        plugins: { 
          // legend: { display: false },
          tooltip: {
            callbacks: {
              label: (tooltipItem: any) => {
                return `${tooltipItem.dataset.label}: ${tooltipItem.formattedValue} (${(tooltipItem.raw / tooltipItem.dataset.total * 100).toFixed(1)}%)`;
              }
            }
          },
        }
      },
      plugins: [],
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

  resetHighlight() {
    this.charts.filter((chart) => chart.type === 'pie').forEach((chart) => {
      chart.data.datasets[0].backgroundColor = [...this.chartConfigs['pieChart']['styleConfig']['backgroundColor']];
      chart.chart.update();
    });
  }

  scrollToDataSnapshot() {
    this.dataSnapshot.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }
}
