import { ChangeDetectorRef, Component } from '@angular/core';
import { JobTabComponent } from '../job-tab/job-tab.component';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { JobResult } from '~/app/models/job-result';
import { Loadable } from '~/app/services/openenzymedb.service';
import { FilterService } from 'primeng/api';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { OpenEnzymeDBService } from '~/app/services/openenzymedb.service';
import { ActivatedRoute } from '@angular/router';
import { JobType } from '~/app/api/mmli-backend/v1';
import { SkeletonModule } from 'primeng/skeleton';
import { PropertyPredictionJobInfo } from "../property-prediction-result/property-prediction-result.component";
import { MoleculeImageComponent } from '../molecule-image/molecule-image.component';
import { DensityPlotComponent } from '../density-plot/density-plot.component';
import { map } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-property-prediction-detail',
  standalone: true,
  imports: [
    JobTabComponent,
    PanelModule,
    TableModule,
    SkeletonModule,
    AsyncPipe,

    // SafePipe,
    // DensityPlotComponent,
    MoleculeImageComponent,
    DensityPlotComponent,
  ],
  templateUrl: './property-prediction-detail.component.html',
  styleUrl: './property-prediction-detail.component.scss'
})
export class PropertyPredictionDetailComponent extends JobResult<PropertyPredictionJobInfo> {
  override jobId: string = this.route.snapshot.paramMap.get("id") || "example-id";
  override jobType: JobType = JobType.OedCheminfo;
  algorithm: 'dlkcat' | 'unikp' | 'catpred' 
    = this.route.snapshot.paramMap.get("algorithm") as 'dlkcat' | 'unikp' | 'catpred';

  currentPage = 'result';

  result: Loadable<any> = {
    status: 'loading',
    data: {
      kcat: 0.783,
      km: 0.01,
      kcatKm: 0.783,
    }
  };

  override jobInfo: PropertyPredictionJobInfo = {
    substrate: 'CCO',
    enzyme: 'P0DP23'
  }

  exportOptions = [
    {
      label: 'Table Results',
      command: () => {},
    },
  ];

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
    service: OpenEnzymeDBService,
    private route: ActivatedRoute,
  ) {
    super(service);
  }

  backToSearch() {
    history.back();
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
