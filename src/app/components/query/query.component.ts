import { AfterContentInit, AfterViewInit, ChangeDetectorRef, Component, ViewChild } from "@angular/core";
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { CheckboxModule } from "primeng/checkbox";
import { ButtonModule } from "primeng/button";
import { CommonModule } from "@angular/common";

import { JobType } from "~/app/api/mmli-backend/v1";
import { OpenEnzymeDBService, SearchCriteria } from '~/app/services/open-enzyme-db.service';
import { PanelModule } from "primeng/panel";
import { QueryInputComponent, QueryValue } from "../query-input/query-input.component";
import { Table, TableModule } from "primeng/table";
import { map } from "rxjs/operators";
import { ChipModule } from "primeng/chip";
import { DialogModule } from "primeng/dialog";
import { MultiSelectModule } from "primeng/multiselect";
import { FilterService } from "primeng/api";
import { InputTextModule } from "primeng/inputtext";
import { MenuModule } from "primeng/menu";
import { trigger } from "@angular/animations";
import { animate } from "@angular/animations";
import { style, transition } from "@angular/animations";
import { DataDfKcat, DataDfKcatkm, DataDfKm } from "~/app/api/moldb/v1";

interface FilterConfigParams {
  category: string;
  label: {
    value: string;
    type: 'html' | 'text';
    rawValue: string;
  };
  placeholder: string;
  field: string;
  type?: 'range' | 'multiselect';
  value?: any;
  defaultValue?: any;
  matchMode?: 'in' | 'range' | 'subset';
}

abstract class FilterConfig {
  public category: string;
  public label: {
    value: string;
    type: 'html' | 'text';
    rawValue: string;
  };
  public placeholder: string;
  public field: string;
  public type: 'range' | 'multiselect';
  public defaultValue: any;
  public matchMode: 'in' | 'range' | 'subset';
  public formattedValue: any;
  #value: any;

  constructor(params: FilterConfigParams) {
    this.category = params.category;
    this.label = params.label;
    this.placeholder = params.placeholder;
    this.field = params.field;
    this.type = params.type ?? 'multiselect';
    this.#value = params.value;
    this.defaultValue = params.defaultValue ?? null;
    this.matchMode = params.matchMode ?? 'in';
  }

  get value() {
    return this.#value;
  }

  set value(value: any) {
    const parsedValue = this.parseInput(value);
    this.#value = parsedValue;
    this.formattedValue = this.formatValue();
  }

  abstract hasFilter(): boolean;
  abstract parseInput(value: any): any;
  abstract formatValue(): any;
}

interface RangeFilterParams extends FilterConfigParams {
  min: number;
  max: number;
  value?: [number, number];
}

class RangeFilterConfig extends FilterConfig {
  public min: number;
  public max: number;

  constructor(params: RangeFilterParams) {
    super({
      ...params,
      type: 'range',
      value: params.value ?? [params.min, params.max],
      defaultValue: [params.min, params.max],
      matchMode: 'range'
    });
    this.min = params.min;
    this.max = params.max;
  }

  hasFilter(): boolean {
    return this.value[0] !== this.defaultValue[0] || this.value[1] !== this.defaultValue[1];
  }

  parseInput(input: string | [number, number]): [number, number] {
    let min, max;
    if (typeof input === 'string') {
      const rangeRegex = /^(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)$/;
      const match = input.match(rangeRegex);
      if (!match) {
        return this.defaultValue;
      }
      min = parseFloat(match[1]);
      max = parseFloat(match[2]);
    } else {
      [min, max] = input;
    }

    if (min > max) {
      return this.defaultValue;
    }

    return [min, max];
  }

  formatValue(): string {
    if (!this.value || !Array.isArray(this.value)) {
      return '';
    }
    const [min, max] = this.value;
    if (min === this.min && max === this.max) {
      return '';
    }
    return `${min}-${max}`;
  }
}

interface MultiselectFilterParams extends FilterConfigParams {
  options?: any[];
  value?: any[];
  matchMode?: 'in' | 'subset';
}

class MultiselectFilterConfig extends FilterConfig {
  public options: any[];

  constructor(params: MultiselectFilterParams) {
    super({
      ...params,
      type: 'multiselect',
      value: params.value ?? [],
      defaultValue: [],
    });
    this.options = params.options ?? [];
  }

  hasFilter(): boolean {
    return this.value.length > 0;
  }

  parseInput(value: any[]): any[] {
    return value;
  }

  formatValue(): string {
    if (!this.value || !Array.isArray(this.value)) {
      return '';
    }
    return this.value.join(', ');
  }
}

@Component({
  selector: 'app-query',
  templateUrl: './query.component.html',
  styleUrls: ['./query.component.scss'],
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
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CheckboxModule,
    ButtonModule,
    PanelModule,
    QueryInputComponent,
    TableModule,
    MultiSelectModule,
    ChipModule,
    DialogModule,
    InputTextModule,
    MenuModule,
],
  host: {
    class: "flex flex-col h-full"
  }
})
export class QueryComponent implements AfterViewInit {
  @ViewChild(QueryInputComponent) queryInputComponent!: QueryInputComponent;
  @ViewChild(Table) resultsTable!: Table;

  form = new FormGroup({
    search: new FormControl<QueryValue | null>(
      null,
      [Validators.required]
    ),
  });

  result: {
    status: 'loading' | 'loaded' | 'error' | 'na';
    data: any[];
    total: number;
  } = {
    status: 'na',
    data: [],
    total: 0,
  };

  showFilter = false;
  hasFilter = false;
  filters: Record<string, FilterConfig> = {
    // reactions: new MultiselectFilterConfig(
    //   'parameter',
    //   'Reactions',
    //   'Select reaction',
    //   'reaction',
    //   [],
    //   [],
    // ),
    compounds: new MultiselectFilterConfig({
      category: 'parameter',
      label: {
        value: 'Compounds',
        type: 'text',
        rawValue: 'Compounds',
      },
      placeholder: 'Select compound',
      field: 'compound.name',
      options: [],
      value: [],
    }),
    organism: new MultiselectFilterConfig({
      category: 'parameter',
      label: {
        value: 'Organism',
        type: 'text',
        rawValue: 'Organism',
      },
      placeholder: 'Select organism',
      field: 'organism',
      options: [],
      value: [],
    }),
    uniprot_ids: new MultiselectFilterConfig({
      category: 'parameter',
      label: {
        value: 'Uniprot IDs',
        type: 'text',
        rawValue: 'Uniprot IDs',
      },
      placeholder: 'Select uniprot ID',
      field: 'uniprot_id',
      options: [],
      value: [],
      matchMode: 'subset',
    }),
    ec_numbers: new MultiselectFilterConfig({
      category: 'parameter',
      label: {
        value: 'EC Numbers',
        type: 'text',
        rawValue: 'EC Numbers',
      },
      placeholder: 'Select EC number',
      field: 'ec_number',
      options: [],
      value: [],
    }),
    enzyme_types: new MultiselectFilterConfig({
      category: 'parameter',
      label: {
        value: 'Enzyme Types',
        type: 'text',
        rawValue: 'Enzyme Types',
      },
      placeholder: 'Select enzyme type',
      field: 'enzyme_type',
      options: [],
      value: [],
    }),
    ph: new RangeFilterConfig({
      category: 'parameter',
      label: {
        value: 'pH',
        type: 'text',
        rawValue: 'pH',
      },
      placeholder: 'Enter pH range',
      field: 'ph',
      min: 0,
      max: 14,
    }),
    temperature: new RangeFilterConfig({
      category: 'parameter',
      label: {
        value: 'Temperature (°C)',
        type: 'text',
        rawValue: 'Temperature (°C)',
      },
      placeholder: 'Enter temperature range',
      field: 'temperature',
      min: 0,
      max: 100,
    }),
    kcat: new RangeFilterConfig({
      category: 'enzyme',
      label: {
        value: '<span class="italic">k</span><sub>cat</sub> (s<sup class="text-xs"> -1</sup>)',
        type: 'html',
        rawValue: 'kcat',
      },
      placeholder: 'Enter kcat range',
      field: 'kcat',
      min: 0,
      max: 100
    }),
    km: new RangeFilterConfig({
      category: 'enzyme',
      label: {
        value: '<span class="italic">K</span><sub>m</sub> (M)',
        type: 'html',
        rawValue: 'km',
      },
      placeholder: 'Enter KM range',
      field: 'km',
      min: 0,
      max: 100
    }),
    kcat_km: new RangeFilterConfig({
      category: 'enzyme',
      label: {
        value: '<span class="italic">k</span><sub>cat</sub>/<span class="italic">K</span><sub>m</sub> (M<sup class="text-xs"> -1</sup>s<sup class="text-xs"> -1</sup>)',
        type: 'html',
        rawValue: 'kcat_km',
      },
      placeholder: 'Enter kcat/KM range',
      field: 'kcat_km',
      min: 0,
      max: 100
    }),
    pubmed_id: new MultiselectFilterConfig({
      category: 'literature',
      label: {
        value: 'PubMed',
        type: 'text',
        rawValue: 'PubMed',
      },
      placeholder: 'Select PubMed ID',
      field: 'pubmed_id',
      options: [],
      value: [],
      matchMode: 'subset',
    }),
  }

  columns: any[] = [];

  exampleRecords: any[] = [];
  readonly filterRecordsByCategory = Object.entries(this.filters)
    .reduce((acc, [key, filter]) => {
      if (!acc[filter.category]) {
        acc[filter.category] = [filter];
      } else {
        acc[filter.category].push(filter);
      }
      return acc;
    }, {} as Record<string, FilterConfig[]>);

  readonly filterRecords = Object.values(this.filters);
 
  constructor(
    public service: OpenEnzymeDBService,
    private router: Router,
    private filterService: FilterService,
    private cdr: ChangeDetectorRef,
  ) {
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

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.exampleRecords = this.queryInputComponent.searchOptions
        .filter((option) => option.example)
        .map((option) => ({
          label: `${option.label} (${option.example['label']})`,
          command: () => this.queryInputComponent.useExample(option.key)
        }));
    });
  }

  clearAll() {
    this.form.reset();
    this.queryInputComponent.reset();
    this.result.status = 'na';
    this.clearAllFilters();
  }

  clearAllFilters() {
    this.filterRecords.forEach((filter) => {
      filter.value = filter.defaultValue;
    });
    if (this.resultsTable) {
      this.resultsTable.reset();
    }
    this.hasFilter = false;
  }

  applyFilters() {
    this.filterRecords.forEach((filter) => {
      this.resultsTable.filter(filter.value, filter.field, filter.matchMode);
    });
    this.hasFilter = this.filterRecords.some((filter) => filter.hasFilter());
  }

  viewAllData() {
    this.clearAll();
    this.submit();
  }

  submit() {
    // if (!this.form.valid) {
    //   console.warn('invalid form:', 
    //     '\n\tstatus: ', this.form.status, 
    //     '\n\tvalue: ', this.form.value);
    //   return;
    // }

    console.log(this.form.value);

    const searchCriteria: SearchCriteria = {};
    if (this.form.value.search) {
      searchCriteria[this.form.value.search.selectedOption] = this.form.value.search.value;
    }

    let marginCount = 0;
    // TODO: replace with actual job ID and job type
    // this.service.getResult(JobType.Defaults, '123')
    this.service.getAll(searchCriteria)
    .pipe(
      map((response: (DataDfKcat | DataDfKm | DataDfKcatkm)[]) => 
        response
          .map((row: DataDfKcat | DataDfKm | DataDfKcatkm, index: number) => {
            
            // TODO: discuss how to handle missing values
            // if (row.KCAT_VALUE && row.KM_VALUE && row.KCAT_KM_VALUE) {
            //   const v = row.KCAT_VALUE / row.KM_VALUE;
            //   const threshold = v * 0.2;
            //   if (v > row.KCAT_KM_VALUE + threshold || v < row.KCAT_KM_VALUE - threshold) {
            //     marginCount++;
            //     console.log('margin value: ', 'kcat: ', row['KCAT_VALUE'], 'km: ', row['KM_VALUE'], 'kcat/km: ', row['KCAT/KM_VALUE']);
            //   }
            // }

            return ({
              iid: index,
              ec_number: row.ec,
              compound: {
                name: row.substrate,
                smiles: row.smiles,
              },
              enzyme_type: row.enzymetype,
              organism: row.organism,
              uniprot_id: row.uniprot?.split(','),
              ph: row.ph,
              temperature: row.temperature,
              kcat: 'KCAT_VALUE' in row ? row.KCAT_VALUE : null,
              km: 'KM_VALUE' in row ? row.KM_VALUE : null,
              kcat_km: 'KCAT_KM_VALUE' in row ? row.KCAT_KM_VALUE : null,
              pubmed_id: `${row.pubmedid}`,
          })})
          .filter((row: any) => {
            const search = this.form.value.search;
            if (!search) {
              return true;
            }

            const { selectedOption: searchType, ...searchValue } = search!
            switch(searchType) {
              case 'compound':
                return row.compound[searchValue['select']].toLowerCase()
                  === searchValue.value.toLowerCase(); 

              case 'organism':
                return row.organism.toLowerCase() === searchValue.value.toLowerCase();

              case 'uniprot':
                return row.uniprot_id.some((id: string) => id.toLowerCase() === searchValue.value.toLowerCase());

              case 'ph':
                return row.ph >= searchValue.value[0] 
                  && row.ph <= searchValue.value[1];

              case 'temperature':
                return row.temperature >= searchValue.value[0] 
                  && row.temperature <= searchValue.value[1];

              case 'ec':
                return row.ec_number === searchValue.value;

              default:
                return true;
            }
          })
    ))
    .subscribe((response) => {
      function getField(obj: any, dotPath: string) {
        // console.log('obj:', obj, 'dotPath:', dotPath);
        return dotPath.split('.').reduce((obj, key) => obj[key], obj);
      }

      Object.entries(this.filters).forEach(([key, filter]) => {
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
        console.log('filter:', key, optionsSet.size);
      });

      console.log(`
kcat/KM_VALUE:
  over-threshold percentage: ${marginCount / response.length * 100}%
  margin count: ${marginCount}
  response length: ${response.length}
`);

      this.columns = Object.values(this.filters).map((filter) => ({
        field: filter.field,
        header: filter.label.rawValue,
      }));

      this.result = {
        status: 'loaded',
        data: response,
        total: response.length,
      };
    });
  }

  searchTable(event: any, filter: FilterConfig): void {
    if (filter instanceof RangeFilterConfig) {
      filter.value = event.target.value;
    } else if (filter instanceof MultiselectFilterConfig) {
      filter.value = event.value;
    }
    
    this.resultsTable.filter(filter.value, filter.field, filter.matchMode);
    this.hasFilter = this.filterRecords.some(f => f.hasFilter());

    console.log(this.resultsTable.filteredValue);
  }
}
