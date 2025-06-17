import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { JobStatus, JobType } from '~/app/api/mmli-backend/v1';
import { CatpredResult, DLKCatResult, OpenEnzymeDBService, UnikpResult } from '~/app/services/openenzymedb.service';
import { LoadingComponent } from '~/app/components/loading/loading.component';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { combineLatest, forkJoin, map, Subscription, tap } from 'rxjs';

export type PropertyPredictionJobInfo = {
  sequence: string;
  smiles: string;
  name: string;
};

@Component({
  selector: 'app-property-prediction-result',
  templateUrl: './property-prediction-result.component.html',
  styleUrls: ['./property-prediction-result.component.scss'],
  standalone: true,
  imports: [
    TableModule,
    PanelModule,
    RouterLink,

    CommonModule,
    LoadingComponent,
  ],
  host: {
    class: 'flex flex-col h-full',
  }
})
export class PropertyPredictionResultComponent {

  jobs = {
    dlkcat: {
      id: this.route.snapshot.paramMap.get("dlkcat") || "example-id",
      type: JobType.OedDlkcat,
      info: null,
    },
    unikp: {
      id: this.route.snapshot.paramMap.get("unikp") || "example-id",
      type: JobType.OedUnikp,
      info: null,
    },
    catpred: {
      id: this.route.snapshot.paramMap.get("catpred") || "example-id",
      type: JobType.OedCatpred,
      info: null,
    },
  }

  statusResponse$ = combineLatest([
    this.service.getResultStatus(this.jobs.dlkcat.type, this.jobs.dlkcat.id),
    this.service.getResultStatus(this.jobs.unikp.type, this.jobs.unikp.id),
    this.service.getResultStatus(this.jobs.catpred.type, this.jobs.catpred.id),
  ]).pipe(
    tap(([dlkcat, unikp, catpred]) => {
      this.jobs.dlkcat.info = {
        ...JSON.parse(dlkcat.job_info || '{}'),
        email: dlkcat.email || '',
      };
      this.jobs.unikp.info = {
        ...JSON.parse(unikp.job_info || '{}'),
        email: unikp.email || '',
      };
      this.jobs.catpred.info = {
        ...JSON.parse(catpred.job_info || '{}'),
        email: catpred.email || '',
      };
    }),
    map(([dlkcat, unikp, catpred]) => ({
      time_created: dlkcat.time_created!,
      phase: 
      [dlkcat.phase, unikp.phase, catpred.phase].some((phase) => phase === JobStatus.Processing || phase === JobStatus.Queued) 
        ? JobStatus.Processing 
        : (
          [dlkcat.phase, unikp.phase, catpred.phase].some((phase) => phase === JobStatus.Error)
          ? JobStatus.Error 
          : JobStatus.Completed
        ),
      email: dlkcat.email || unikp.email || catpred.email || '',
      job_id: dlkcat.job_id || unikp.job_id || catpred.job_id || '',
    })),
  );
  data$ = this.service.getData();

  showResults = false;
  results: any = null;
  columns = [];
  subscriptions: Subscription[] = [];

  constructor(
    private service: OpenEnzymeDBService,
    private route: ActivatedRoute,
  ) { }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
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

  onProgressChange(value: number): void {
    if (value === 100) {
      this.subscriptions.push(
        forkJoin([
          this.service.getDLKcatResult(this.jobs.dlkcat.id),
          this.service.getUnikpResult(this.jobs.unikp.id),
          this.service.getCatpredResult(this.jobs.catpred.id),
        ]).pipe(
          map((data) => data as unknown as [DLKCatResult, UnikpResult, CatpredResult]),
          map(([dlkcat, unikp, catpred]) => ([
            {
              algorithm: 'dlkcat',
              values: {
                kcat: dlkcat[0].kcat
              }
            },
            {
              algorithm: 'unikp',
              values: {
                kcat: unikp[0].kcat,
                kcat_km: unikp[0].kcat_km,
                km: unikp[0].km
              }
            },
            {
              algorithm: 'catpred',
              values: {
                kcat: catpred[0].kcat,
                km: catpred[0].km,
                ki: catpred[0].ki,
              }
            }
          ])),
          tap((data) => { console.log('result: ', data) }),
        ).subscribe((data) => {
          this.showResults = true;
          this.results = data;
        })
      );
    }
  }
}

