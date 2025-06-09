import { ChangeDetectorRef, Component, ViewChild } from "@angular/core";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { CheckboxModule } from "primeng/checkbox";
import { ButtonModule } from "primeng/button";
import { CommonModule } from "@angular/common";

import { OpenEnzymeDBService, RecommendationResult, OEDRecord } from '~/app/services/openenzymedb.service';
import { ReactionSchemaRecord } from "~/app/models/ReactionSchemaRecord";
import { Loadable } from "~/app/models/Loadable";
import { PanelModule } from "primeng/panel";
import { combineLatestWith, map, tap, first, catchError } from "rxjs/operators";
import { of } from "rxjs";
import { ChipModule } from "primeng/chip";
import { DialogModule } from "primeng/dialog";
import { MultiSelectModule } from "primeng/multiselect";
import { InputTextModule } from "primeng/inputtext";
import { MenuModule } from "primeng/menu";
import { DropdownModule } from "primeng/dropdown";
import { TooltipModule } from "primeng/tooltip";
import { DividerModule } from "primeng/divider";
import { TieredMenuModule } from "primeng/tieredmenu";
import { ScrollPanelModule } from "primeng/scrollpanel";
import { SkeletonModule } from 'primeng/skeleton';

import { MultiselectFilterConfig, RangeFilterConfig } from "~/app/models/filters";
import { FilterConfig } from "~/app/models/filters";
import { Molecule3dComponent } from "~/app/components/molecule3d/molecule3d.component";
import { MoleculeImageComponent } from "~/app/components/molecule-image/molecule-image.component";
import { JobResult } from "~/app/models/job-result";
import { JobType } from "~/app/api/mmli-backend/v1";
import { ExternalLinkComponent } from "../external-link/external-link.component";
import { Table, TableModule } from "primeng/table";
import { FilterDialogComponent } from "../filter-dialog/filter-dialog.component";
import { FilterService, MessageService } from "primeng/api";
import { trigger } from "@angular/animations";
import { transition } from "@angular/animations";
import { style } from "@angular/animations";
import { animate } from "@angular/animations";
import { ToastModule } from "primeng/toast";
import { EnzymeStructureDialogComponent } from "~/app/components/enzyme-structure-dialog/enzyme-structure-dialog.component"
import { CompoundStructureDialogComponent } from "~/app/components/compound-structure-dialog/compound-structure-dialog.component";
import { ReactionSchemaComponent } from "~/app/components/reaction-schema/reaction-schema.component";
import { JobTabComponent } from "~/app/components/job-tab/job-tab.component";
import { EnzymeRecommendationComponent } from "../enzyme-recommendation/enzyme-recommendation.component";
import { EnzymeRecommendationJobInfo } from "../enzyme-recommendation-result/enzyme-recommendation-result.component";
import { OverlayPanelModule } from "primeng/overlaypanel";

export interface RecommendationResultRow {
  iid: number,
  ec_number: string,
  compound: {
    name: string,
    smiles: string,
  },
  organism: string,
  sequence: string,
  enzyme_type: string,
  uniprot_id: string[],
  ph: number,
  temperature: number,
  kcat: number,
  kcat_km: number,
  pubmed_id: string,
  tanimoto: number,
  fragment?: {
    matches: number[][];
    flattenedMatches: number[];
  }
  mcs: number,
  expanded: boolean,
  reaction_schema?: ReactionSchemaRecord[],
}

export interface RecommendationResultRowGroup {
  compound: {
    name: string;
    smiles: string;
    formula: string;
  };
  tanimoto: number;
  fragment: {
    matches: number[][];
    flattenedMatches: number[];
  };
  mcs: number;
  ec_number: string[];
  organism: string[];
  sequence: string[];
  enzyme_type: string[];
  uniprot_id: string[];
  ph: number[];
  temperature: number[];
  kcat: number[];
  kcat_km: number[];
  pubmed_id: string[];
  expanded: boolean;

  rows: RecommendationResultRow[];
}

@Component({
  selector: 'app-enzyme-recommendation-detail',
  templateUrl: './enzyme-recommendation-detail.component.html',
  styleUrls: ['./enzyme-recommendation-detail.component.scss'],
  standalone: true,
  animations: [
    trigger(
      'slideIn', 
      [
        transition(
          ':enter', 
          [
            style({ maxHeight: 0 }),
            animate('.5s ease-out', 
                    style({ maxHeight: 800 }))
          ]
        )
      ]
    )
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CheckboxModule,
    ButtonModule,
    PanelModule,
    MultiSelectModule,
    ChipModule,
    DialogModule,
    InputTextModule,
    MenuModule,
    DropdownModule,
    TooltipModule,
    DividerModule,
    TieredMenuModule,
    DividerModule,
    TableModule,
    ToastModule,
    ScrollPanelModule,
    SkeletonModule,
    OverlayPanelModule,

    MoleculeImageComponent,
    Molecule3dComponent,
    ExternalLinkComponent,
    FilterDialogComponent,
    EnzymeStructureDialogComponent,
    CompoundStructureDialogComponent,
    ReactionSchemaComponent,
    JobTabComponent,
    EnzymeRecommendationComponent,
  ],
  providers: [
    MessageService,
  ],
  host: {
    class: "flex flex-col h-full"
  }
})
export class EnzymeRecommendationDetailComponent extends JobResult<EnzymeRecommendationJobInfo> {
  override jobId: string = this.route.snapshot.paramMap.get("id") || "example-id";
  override jobType: JobType = JobType.OedCheminfo;
  algorithm: 'mcs' | 'fragment' | 'tanimoto' = this.route.snapshot.paramMap.get("algorithm") as 'mcs' | 'fragment' | 'tanimoto';

  currentPage = 'result';

  @ViewChild(MoleculeImageComponent) molecule2d!: MoleculeImageComponent;
  @ViewChild(Molecule3dComponent) molecule3d!: Molecule3dComponent;
  @ViewChild(Table) resultsTable!: Table;

  result: Loadable<{
    data: RecommendationResultRowGroup[];
    ungroupedData: RecommendationResultRow[];
    total: number;
  }> = {
    status: 'loading',
    data: null
  };

  substrate: RecommendationResult['query_smiles'];

  exportOptions = [
    {
      label: 'Table Results',
      command: () => {
        if (this.algorithm === 'fragment') {
          this.exportFragmentResults();
        } else {
          this.resultsTable.exportCSV();
        }
      },
    },
  ];

  columns: any[] = [
    { field: 'compound.name', header: 'compound' },
    { field: this.algorithm, header: this.algorithm },
  ];
  expandedRows: any = {};

  filterDialogVisible = false;
  filters: Map<string, FilterConfig> = new Map([
    ['compounds', new MultiselectFilterConfig({
      category: 'parameter',
      label: {
        value: 'Compounds',
        rawValue: 'Compounds',
      },
      placeholder: 'Select compound',
      field: 'compound.name',
      options: [],
      value: [],
      matchMode: 'union',
    })],
    ['uniprot_ids', new MultiselectFilterConfig({
      category: 'parameter',
      label: {
        value: 'Uniprot IDs',
        rawValue: 'Uniprot IDs',
      },
      placeholder: 'Select uniprot ID',
      field: 'uniprot_id',
      options: [],
      value: [],
      matchMode: 'subset',
    })],
    ['ec_numbers', new MultiselectFilterConfig({
      category: 'parameter',
      label: {
        value: 'EC Numbers',
        rawValue: 'EC Numbers',
      },
      placeholder: 'Select EC number',
      field: 'ec_number',
      options: [],
      value: [],
      matchMode: 'union',
    })],
    ['enzyme_types', new MultiselectFilterConfig({
      category: 'parameter',
      label: {
        value: 'Enzyme Types',
        rawValue: 'Enzyme Types',
      },
      placeholder: 'Select enzyme type',
      field: 'enzyme_type',
      options: [],
      value: [],
      matchMode: 'union',
    })],
    ['ph', new RangeFilterConfig({
      category: 'parameter',
      label: {
        value: 'pH',
        rawValue: 'pH',
      },
      placeholder: 'Enter pH range',
      field: 'ph',
      min: 0,
      max: 14,
    })],
    ['temperature', new RangeFilterConfig({
      category: 'parameter',
      label: {
        value: 'Temp (°C)',
        rawValue: 'Temp (°C)',
      },
      placeholder: 'Enter temperature range',
      field: 'temperature',
      min: 0,
      max: 100,
    })],
    ['kcat', new RangeFilterConfig({
      category: 'enzyme',
      label: {
        value: '<span class="italic">k</span><sub>cat</sub> (s<sup class="text-xs"> -1</sup>)',
        rawValue: 'kcat',
      },
      placeholder: 'Enter kcat range',
      field: 'kcat',
      min: 0,
      max: 100
    })],
    ['kcat_km', new RangeFilterConfig({
      category: 'enzyme',
      label: {
        value: '<span class="italic">k</span><sub>cat</sub>/<span class="italic">K</span><sub>m</sub> (mM<sup class="text-xs"> -1</sup>s<sup class="text-xs"> -1</sup>)',
        rawValue: 'kcat_km',
      },
      placeholder: 'Enter kcat/KM range',
      field: 'kcat_km',
      min: 0,
      max: 100
    })],
    ['pubmed_id', new MultiselectFilterConfig({
      category: 'literature',
      label: {
        value: 'PubMed',
        rawValue: 'PubMed',
      },
      placeholder: 'Select PubMed ID',
      field: 'pubmed_id',
      options: [],
      value: [],
      matchMode: 'subset',
    })],

    this.algorithm === 'mcs' 
    && ['mcs', new RangeFilterConfig({
      category: 'parameter',
      label: {
        value: 'MCS',
        rawValue: 'MCS',
      },
      placeholder: 'Enter MCS range',
      field: 'mcs',
      min: 0,
      max: 1,
    })],

    this.algorithm === 'tanimoto'
    && ['tanimoto', new RangeFilterConfig({
      category: 'parameter',
      label: {
        value: 'Tanimoto',
        rawValue: 'Tanimoto',
      },
      placeholder: 'Enter tanimoto range',
      field: 'tanimoto',
      min: 0,
      max: 1,
    })],
  ].filter((x) => !!x) as [string, FilterConfig][])

  enzymeStructureDialogVisible = false;
  enzymeStructureDataset: OEDRecord[] = [];
  selectedGroup: RecommendationResultRowGroup | null = null;
  compoundStructureDialogVisible = false;
  compoundStructureDialogSmiles = '';

  // Add reaction schema cache
  reactionSchemaCache: Record<string, {
    status: 'loading' | 'loaded' | 'error';
    data: ReactionSchemaRecord[];
  }> = {};

  get filterRecords() {
    return Array.from(this.filters.values());
  }

  get hasFilter() {
    return this.filterRecords.some((filter) => filter.hasFilter());
  }
 
  constructor(
    service: OpenEnzymeDBService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private filterService: FilterService,
    private messageService: MessageService,
    private router: Router,
  ) {
    super(service);

    this.service.getData()
      .pipe(
        combineLatestWith(
          this.jobResultResponse$,
          this.service.UNIPROT$,
          this.service.SUBSTRATE$
        ),
        tap(([_, jobResultResponse, _uniprot, _substrate]) => {
          this.substrate = jobResultResponse['query_smiles'];
        }),
        map(([response, jobResultResponse, uniprot, substrate]) => {
          const v = response
            .map((row: any, index: number) => {
              return {
                iid: index,
                ec_number: row.EC,
                compound: {
                  name: row.SUBSTRATE,
                  smiles: row.SMILES,
                  formula: substrate[row.SUBSTRATE.toLowerCase()]?.FORMULA,
                },
                organism: row['ORGANISM'],
                sequence: uniprot[row.UNIPROT]?.sequence?.value,
                enzyme_type: row.EnzymeType,
                uniprot_id: row.UNIPROT.split(','),
                ph: row.PH,
                temperature: row.Temperature,
                kcat: row['KCAT VALUE'],
                kcat_km: row['KCAT/KM VALUE'],
                pubmed_id: `${row.PubMedID}`,
                tanimoto: jobResultResponse.tanimoto[row.SMILES],
                fragment: {
                  matches: jobResultResponse.fragment[row.SMILES]?.matches ?? [],
                  flattenedMatches: jobResultResponse.fragment[row.SMILES]?.matches.flat() ?? []
                },
                mcs: jobResultResponse.mcs[row.SMILES],
                expanded: false,
                reaction_schema: undefined,
              }
            })
            .filter((row: any) => {
              // Always filter by kcat and kcat_km
              if (!row.kcat || !row.kcat_km) return false;
              
              // For fragment algorithm, also filter out compounds without fragment matches
              if (this.algorithm === 'fragment') {
                return row.fragment?.matches?.length > 0;
              }
              
              return true;
            });

          const grouped: { [key: string]: RecommendationResultRow[] } 
            = v.reduce((acc: any, row: any) => {
              acc[row.compound.name] = [...(acc[row.compound.name] || []), row];
              return acc;
            }, {});

          let retVal = Object.values(grouped).map((value) => {
            const compound = (value as any[])[0].compound;
            const tanimoto = jobResultResponse.tanimoto[compound.smiles];
            const fragment = jobResultResponse.fragment[compound.smiles];
            const mcs = jobResultResponse.mcs[compound.smiles];
            return {
              compound,
              tanimoto,
              fragment: {
                matches: fragment?.matches ?? [],
                flattenedMatches: fragment?.matches.flat() ?? []
              },
              mcs,
              ec_number: Array.from(new Set(value.map((row: any) => row.ec_number))),
              organism: Array.from(new Set(value.map((row: any) => row.organism))),
              sequence: Array.from(new Set(value.map((row: any) => row.sequence))),
              enzyme_type: Array.from(new Set(value.map((row: any) => row.enzyme_type))),
              uniprot_id: Array.from(new Set(value.map((row: any) => row.uniprot_id))),
              ph: Array.from(new Set(value.map((row: any) => row.ph))),
              temperature: Array.from(new Set(value.map((row: any) => row.temperature))),
              kcat: Array.from(new Set(value.map((row: any) => row.kcat))),
              kcat_km: Array.from(new Set(value.map((row: any) => row.kcat_km))),
              pubmed_id: Array.from(new Set(value.map((row: any) => `${row.PubMedID}`))),
              expanded: false,
              rows: value as RecommendationResultRow[],
            } as RecommendationResultRowGroup;
          });

          if (this.algorithm === 'fragment') {
            retVal.sort((a, b) => (b.fragment?.flattenedMatches.length ?? 0) - (a.fragment?.flattenedMatches.length ?? 0))
          } else if (this.algorithm === 'mcs') {
            retVal = retVal.sort((a, b) => (b.mcs) - (a.mcs)).slice(0, 10);
          } else if (this.algorithm === 'tanimoto') {
            retVal = retVal.sort((a, b) => (b.tanimoto) - (a.tanimoto)).slice(0, 10);
          }

          return retVal;
        })
      )
      .subscribe({
        next: (response: RecommendationResultRowGroup[]) => {
          // Extract ungrouped data from all groups
          const ungroupedData = response.flatMap(group => group.rows);
          
          this.result = {
            status: 'loaded',
            data: {
              data: response,
              ungroupedData: ungroupedData,
              total: response.length,
            }
          };
          this.updateFilterOptions(response);
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error(err);
          this.result = {
            status: 'error',
            data: null
          };
        }
      });

      this.filterService.register(
        "range",
        (value: number, filter: [number, number]) => {
          if (!filter) {
            return true;
          }
          return value >= filter[0] && value <= filter[1];
        },
      );
  
      this.filterService.register(
        "subset",
        (value: any[], filter: any[]) => {
          if (!filter) {
            return true;
          }
          return filter.every((f) => value.includes(f));
        },
      );

      this.filterService.register(
        "union",
        (value: any[], filter: any[]) => {
          if (!filter) {
            return true;
          }
          return filter.some((f) => value.includes(f));
        },
      );
  }

  backToSearch() {
    history.back();
  }

  copySequence(sequence: string) {
    if (sequence) {
      navigator.clipboard.writeText(sequence);
    }
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Sequence copied to clipboard',
    });
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

  clearAllFilters() {
    this.filterDialogVisible = false;
    this.filterRecords.forEach((filter) => {
      filter.value = [...filter.defaultValue];
    });
    if (this.resultsTable) {
      this.applyFilters();
    }
  }

  applyFilters() {
    this.filterDialogVisible = false;
    this.filterRecords.forEach((filter) => {
      this.resultsTable.filter(filter.value, filter.field, filter.matchMode);
    });
  }

  getUniqueUniprotIds(rows: any[]) {
    return [...new Set(rows.map((row) => row.uniprot_id).flat())];
  }

  searchTable(filter: FilterConfig): void {
    this.resultsTable.filter(filter.value, filter.field, filter.matchMode);
  }

  showCompoundStructureDialog(
    compound: {
      name: string;
      smiles: string;
    }
  ) {
    this.compoundStructureDialogVisible = !this.compoundStructureDialogVisible;
    this.compoundStructureDialogSmiles = compound.smiles;
  }

  showEnzymeStructureDialog(
    group: RecommendationResultRowGroup
  ) {
    this.selectedGroup = group;
    this.enzymeStructureDialogVisible = !this.enzymeStructureDialogVisible;
  }

  private updateFilterOptions(response: RecommendationResultRowGroup[]) {
    function getField(obj: any, dotPath: string): any {
      const keys = dotPath.split('.');
    
      function traverse(current: any, keys: string[]): any {
        if (!current || keys.length === 0) return current;
    
        const [key, ...restKeys] = keys;
    
        if (key === 'all' && Array.isArray(current)) {
          return current.map(item => traverse(item, restKeys));
        } else if (/^\d+$/.test(key)) {
          return traverse(current[Number(key)], restKeys);
        } else {
          return traverse(current[key], restKeys);
        }
      }
    
      return traverse(obj, keys);
    }
    
    Array.from(this.filters.entries()).forEach(([key, filter]) => {
      const options = response.flatMap((row: any) => {
        const value = getField(row, filter.optionsField);
        return Array.isArray(value) ? value.flat() : [value];
      });
      const optionsSet = new Set(options);
      if (filter instanceof MultiselectFilterConfig) {
        filter.options = Array.from(optionsSet).map((option: any) => ({
          label: option,
          value: option,
        }));
        filter.defaultValue = [];
      } else if (filter instanceof RangeFilterConfig) {
        filter.min = Math.min(...options);
        filter.max = Math.max(...options);
        filter.value = [filter.min, filter.max];
        filter.defaultValue = [filter.min, filter.max];
      }
    });
  }

  // Add custom sorting functions
  customSort(event: any) {
    const { order, field } = event;
    
    if (!this.result.data) {
      return;
    }
    
    // Sort the groups
    this.result.data.data.sort((a: any, b: any) => {
      let valueA, valueB;
      
      // Handle numerical fields (ph, temperature, kcat, kcat_km)
      if (['ph', 'temperature', 'kcat', 'kcat_km'].includes(field)) {
        // For ascending, use min value; for descending, use max value
        valueA = order === 1 ? Math.min(...a[field]) : Math.max(...a[field]);
        valueB = order === 1 ? Math.min(...b[field]) : Math.max(...b[field]);
        return valueA - valueB;
      }
      
      // Handle array fields (ec_number, uniprot_id, enzyme_type, pubmed_id)
      if (['ec_number', 'uniprot_id', 'enzyme_type', 'pubmed_id'].includes(field)) {
        // Sort arrays alphabetically and compare first elements
        valueA = [...a[field]].sort()[0];
        valueB = [...b[field]].sort()[0];
        return valueA.localeCompare(valueB) * order;
      }
      
      // Handle other fields
      valueA = a[field];
      valueB = b[field];
      
      if (typeof valueA === 'string') {
        return valueA.localeCompare(valueB) * order;
      }
      return (valueA - valueB) * order;
    });

    // Sort rows within each group
    this.result.data.data.forEach((group: any) => {
      group.rows.sort((a: any, b: any) => {
        let valueA, valueB;
        
        // Handle numerical fields
        if (['ph', 'temperature', 'kcat', 'kcat_km'].includes(field)) {
          valueA = a[field];
          valueB = b[field];
          return (valueA - valueB) * order;
        }
        
        // Handle array fields
        if (['ec_number', 'uniprot_id', 'enzyme_type', 'pubmed_id'].includes(field)) {
          valueA = Array.isArray(a[field]) ? a[field][0] : a[field];
          valueB = Array.isArray(b[field]) ? b[field][0] : b[field];
          return valueA.localeCompare(valueB) * order;
        }
        
        // Handle other fields
        valueA = a[field];
        valueB = b[field];
        
        if (typeof valueA === 'string') {
          return valueA.localeCompare(valueB) * order;
        }
        return (valueA - valueB) * order;
      });
    });
  }

  getCacheKey(row: RecommendationResultRow): string {
    return `${row.ec_number}|${row.compound.name}|${row.organism}`.toLowerCase();
  }

  // Update method to fetch reaction schema using Observable
  private fetchReactionSchema(row: RecommendationResultRow) {
    const cacheKey = this.getCacheKey(row);
    
    if (this.reactionSchemaCache[cacheKey]) {
      return;
    }

    this.reactionSchemaCache[cacheKey] = {
      status: 'loading',
      data: []
    };

    this.service.getReactionSchemasFor(
      row.ec_number,
      row.compound.name,
      row.organism
    ).pipe(
      first(),
      catchError(error => {
        console.error('Error fetching reaction schema:', error);
        this.reactionSchemaCache[cacheKey] = {
          status: 'error',
          data: []
        };
        return of([]);
      })
    ).subscribe(response => {
      this.reactionSchemaCache[cacheKey] = {
        status: 'loaded',
        data: response || []
      };
      this.cdr.detectChanges();
    });
  }

  // Update method to load reaction schema
  loadReactionSchema(row: RecommendationResultRow) {
    if (!row.reaction_schema) {
      this.fetchReactionSchema(row);
    }
  }

  watchRowExpansion(row: RecommendationResultRow) {
    if (row.expanded) {
      this.loadReactionSchema(row);
    }
  }

  private exportFragmentResults() {
    if (!this.result.data) return;

    const headers = ['Compound Name', 'Number of Substructure Matches', 'Number of Atom Matches'];
    const rows = this.result.data.data.map(group => {
      const numSubStructureMatches = group.fragment?.matches?.length || 0;
      const numAtomMatches = group.fragment?.flattenedMatches?.length || 0;
      return [
        `"${group.compound.name}"`,
        numSubStructureMatches,
        numAtomMatches
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'fragment_results.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getAlgorithmLabel(algorithm: 'mcs' | 'fragment' | 'tanimoto', value: any, group?: RecommendationResultRowGroup): string {
    if (algorithm === 'fragment' && group) {
      const numSubStructureMatches = group.fragment?.matches?.length || 0;
      const numAtomMatches = group.fragment?.flattenedMatches?.length || 0;
      return `${numSubStructureMatches} substructure ${numSubStructureMatches === 1 ? 'match' : 'matches'}, ${numAtomMatches} atom ${numAtomMatches === 1 ? 'match' : 'matches'}`;
    }
    return typeof value === 'number' ? value.toFixed(4) : value;
  }

  getStats(data: RecommendationResultRow[]): { totalCompounds: number } {
    // Count unique compounds - all compounds in data should have matches for fragment algorithm
    const uniqueCompounds = new Set(data.map(row => row.compound.name));
    return {
      totalCompounds: uniqueCompounds.size
    };
  }
}
