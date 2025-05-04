import { ChangeDetectorRef, Component, ViewChild } from "@angular/core";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { CheckboxModule } from "primeng/checkbox";
import { ButtonModule } from "primeng/button";
import { CommonModule } from "@angular/common";

import { OpenEnzymeDBService, RecommendationResult } from '~/app/services/openenzymedb.service';
import { PanelModule } from "primeng/panel";
import { combineLatestWith, map, tap } from "rxjs/operators";
import { ChipModule } from "primeng/chip";
import { DialogModule } from "primeng/dialog";
import { MultiSelectModule } from "primeng/multiselect";
import { InputTextModule } from "primeng/inputtext";
import { MenuModule } from "primeng/menu";
import { DropdownModule } from "primeng/dropdown";
import { TooltipModule } from "primeng/tooltip";
import { DividerModule } from "primeng/divider";
import { TieredMenuModule } from "primeng/tieredmenu";

import { MultiselectFilterConfig, RangeFilterConfig } from "~/app/models/filters";
import { FilterConfig } from "~/app/models/filters";
import { Molecule3dComponent } from "~/app/components/molecule3d/molecule3d.component";
import { MoleculeImageComponent } from "~/app/components/molecule-image/molecule-image.component";
import { JobResult } from "~/app/models/job-result";
import { JobType } from "~/app/api/mmli-backend/v1";
import { ExternalLinkComponent } from "../external-link/external-link.component";
import { Table, TableModule } from "primeng/table";
import { FilterDialogComponent } from "../filter-dialog/filter-dialog.component";
import { FilterService } from "primeng/api";
import { trigger } from "@angular/animations";
import { transition } from "@angular/animations";
import { style } from "@angular/animations";
import { animate } from "@angular/animations";


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

    MoleculeImageComponent,
    Molecule3dComponent,
    ExternalLinkComponent,
    FilterDialogComponent,
],
  host: {
    class: "flex flex-col h-full"
  }
})
export class EnzymeRecommendationDetailComponent extends JobResult {
  override jobId: string = this.route.snapshot.paramMap.get("id") || "example-id";
  override jobType: JobType = JobType.OedCheminfo;
  algorithm: 'mcs' | 'fragment' | 'tanimoto' = this.route.snapshot.paramMap.get("algorithm") as 'mcs' | 'fragment' | 'tanimoto';

  @ViewChild(MoleculeImageComponent) molecule2d!: MoleculeImageComponent;
  @ViewChild(Molecule3dComponent) molecule3d!: Molecule3dComponent;
  @ViewChild(Table) resultsTable!: Table;

  result: {
    status: 'loading' | 'loaded' | 'error' | 'na';
    data: any[];
    total: number;
  } = {
    status: 'na',
    data: [],
    total: 0,
  };

  substrate: RecommendationResult['query_smiles'];

  exportOptions = [
    {
      label: 'Table Results',
      command: () => {
        this.resultsTable.exportCSV();
      },
    },
  ];

  columns: any[] = [];
  showFilter = false;
  expandedRows: any = {};

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
        value: 'Temperature (°C)',
        rawValue: 'Temperature (°C)',
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

    this.algorithm === 'fragment'
    && ['fragment', new RangeFilterConfig({
      category: 'parameter',
      label: {
        value: 'Fragment',
        rawValue: 'Fragment',
      },
      placeholder: 'Enter fragment range',
      field: 'fragment',
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
  ) {
    super(service);

    this.service.getData()
      .pipe(
        combineLatestWith(this.jobResultResponse$),
        tap(([response, jobResultResponse]) => {
          this.substrate = jobResultResponse['query_smiles'];
        }),
        map(([response, jobResultResponse]) => 
          response
            .map((row: any, index: number) => ({
              iid: index,
              ec_number: row.EC,
              compound: {
                name: row.SUBSTRATE,
                smiles: row.SMILES,
              },
              enzyme_type: row.EnzymeType,
              uniprot_id: row.UNIPROT.split(','),
              ph: row.PH,
              temperature: row.Temperature,
              kcat: row['KCAT VALUE'],
              kcat_km: row['KCAT/KM VALUE'],
              pubmed_id: `${row.PubMedID}`,
              tanimoto: jobResultResponse.tanimoto[row.SMILES],
              fragment: jobResultResponse.fragment[row.SMILES],
              mcs: jobResultResponse.mcs[row.SMILES],
              showDetails: false,
            }))
            .filter((row: any) => !!row.kcat && !!row.kcat_km)
            .sort((a: any, b: any) => b[this.algorithm] - a[this.algorithm])
        )
      )
      .subscribe({
        next: (response: any) => {
          this.result = {
            status: 'loaded',
            data: response,
            total: response.length,
          };
          this.cdr.detectChanges();
          this.updateFilterOptions(this.result.data);
        },
        error: (err: any) => {
          console.error(err);
          this.result = {
            status: 'error',
            data: [],
            total: 0,
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
  }

  backToSearch() {
    history.back();
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
    this.showFilter = false;
    this.filterRecords.forEach((filter) => {
      filter.value = [...filter.defaultValue];
    });
    if (this.resultsTable) {
      this.applyFilters();
    }
  }

  applyFilters() {
    this.showFilter = false;
    this.filterRecords.forEach((filter) => {
      this.resultsTable.filter(filter.value, filter.field, filter.matchMode);
    });
  }

  searchTable(filter: FilterConfig): void {
    this.resultsTable.filter(filter.value, filter.field, filter.matchMode);
  }

  private updateFilterOptions(response: any[]) {
    function getField(obj: any, dotPath: string) {
      return dotPath.split('.').reduce((obj, key) => obj[key], obj);
    }
    
    Array.from(this.filters.entries()).forEach(([key, filter]) => {
      const options = response.map((row: any) => getField(row, filter.field)).flat();
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
    
    this.columns = Array.from(this.filters.values()).map((filter) => ({
      field: filter.field,
      header: filter.label.rawValue,
    }));
  }
}
