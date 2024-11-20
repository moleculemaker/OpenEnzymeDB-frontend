import { Injectable } from "@angular/core";
import { Observable, from, map, of } from "rxjs";

import { BodyCreateJobJobTypeJobsPost, FilesService, Job, JobType, JobsService } from "../api/mmli-backend/v1";
import { EnvironmentService } from "./environment.service";
import katex from "katex";

// import { OpenEnzymeDBService as OpenEnzymeDBApiService } from "../api/mmli-backend/v1"; // TODO: use the correct service
// import exampleStatus from '../../assets/example_status.json';
const example = import('../../assets/example.json').then(res => res.default);
const kcat = import('../../assets/data_df_KCAT.json').then(res => res.default);
const km = import('../../assets/data_df_KM.json').then(res => res.default);
const kcat_km = import('../../assets/data_df_KCATKM.json').then(res => res.default);

const exampleStatus: any = "WARNING: please provide your own example_status.json";
// const example: any = "WARNING: please provide your own example.json";

@Injectable({
  providedIn: "root",
})
export class OpenEnzymeDBService {
  frontendOnly = false;

  readonly KCAT_DF$ = from(kcat) ;
  readonly KM_DF$ = from(km);
  readonly KCAT_KM_DF$ = from(kcat_km);

  readonly KATEX_MATHML = {
    kcatWithUnit: katex.renderToString('K_{cat} (s^{-1})', { output: 'mathml' }),
    kmWithUnit: katex.renderToString('K_m (mM)', { output: 'mathml' }),
    kcatKmWithUnit: katex.renderToString('K_{cat}/K_m (M^{-1}s^{-1})', { output: 'mathml' }),
    kcatUnit: katex.renderToString('s^{-1}', { output: 'mathml' }),
    kmUnit: katex.renderToString('mM', { output: 'mathml' }),
    kcatKmUnit: katex.renderToString('M^{-1}s^{-1}', { output: 'mathml' }),
    kcat: katex.renderToString('K_{cat}', { output: 'mathml' }),
    km: katex.renderToString('K_m', { output: 'mathml' }),
    kcatKm: katex.renderToString('K_{cat}/K_m', { output: 'mathml' }),
  }

  constructor(
    private jobsService: JobsService,
    private filesService: FilesService,
    private environmentService: EnvironmentService,

    // private apiService: OpenEnzymeDBApiService,
  ) {
    this.frontendOnly = this.environmentService.getEnvConfig().frontendOnly === "true";
  }

  createAndRunJob(jobType: JobType, requestBody: BodyCreateJobJobTypeJobsPost): Observable<Job> {
    if (this.frontendOnly) {
      return of(exampleStatus as any);
    }
    return this.jobsService.createJobJobTypeJobsPost(jobType, requestBody);
  }

  getResultStatus(jobType: JobType, jobID: string): Observable<Job> {
    if (this.frontendOnly) {
      return of(exampleStatus as any);
    }
    return this.jobsService.listJobsByTypeAndJobIdJobTypeJobsJobIdGet(jobType, jobID)
      .pipe(map((jobs) => jobs[0]));
  }

  getResult(jobType: JobType, jobID: string): Observable<any> {
    if (this.frontendOnly) {
      return from(example);
    }
    return this.filesService.getResultsBucketNameResultsJobIdGet(jobType, jobID);
  }

  getError(jobType: JobType, jobID: string): Observable<string> {
    if (this.frontendOnly) {
      return of('error');
    }
    return this.filesService.getErrorsBucketNameErrorsJobIdGet(jobType, jobID);
  }

  updateSubscriberEmail(jobType: JobType, jobId: string, email: string) {
    if (this.frontendOnly) {
      return of(exampleStatus as any);
    }
    return this.jobsService.patchExistingJobJobTypeJobsJobIdRunIdPatch(jobType, {
      job_id: jobId,
      run_id: 0,
      email: email,
    });
  }
}
