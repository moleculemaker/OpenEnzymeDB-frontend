import { Component } from '@angular/core';
import { JobTabComponent } from '../job-tab/job-tab.component';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { Loadable } from "~/app/models/Loadable";
import { OpenEnzymeDBService } from '~/app/services/openenzymedb.service';
import { ActivatedRoute } from '@angular/router';
import { JobType } from '~/app/api/mmli-backend/v1';
import { SkeletonModule } from 'primeng/skeleton';
import { PropertyPredictionJobInfo } from "../property-prediction-result/property-prediction-result.component";
import { MoleculeImageComponent } from '../molecule-image/molecule-image.component';
import { DensityPlotComponent } from '../density-plot/density-plot.component';
import { map } from 'rxjs';
import { AsyncPipe, CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { PropertyPredictionComponent } from '../property-prediction/property-prediction.component';

@Component({
  selector: 'app-property-prediction-detail',
  standalone: true,
  imports: [
    PanelModule,
    TableModule,
    CommonModule,
    SkeletonModule,
    AsyncPipe,
    ButtonModule,
    TieredMenuModule,

    // SafePipe,
    // DensityPlotComponent,
    JobTabComponent,
    MoleculeImageComponent,
    DensityPlotComponent,
    PropertyPredictionComponent,
  ],
  templateUrl: './property-prediction-detail.component.html',
  styleUrl: './property-prediction-detail.component.scss'
})
export class PropertyPredictionDetailComponent {
  jobId: string = this.route.snapshot.paramMap.get("id") || "example-id";
  index: number = parseInt(this.route.snapshot.paramMap.get("index") || "0");
  algorithm: 'dlkcat' | 'unikp' | 'catpred'
    = this.route.snapshot.paramMap.get("algorithm") as 'dlkcat' | 'unikp' | 'catpred';

  currentPage = 'result';

  result: Loadable<any> = {
    status: 'loading',
    data: null,
  };

  jobInfo: PropertyPredictionJobInfo = {
    smiles: '',
    sequence: 'loading ...',
    name: '',
  }

  // exportOptions = [
  //   {
  //     label: 'Table Results',
  //     command: () => { },
  //   },
  // ];

  columns: any[] = [
    { field: 'compound.name', header: 'compound' },
    { field: this.algorithm, header: this.algorithm },
  ];

  kcat$ = this.service.getData().pipe(
    map((data) => data.map((d) => d['KCAT VALUE']).filter((kcat) => kcat !== null))
  );

  km$ = this.service.getData().pipe(
    map((data) => data.map((d) => d['KM VALUE']).filter((km) => km !== null))
  );

  kcatKm$ = this.service.getData().pipe(
    map((data) => data.map((d) => d['KCAT/KM VALUE']).filter((kcat) => kcat !== null))
  );

  constructor(
    private service: OpenEnzymeDBService,
    private route: ActivatedRoute,
  ) {
    this.loadJobInfo();
    this.loadResult();
  }

  loadJobInfo() {
    const jobType = this.algorithm === 'catpred' ? JobType.OedCatpred
      : (this.algorithm === 'unikp' ? JobType.OedUnikp
        : JobType.OedDlkcat);
    this.service.getResultStatus(jobType, this.jobId).subscribe((result) => {
      this.jobInfo = {
        ...(JSON.parse(result.job_info || '{}'))['input_pairs'][this.index],
        email: result.email || '',
      };
      console.log(this.jobInfo);
    });
  }

  loadResult() {
    switch (this.algorithm) {
      case 'dlkcat':
        this.service.getDLKcatResult(this.jobId).subscribe((result) => {
          this.result = {
            status: 'loaded',
            data: {
              kcat: result[this.index].kcat,
            },
          };
        });
        break;

      case 'unikp':
        this.service.getUnikpResult(this.jobId).subscribe((result) => {
          this.result = {
            status: 'loaded',
            data: {
              kcat: result[this.index].kcat,
              km: result[this.index].km,
              kcat_km: result[this.index].kcat_km,
            },
          };
        });
        break;

      case 'catpred':
        this.service.getCatpredResult(this.jobId).subscribe((result) => {
          this.result = {
            status: 'loaded',
            data: {
              kcat: result[this.index].kcat,
              km: result[this.index].km,
              ki: result[this.index].ki,
            },
          };
        });
        break;
    }
  }

  backToSearch() {
    history.back();
  }

  onExport() {
    // export this.result.data as csv
    console.log(this.result.data);
    const header = ['substrate', 'sequence name', 'sequence', ...Object.keys(this.result.data)].join(',');
    const values = [this.jobInfo.smiles, this.jobInfo.name, this.jobInfo.sequence, ...Object.values(this.result.data)].join(',');
    const csv = [header, values].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.jobId}-${this.algorithm}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  }

  copyAndPasteURL(): void {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = window.location.href;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
  }
}
