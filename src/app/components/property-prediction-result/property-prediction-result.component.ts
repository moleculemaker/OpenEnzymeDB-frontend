import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { JobStatus, JobType } from '~/app/api/mmli-backend/v1';
import { CatpredResult, DLKCatResult, OpenEnzymeDBService, UnikpResult } from '~/app/services/openenzymedb.service';
import { LoadingComponent } from '~/app/components/loading/loading.component';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { BehaviorSubject, combineLatest, delay, filter, forkJoin, map, shareReplay, skipUntil, switchMap, takeWhile, tap, timer } from 'rxjs';

export type PropertyPredictionJobInfo = {
  sequence: string;
  substrate: string;
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

  isLoading$ = new BehaviorSubject(true);
  resultLoaded$ = new BehaviorSubject(false);

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
    tap(() => this.resultLoaded$.value ? null : this.isLoading$.next(true)),
    takeWhile(([dlkcat, unikp, catpred]) =>
      (dlkcat.phase === JobStatus.Processing || dlkcat.phase === JobStatus.Queued)
      || (unikp.phase === JobStatus.Processing || unikp.phase === JobStatus.Queued)
      || (catpred.phase === JobStatus.Processing || catpred.phase === JobStatus.Queued)
      , true),
    tap((data) => { console.log('job status: ', data) }),
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

  jobResultResponse$ = this.statusResponse$.pipe(
    skipUntil(this.statusResponse$.pipe(filter((data) =>
      data.phase === JobStatus.Completed
    ))),
    tap((data) => { console.log('job completed, get result') }),
    switchMap(() => forkJoin([
      this.service.getDLKcatResult(this.jobs.dlkcat.id),
      this.service.getUnikpResult(this.jobs.unikp.id),
      this.service.getCatpredResult(this.jobs.catpred.id),
    ])),
    switchMap(() => import('~/assets/example.prediction.json').then((res) => res.default)),
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
          kcat: -1, //catpred[0].kcat,
          km: -1, //catpred[0].km,
          ki: -1, //catpred[0].ki,
        }
      }
    ])),
    delay(1000),
    tap(() => this.isLoading$.next(false)),
    tap(() => this.resultLoaded$.next(true)),
    tap((data) => { console.log('result: ', data) }),
    tap((data) => this.results = data),
    shareReplay(1),
);

  columns = [

  ];

  results = null;

  data$ = this.service.getData();

  constructor(
    private service: OpenEnzymeDBService,
    private route: ActivatedRoute,
  ) {

    // this.service.getPredictionResult(this.dlkcatJobId, this.unikpJobId, this.catpredJobId).subscribe((results) => {
    //   this.results = results;
    // });
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

