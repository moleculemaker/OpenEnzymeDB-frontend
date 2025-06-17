import { Injectable } from "@angular/core";
import { Observable, first, from, map, of } from "rxjs";
import * as d3 from 'd3';

import { BodyCreateJobJobTypeJobsPost, FilesService, Job, JobType, JobsService, SharedService } from "../api/mmli-backend/v1";
import { EnvironmentService } from "./environment.service";

// import { OpenEnzymeDBService as OpenEnzymeDBApiService } from "../api/mmli-backend/v1"; // TODO: use the correct service

import { ungzip } from 'pako';
import { CommonService } from "./common.service";
import { Loadable } from "../models/Loadable";
import { ReactionSchemeRecord, ReactionSchemeRecordWithKeyInfo } from "../models/ReactionSchemeRecord";
import { ScaleType } from "../components/density-plot/density-plot.component";

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

// const exampleStatus: any = "WARNING: please provide your own example_status.json";
// const example: any = "WARNING: please provide your own example.json";

export type RecommendationResult = {
  errors: {
    tanimoto: any,
    fragment: any,
    mcs: any,
  },
  query_smiles: {
    iupac_name: string,
    smiles: string,
    matches_return: {
      mcs: number,
      fragment: number,
      tanimoto: number,
    },
  },
  tanimoto: {
    [key: string]: number,
  },
  fragment: {
    [key: string]: {
      matches: number[][]
    },
  },
  mcs: {
    [key: string]: {
      value: number,
      match: number[]
    },
  },
}

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
  status: "active" | "inactive",
  names: Array<{
    value: string,
    type: 'recommended' | 'submission' | 'alternative',
  }>,
  primaryAccession: string,
  organism: {
    scientificName: string,
    taxonId: number,
    evidences: Array<UniprotEvidence>,
    lineage: Array<string>,
  },
  proteinDescription: {
    recommendedName?: {
      fullName: {
        evidences?: Array<UniprotEvidence>,
        value: string
      },
      ecNumbers?: Array<{
        evidences?: Array<UniprotEvidence>,
        value: string
      }>,
      shortNames?: Array<{
        evidences?: Array<UniprotEvidence>,
        value: string
      }>,
    },
    submissionNames?: Array<{
      fullName: {
        evidences?: Array<UniprotEvidence>,
        value: string
      },
      ecNumbers?: Array<{
        evidences?: Array<UniprotEvidence>,
        value: string
      }>,
      shortNames?: Array<{
        evidences?: Array<UniprotEvidence>,
        value: string
      }>,
    }>,
    alternativeNames?: Array<{
      fullName: {
        evidences?: Array<UniprotEvidence>,
        value: string
      },
      ecNumbers?: Array<{
        evidences?: Array<UniprotEvidence>,
        value: string
      }>,
      shortNames?: Array<{
        evidences?: Array<UniprotEvidence>,
        value: string
      }>,
    }>,
  },
  genes?: Array<{
    geneName?: { value: string },
    orderedLocusNames?: Array<{ value: string }>,
    orfNames?: Array<{ value: string }>,
  }>,
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
  inactiveReason?: {
    inactiveReasonType: "MERGED" | "DELETED" | "DEMERGED",
    mergeDemergeTo: string[],
  },
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
  MOL: string,
}

export type DLKCatResultResponseRaw = {
  "dlkcat-output.json": DLKCatResult
}

export type UnikpResultResponseRaw = {
  "unikp-output.json": UnikpResult
}

export type CatpredResultResponseRaw = {
  "catpred-output.json": CatpredResult
}

export type DLKCatResult = Array<{
  "substrate": string,
  "smiles": string,
  "sequence": string,
  "kcat": number,
}>

export type UnikpResult = Array<{
  "kcat": number,
  "km": number,
  "kcat_km": number,
  "smiles": string,
  "sequence": string,
}>

export type CatpredResult = Array<{
  "smiles": string,
  "sequence": string,
  "kcat": number,
  "km": number,
  "ki": number,
}>

const example = loadGzippedJson<OEDRecord[]>('/assets/example.json.gz');
const kcat = loadGzippedJson<OEDRecord[]>('/assets/data_df_KCAT.json.gz');
const km = loadGzippedJson<OEDRecord[]>('/assets/data_df_KM.json.gz');
const kcat_km = loadGzippedJson<OEDRecord[]>('/assets/data_df_KCATKM.json.gz');
const uniprot_data = loadGzippedJson<UniprotRecordDict>('/assets/uniprot.json.gz');
const ec_data = loadGzippedJson<ECRecordDict>('/assets/kegg_ec.json.gz');
const substrate_data = loadGzippedJson<SubstrateRecordDict>('/assets/substrate.json.gz');

const exampleRecommendation = import('../../assets/example.recommendation.json');
const exampleStatus = import('../../assets/example_status.json') as Promise<any>;

const reaction_scheme = loadGzippedJson<Record<string, ReactionSchemeRecord[]>>('/assets/reaction_scheme.json.gz');

@Injectable({
  providedIn: "root",
})
export class OpenEnzymeDBService {
  frontendOnly = false;

  readonly KCAT_DF$ = from(kcat) ;
  readonly KM_DF$ = from(km);
  readonly KCAT_KM_DF$ = from(kcat_km);
  readonly LINEAGE_DF$ = from(example);

  readonly UNIPROT$ = from(uniprot_data);
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
    private commonService: CommonService

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
      return from(exampleStatus);
    }
    return this.jobsService.createJobJobTypeJobsPost(jobType, requestBody);
  }

  getResultStatus(jobType: JobType, jobID: string): Observable<Job> {
    if (this.frontendOnly) {
      return from(exampleStatus);
    }
    return this.jobsService.listJobsByTypeAndJobIdJobTypeJobsJobIdGet(jobType, jobID)
      .pipe(map((jobs) => jobs[0]));
  }

  getUniprotInfo(uniprot: string): Observable<UniprotRecord> {
    return this.UNIPROT$.pipe(
      map((uniprotData) => ({
        ...uniprotData[uniprot],
        status: uniprotData[uniprot].entryType === "Inactive" ? "inactive" : "active",
        names: [
          ...(uniprotData[uniprot].proteinDescription.recommendedName?.fullName?.value ? [{
            value: uniprotData[uniprot].proteinDescription!.recommendedName!.fullName.value,
            type: 'recommended' as const
          }] : []),
          ...(uniprotData[uniprot].proteinDescription.alternativeNames?.map(n => ({
            value: n.fullName.value,
            type: 'alternative' as const
          })) || []),
          ...(uniprotData[uniprot].proteinDescription.submissionNames?.map(n => ({
            value: n.fullName.value,
            type: 'submission' as const
          })) || []),
        ],
      })));
  }

  getECInfo(ec: string): Observable<ECRecord> {
    return this.EC$.pipe(map((ecData) => ecData[ec]));
  }

  getSubstrateInfo(substrate: string): Observable<SubstrateRecord> {
    return this.SUBSTRATE$.pipe(map((substrateRecord) => substrateRecord[substrate.toLowerCase()]));
  }

  getSubstrateInfoFromSMILES(smiles: string): Observable<SubstrateRecord> {
    return this.SUBSTRATE$.pipe(
      map((substrateRecord) => {
        const substrate = Object.keys(substrateRecord).find(key => substrateRecord[key].SMILES === smiles);
        if (!substrate) {
          throw new Error('Substrate not found');
        }
        return substrateRecord[substrate];
      })
    );
  }

  getResult<T>(jobType: JobType, jobID: string): Observable<T> {
    if (this.frontendOnly) {
      return from(exampleRecommendation) as Observable<T>;
    }
    return this.filesService.getResultsBucketNameResultsJobIdGet(jobType, jobID) as Observable<T>;
  }

  getData(): Observable<OEDRecord[]> {
    return from(example);
  }

  getError(jobType: JobType, jobID: string): Observable<string> {
    if (this.frontendOnly) {
      return of('error');
    }
    return this.filesService.getErrorsBucketNameErrorsJobIdGet(jobType, jobID);
  }

  getDLKcatResult(jobID: string): Observable<DLKCatResult> {
    return this.getResult<DLKCatResultResponseRaw>(JobType.OedDlkcat, jobID)
      .pipe(map((dlkcat) => dlkcat['dlkcat-output.json']))
  }

  getUnikpResult(jobID: string): Observable<UnikpResult> {
    return this.getResult<UnikpResultResponseRaw>(JobType.OedUnikp, jobID)
      .pipe(map((unikp) => unikp['unikp-output.json']))
  }

  getCatpredResult(jobID: string): Observable<CatpredResult> {
    return this.getResult<CatpredResultResponseRaw>(JobType.OedCatpred, jobID)
      .pipe(map((catpred) => catpred['catpred-output.json']))
  }


  getReactionSchemesFor(ecNumber: string, substrate: string, organism: string): Observable<ReactionSchemeRecord[]> {
    return from(reaction_scheme).pipe(
      map((records) => records[`${ecNumber}|${substrate}|${organism}`.toLowerCase()]),
      first()
    );
  }

  getSingleReactionSchemeByEC(ecNumber: string): Observable<ReactionSchemeRecordWithKeyInfo> {
    return from(reaction_scheme).pipe(
      map((records) => {
        const candidates = [];
        for (const [key, value] of Object.entries(records)) {
          if (key.startsWith(`${ecNumber}|`.toLowerCase())) {
            candidates.push({
              ...value[0],
              ecNumber,
              substrate: value[0].reactants.find(r => r.toLowerCase() === key.split('|')[1]) || '',
              organism: key.split('|')[2],
            });
          }
        }

        if (candidates.length === 0) {
          throw new Error(`No reaction scheme found for EC number ${ecNumber}`);
        }

        return candidates.filter((candidate) => candidate.representative)[0] 
          || candidates[0];
      }),
      first()
    );
  }

  createDensityFor(data: number[], scaleType: ScaleType) {
    const min = Math.min(...data);
    const max = Math.max(...data);

    const generateThresholds = (min: number, max: number): number[] => {
      const numPoints = 100;
      const thresholds: number[] = [];
  
      if (scaleType === 'log') {
        const logMin = min;
        const logMax = max;
        const logStep = (Math.log10(logMax) - Math.log10(logMin)) / numPoints;
        
        for (let i = 0; i <= numPoints; i++) {
          thresholds.push(Math.pow(10, Math.log10(logMin) + i * logStep));
        }
      } else {
        const step = (max - min) / numPoints;
        for (let i = 0; i <= numPoints; i++) {
          thresholds.push(min + i * step);
        }
      }
  
      return thresholds;
    }
    
    const calculateDensity = (thresholds: number[], data: number[], bandwidth: number) => {
      const density: [number, number][] = [[thresholds[0], 0]];

      const epanechnikov = (bandwidth: number) => {
        return (x: number) =>
          Math.abs((x /= bandwidth)) <= 1
            ? (0.75 * (1 - x * x)) / bandwidth
            : 0;
      }

      const kde = (kernel: Function, thresholds: number[], data: number[]) => {
        return thresholds.map((t) => [t, data.reduce((acc, d) => acc + kernel(t - d), 0) / data.length]);
      }

      density.push(
        ...(kde(epanechnikov(bandwidth), thresholds, data) as [number, number][]),
      );

      density.push([density[density.length - 1][0], 0]);

      // Normalize the density
      const maxDensity = Math.max(...density.map((d) => d[1]));
      return density.map(([x, y]) => [x, y / maxDensity]) as [number, number][];
    }

    const thresholds = generateThresholds(min, max);
    const density = calculateDensity(thresholds, data, 0.5);

    return {
      thresholds,
      density
    }
  }

  /**
   * Generates gradient stops for a density plot visualization by mapping colors to density ranges
   * 
   * @param density Array of [x,y] points representing the density distribution
   * @param colors Array of color strings to use for the gradient
   * @returns Array of gradient stops with offset percentages and colors
   * 
   * This function:
   * 1. Takes the y-values (density values) from the density distribution
   * 2. Calculates equal-sized stops based on the total density and number of colors
   * 3. Maps each color to a position in the distribution by accumulating density values
   * 4. Returns gradient stops as percentages along the distribution with corresponding colors
   */
  getGradientStopsFor(density: [number, number][], colors: string[]) {
    // generate gradient stops using quantile scale
    const densityy = density.map(([x, y]) => y);

    const total = densityy.reduce((acc, curr) => acc + curr, 0);
    const stops = [...colors.map((_, i) => total / colors.length * i)];

    let currentSum = 0;
    let currentIndex = 0;
    const gradientStops: { offset: number, color: string }[] = [];
    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      while (currentSum < stop) {
        currentSum += densityy[currentIndex];
        currentIndex++;
      }
      gradientStops.push({
        offset: currentIndex / densityy.length,
        color: colors[i],
      });
    }

    return gradientStops;
  }

  /**
   * Given a value, density distribution, and colors, returns the color for the value 
   * 
   * @param value The value to get the color for
   * @param density The density distribution
   * @param colors The colors to use for the gradient
   * @returns The color for the value
   */
  getColorForDensityPoint(value: number, density: [number, number][], colors: string[]) {
    const gradientStops = this.getGradientStopsFor(density, colors);

    // find value in density
    const index = density.findIndex(([x, y]) => x >= value);
    const percentage = index / density.length;

    if (percentage > gradientStops[gradientStops.length - 1].offset) {
      return colors[colors.length - 1];
    } else {
      const gradientIndex = gradientStops.findIndex((stop) => stop.offset >= percentage);
      return d3.interpolateRgb(
        gradientStops[gradientIndex - 1].color, 
        gradientStops[gradientIndex].color 
      )(percentage);
    }
  }

  updateSubscriberEmail(jobType: JobType, jobId: string, email: string) {
    if (this.frontendOnly) {
      return from(exampleStatus);
    }
    return this.jobsService.patchExistingJobJobTypeJobsJobIdRunIdPatch(jobType, {
      job_id: jobId,
      run_id: 0,
      email: email,
    });
  }

  validateChemical(smiles: string): Observable<Loadable<string>> {
    return this.commonService.drawSMILES(smiles);
  }
}
