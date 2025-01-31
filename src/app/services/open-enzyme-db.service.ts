import { Injectable } from "@angular/core";
import { Observable, combineLatest, forkJoin, from, map, of } from "rxjs";

import { BodyCreateJobJobTypeJobsPost, ChemicalAutoCompleteResponse, FilesService, Job, JobType, JobsService, SharedService } from "../api/mmli-backend/v1";
import { 
  DataDfKcat, 
  DataDfKcatService, 
  KcatkmEcPieChartService,
  KcatEcPieChartService,
  KmEcPieChartService,
  KineticSummaryService,
  KineticSummary,
  KcatEcPieChart,
  KmEcPieChart,
  KcatkmEcPieChart,
  DataDfKmService,
  DataDfKcatkmService,
  DataDfKm,
  DataDfKcatkm
} from "../api/moldb/v1";
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

export type EcBarChart = { 
  dataset: string, 
  ec_group: string, 
  count: number 
}

export type SearchCriteria = {
  compound?: string,
  organism?: string,
  uniprot?: string,
  ec?: string,
  ph?: string,
  temperature?: string,
}

export type SearchCriteriaKey = keyof SearchCriteria;

const example = loadGzippedJson<OEDRecord[]>('/assets/example.json.gz');
const kcat = loadGzippedJson<OEDRecord[]>('/assets/data_df_KCAT.json.gz');
const km = loadGzippedJson<OEDRecord[]>('/assets/data_df_KM.json.gz');
const kcat_km = loadGzippedJson<OEDRecord[]>('/assets/data_df_KCATKM.json.gz');

const kcat_ec_pie_chart = import('../../assets/kcat_ec_pie_chart.json').then(res => res.default);
const km_ec_pie_chart = import('../../assets/km_ec_pie_chart.json').then(res => res.default);
const kcatkm_ec_pie_chart = import('../../assets/kcatkm_ec_pie_chart.json').then(res => res.default);
const ec_bar_chart = import('../../assets/ec_bar_chart.json').then(res => res.default);
const kinetic_summary = import('../../assets/kinetic_summary.json').then(res => res.default);


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

  public get WHITE_PAPER_URL() {
    return this._WHITE_PAPER_URL;
  }
  
  public get VISION_URL() {
    return this._VISION_URL;
  }

  public get FEEDBACK_URL() {
    return this._FEEDBACK_URL;
  }

  constructor(
    private jobsService: JobsService,
    private filesService: FilesService,
    private environmentService: EnvironmentService,
    private sharedService: SharedService,
    private dataDfKcatService: DataDfKcatService,
    private dataDfKmService: DataDfKmService,
    private dataDfKcatKmService: DataDfKcatkmService,
    private kcatECPieChartService: KcatEcPieChartService,
    private kmECPieChartService: KmEcPieChartService,
    private kcatkmECPieChartService: KcatkmEcPieChartService,
    private kineticSummaryService: KineticSummaryService,
    // private apiService: OpenEnzymeDBApiService,
  ) {
    this.frontendOnly = this.environmentService.getEnvConfig().frontendOnly === "true";
    this._WHITE_PAPER_URL = this.environmentService.getEnvConfig().whitePaperUrl;
    this._VISION_URL = this.environmentService.getEnvConfig().visionUrl;
    this._FEEDBACK_URL = this.environmentService.getEnvConfig().feedbackUrl;
  }

  getKCats(...params: Parameters<typeof this.dataDfKcatService.dataDfKcatGet>): Observable<DataDfKcat[]> {
    return this.dataDfKcatService.dataDfKcatGet(...params).pipe(
      map((res) => res as unknown as DataDfKcat[])
    );
  }

  getAll(criteria: SearchCriteria = {
    ec: undefined,
    compound: undefined,
    organism: undefined,
    uniprot: undefined,
    ph: undefined,
    temperature: undefined,
  }): Observable<(DataDfKcat | DataDfKm | DataDfKcatkm)[]> {
    return combineLatest([
      this.dataDfKcatService.dataDfKcatGet(
        criteria.ec,
        criteria.compound,
        criteria.organism,
        criteria.uniprot,
        criteria.ph,
        criteria.temperature,
      ),
      this.dataDfKmService.dataDfKmGet(
        criteria.ec,
        criteria.compound,
        criteria.organism,
        criteria.uniprot,
        criteria.ph,
        criteria.temperature,
      ),
      this.dataDfKcatKmService.dataDfKcatkmGet(
        criteria.ec,
        criteria.compound,
        criteria.organism,
        criteria.uniprot,
        criteria.ph,
        criteria.temperature,
      ),
    ]).pipe(
      map(([kcat, km, kcatkm]) => [ ...kcat, ...km, ...kcatkm ])
    );
  }

  getKineticSummary(): Observable<KineticSummary[]> {
    // if (this.frontendOnly) {
      return from(kinetic_summary);
    // }
    // return this.kineticSummaryService.kineticSummaryGet(...params).pipe(
    //   map((res) => res as unknown as KineticSummary[])
    // );
  }

  getKCatECPieChartData(): Observable<KcatEcPieChart[]> {
    // if (this.frontendOnly) {
      return from(kcat_ec_pie_chart);
    // }
    // return this.kcatECPieChartService.kcatEcPieChartGet();
  }

  getKMECPieChartData(): Observable<KmEcPieChart[]> {
    // if (this.frontendOnly) {
      return from(km_ec_pie_chart);
    // }
    // return this.kmECPieChartService.kmEcPieChartGet();
  }

  getKCatKmECPieChartData(): Observable<KcatkmEcPieChart[]> {
    // if (this.frontendOnly) {
      return from(kcatkm_ec_pie_chart);
    // }
    // return this.kcatkmECPieChartService.kcatkmEcPieChartGet();
  }

  getEcBarChartData(): Observable<EcBarChart[]> {
    // if (this.frontendOnly) {
    return from(ec_bar_chart);
    // }
    // return this.kcatECPieChartService.kcatEcPieChartGet();
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
