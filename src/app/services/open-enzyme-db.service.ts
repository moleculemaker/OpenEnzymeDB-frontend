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

export type UniprotEvidence = {
  evidenceCode: string,
  source: string,
  id: string
}

export type UniprotRecordDict = {
  [key: string]: UniprotRecord
}

export type UniprotRecord = {
  entryType: string,
  primaryAccession: string,
  organism: {
    scientificName: string,
    taxonId: number,
    evidences: Array<UniprotEvidence>,
    lineage: Array<string>,
  },
  proteinDescription: {
    recommendedName: {
      fullName: {
        evidences: Array<UniprotEvidence>,
        value: string
      },
      ecNumbers: Array<{
        evidences: Array<UniprotEvidence>,
        value: string
      }>,
    }
  },
  sequence: {
    value: string,
    length: number,
    molWeight: number,
    crc64: string,
    md5: string,
  }
  lineages: Array<{
    scientificName: string,
    taxonId: number,
    rank: string,
    hidden: boolean,
  }>,
  extraAttributes: {
    uniParcId: string,
  },
  structure_url: string,
};

export type ECRecordDict = {
  [key: string]: ECRecord
}

export type ECRecord = {
  entry: string,
  name: Array<string>,
  classname: Array<string>,
  sysname: Array<string>,
  reaction: Array<string>,
  substrate: Array<string>,
  product: Array<string>,
  inhibitor: Array<string>,
  cofactor: Array<string>,
  effector: Array<string>,
  comment: Array<string>,
  pathway: Array<{
    database: string,
    id: string,
    description: string,
    url: string,
  }>,
  genes: Array<any>,
  diseases: Array<any>,
  structures: Array<any>,
  dblink: Array<[string, Array<string>]>,
  uniprots: Array<{
    uniprot_id: string,
    sequence: string,
    structure_url: string,
  }>,
}

export type SubstrateRecordDict = {
  [key: string]: SubstrateRecord
}

export type SubstrateRecord = {
  SUBSTRATE: string,
  SMILES: string,
  FORMULA: string,
  MOLECULAR_WEIGHT: number,
  LOG_P: number,
  TPSA: number,
  H_BOND_DONOR: number,
  H_BOND_ACCEPTOR: number,
  N_RINGS: number,
}

const example = loadGzippedJson<OEDRecord[]>('/assets/example.json.gz');
const kcat = loadGzippedJson<OEDRecord[]>('/assets/data_df_KCAT.json.gz');
const km = loadGzippedJson<OEDRecord[]>('/assets/data_df_KM.json.gz');
const kcat_km = loadGzippedJson<OEDRecord[]>('/assets/data_df_KCATKM.json.gz');
// const uniprot_data = loadGzippedJson<UniprotRecordDict>('/assets/uniprot.json.gz');
const ec_data = loadGzippedJson<ECRecordDict>('/assets/kegg_ec.json.gz');
const substrate_data = loadGzippedJson<SubstrateRecordDict>('/assets/substrate.json.gz');


@Injectable({
  providedIn: "root",
})
export class OpenEnzymeDBService {
  frontendOnly = false;

  readonly KCAT_DF$ = from(kcat) ;
  readonly KM_DF$ = from(km);
  readonly KCAT_KM_DF$ = from(kcat_km);
  readonly LINEAGE_DF$ = from(example);

  // readonly UNIPROT$ = from(uniprot_data);
  readonly EC$ = from(ec_data);
  readonly SUBSTRATE$ = from(substrate_data);

  private _WHITE_PAPER_URL = '';
  private _VISION_URL = '';
  private _FEEDBACK_URL = '';
  private _RELEASE_NOTES_URL = '';

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

  // getUniprotInfo(uniprot: string): Observable<UniprotRecord> {
  //   return this.UNIPROT$.pipe(map((uniprotData) => uniprotData[uniprot]));
  // }

  getECInfo(ec: string): Observable<ECRecord> {
    return this.EC$.pipe(map((ecData) => ecData[ec]));
  }

  getSubstrateInfo(substrate: string): Observable<SubstrateRecord> {
    return this.SUBSTRATE$.pipe(map((substrateRecord) => substrateRecord[substrate.toLowerCase()]));
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
