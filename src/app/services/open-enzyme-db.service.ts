import { Injectable } from "@angular/core";
import { Observable, from, map, of } from "rxjs";

import { BodyCreateJobJobTypeJobsPost, ChemicalAutoCompleteResponse, FilesService, Job, JobType, JobsService, SharedService } from "../api/mmli-backend/v1";
import { EnvironmentService } from "./environment.service";

// import { OpenEnzymeDBService as OpenEnzymeDBApiService } from "../api/mmli-backend/v1"; // TODO: use the correct service
// import exampleStatus from '../../assets/example_status.json';

import { ungzip } from 'pako';

async function loadGzippedJson<T>(path: string): Promise<T> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Check if the file starts with the gzip magic numbers (1f 8b)
    if (uint8Array[0] === 0x1f && uint8Array[1] === 0x8b) {
      const decompressed = ungzip(uint8Array, { to: 'string' });
      return JSON.parse(decompressed);
    } else {
      // Not gzipped, just parse as regular JSON
      const text = new TextDecoder().decode(uint8Array);
      return JSON.parse(text);
    }
  } catch (error) {
    console.error(`Error loading JSON from ${path}:`, error);
    throw error;
  }
}

const exampleStatus: any = "WARNING: please provide your own example_status.json";
// const example: any = "WARNING: please provide your own example.json";

export type OEDRecord = {
  "EC": string,
  "SUBSTRATE": string,
  "ORGANISM": string,
  "UNIPROT": string,
  "EnzymeType": string,
  "PH": number,
  "Temperature": number,
  "PubMedID": number,
  "KCAT VALUE": number,
  "SMILES": string,
  "KM VALUE": number,
  "KCAT/KM VALUE": number,
  "Lineage": string[],
};

const example = loadGzippedJson<OEDRecord[]>('/assets/example.json.gz');
const kcat = loadGzippedJson<OEDRecord[]>('/assets/data_df_KCAT.json.gz');
const km = loadGzippedJson<OEDRecord[]>('/assets/data_df_KM.json.gz');
const kcat_km = loadGzippedJson<OEDRecord[]>('/assets/data_df_KCATKM.json.gz');


@Injectable({
  providedIn: "root",
})
export class OpenEnzymeDBService {
  frontendOnly = false;

  readonly KCAT_DF$ = from(kcat) ;
  readonly KM_DF$ = from(km);
  readonly KCAT_KM_DF$ = from(kcat_km);
  readonly LINEAGE_DF$ = from(example);

  public readonly WHITE_PAPER_URL = '';
  public readonly VISION_URL = 'https://docs.google.com/document/d/17nfpqWG8N8uS4wGpNlUumwknwh7kIsKp2rZNv6TLYyk/edit?usp=sharing';
  public readonly FEEDBACK_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfISchgT9oNHL5f0_Ev1T0BD736AakYnS4GUuJJdtA9fxF78A/viewform';

  constructor(
    private jobsService: JobsService,
    private filesService: FilesService,
    private environmentService: EnvironmentService,
    private sharedService: SharedService,

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

  getResult(jobType: JobType, jobID: string): Observable<OEDRecord[]> {
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

  validateChemical(smiles: string): Observable<any> {
    return this.sharedService.drawSmilesSmilesDrawGet(smiles).pipe(
      map((res) => {
        return {
          smiles: smiles,
          structure: res,
        } as ChemicalAutoCompleteResponse;
      })
    );
  }
}
