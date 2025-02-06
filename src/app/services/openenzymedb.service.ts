import { Injectable } from "@angular/core";
import { Observable, catchError, first, from, map, of } from "rxjs";

import { BodyCreateJobJobTypeJobsPost, ChemicalAutoCompleteResponse, FilesService, Job, JobType, JobsService, SharedService } from "../api/mmli-backend/v1";
import { EnvironmentService } from "./environment.service";

// import { OpenEnzymeDBService as OpenEnzymeDBApiService } from "../api/mmli-backend/v1"; // TODO: use the correct service
// import exampleStatus from '../../assets/example_status.json';

import { ungzip } from 'pako';
import { HttpErrorResponse } from "@angular/common/http";

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

export type ReactionSchemaRecord = {
  reactionPartners: string,
  reactants: string[],
  products: string[],
  ligandStructureId: number
}

export type LoadingStatus = 'loading' | 'loaded' | 'error' | 'na' | 'invalid';

export type Loadable<T> = {
  status: LoadingStatus;
  data: T | null;
}

const example = loadGzippedJson<OEDRecord[]>('/assets/example.json.gz');
const kcat = loadGzippedJson<OEDRecord[]>('/assets/data_df_KCAT.json.gz');
const km = loadGzippedJson<OEDRecord[]>('/assets/data_df_KM.json.gz');
const kcat_km = loadGzippedJson<OEDRecord[]>('/assets/data_df_KCATKM.json.gz');
const reaction_schema = loadGzippedJson<Record<string, ReactionSchemaRecord[]>>('/assets/reaction_schema.json.gz');

@Injectable({
  providedIn: "root",
})
export class OpenEnzymeDBService {
  frontendOnly = false;

  readonly KCAT_DF$ = from(kcat) ;
  readonly KM_DF$ = from(km);
  readonly KCAT_KM_DF$ = from(kcat_km);
  readonly LINEAGE_DF$ = from(example);

  private _WHITE_PAPER_URL = '';
  private _VISION_URL = '';
  private _FEEDBACK_URL = '';
  private _RELEASE_NOTES_URL = '';
  private chemicalImageCache: Record<string, Loadable<string>> = {};

  public get WHITE_PAPER_URL() {
    return this._WHITE_PAPER_URL;
  }
  
  public get VISION_URL() {
    return this._VISION_URL;
  }

  public get FEEDBACK_URL() {
    return this._FEEDBACK_URL;
  }

  public get RELEASE_NOTES_URL() {
    return this._RELEASE_NOTES_URL;
  }

  constructor(
    private jobsService: JobsService,
    private filesService: FilesService,
    private environmentService: EnvironmentService,
    private sharedService: SharedService,

    // private apiService: OpenEnzymeDBApiService,
  ) {
    this.frontendOnly = this.environmentService.getEnvConfig().frontendOnly === "true";
    this._WHITE_PAPER_URL = this.environmentService.getEnvConfig().whitePaperUrl;
    this._VISION_URL = this.environmentService.getEnvConfig().visionUrl;
    this._FEEDBACK_URL = this.environmentService.getEnvConfig().feedbackUrl;
    this._RELEASE_NOTES_URL = this.environmentService.getEnvConfig().releaseNotesUrl;
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

  getReactionSchemasFor(ecNumber: string, substrate: string, organism: string): Observable<ReactionSchemaRecord[]> {
    return from(reaction_schema).pipe(
      map((records) => records[`${ecNumber}|${substrate}|${organism}`.toLowerCase()]),
      first()
    );
  }

  getChemicalImageFromName(
    name: string, 
    width: number = 200, 
    height: number = 200
  ): Observable<Loadable<string>> {
    if (this.chemicalImageCache[name]) {
      return of(this.chemicalImageCache[name]);
    }

    return new Observable(observer => {
      observer.next({ status: 'loading', data: null });
      
      fetch(`https://cactus.nci.nih.gov/chemical/structure/${name}/smiles`)
        .then((res: Response) => {
          if (res.status !== 200) {
            throw new HttpErrorResponse({
              status: res.status,
              statusText: res.statusText,
            });
          }
          return res.text();
        })
        .then(smiles => {
          this.sharedService.drawSmilesSmilesDrawGet(smiles)
            .subscribe((res) => {
              const loadable: Loadable<string> = {
                status: 'loaded',
                data: res
              };
              this.chemicalImageCache[name] = loadable;
              observer.next(loadable);
              observer.complete();
            })
        })
        .catch(error => {
          console.error('Error fetching chemical image:', error);
          const loadable: Loadable<string> = {
            status: 'error',
            data: null
          };
          if (error instanceof HttpErrorResponse && error.status === 404) {
            loadable.status = 'na';
          }
          this.chemicalImageCache[name] = loadable;
          observer.next(loadable);
          observer.complete();
        });
    });
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

  validateChemical(smiles: string): Observable<Loadable<string>> {
    if (this.chemicalImageCache[smiles]) {
      return of(this.chemicalImageCache[smiles]);
    }

    return new Observable(observer => {
      observer.next({ status: 'loading', data: null });

      const subscription = this.sharedService.drawSmilesSmilesDrawGet(smiles)
        .pipe(
          map((res: string) => ({ 
            status: 'loaded' as LoadingStatus, 
            data: res 
          })),
          catchError((error: Response) => {
            console.error('Error validating chemical:', error);
            const loadable: Loadable<string> = {
              status: error.status >= 500 ? 'error' : 'invalid',
              data: null
            };
            return of(loadable);
          })
        )
        .subscribe((res) => {
          console.log('validateChemical: ', res);
          this.chemicalImageCache[smiles] = res;
          observer.next(res);
          observer.complete();
        });

      return () => {
        subscription.unsubscribe()
      };
    });
  }
}
