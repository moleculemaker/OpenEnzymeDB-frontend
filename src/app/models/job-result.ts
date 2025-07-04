import { timer, switchMap, tap, takeWhile, BehaviorSubject, skipUntil, filter, delay, shareReplay } from "rxjs";
import { JobStatus, JobType } from "~/app/api/mmli-backend/v1";
import { OpenEnzymeDBService } from '~/app/services/openenzymedb.service';

export class JobResult<TInfo, TResult> {
    jobId: string;
    jobType: JobType;
    jobInfo: TInfo;

    isLoading$ = new BehaviorSubject(true);
    resultLoaded$ = new BehaviorSubject(false);

    statusResponse$ = timer(0, 10000).pipe(
        switchMap(() => this.service.getResultStatus(
            this.jobType,
            this.jobId,
        )),
        tap((data) => this.jobInfo = {
            ...JSON.parse(data.job_info || '{}'),
            email: data.email || '',
        }),
        tap(() => this.resultLoaded$.value ? null : this.isLoading$.next(true)),
        takeWhile((data) =>
            data.phase === JobStatus.Processing
            || data.phase === JobStatus.Queued
            , true),
        tap((data) => { console.log('job status: ', data) }),
    );

    jobResultResponse$ = this.statusResponse$.pipe(
        skipUntil(this.statusResponse$.pipe(filter((job) => job.phase === JobStatus.Completed))),
        switchMap(() => this.service.getResult<TResult>(this.jobType, this.jobId)),
        delay(1000),
        tap(() => this.isLoading$.next(false)),
        tap(() => this.resultLoaded$.next(true)),
        tap((data) => { console.log('result: ', data) }),
        shareReplay(1),
    );

    constructor(
        public service: OpenEnzymeDBService,
    ) { }
}