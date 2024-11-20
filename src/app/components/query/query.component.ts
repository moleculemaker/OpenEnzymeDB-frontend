import { Component, ViewChild } from "@angular/core";
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { CheckboxModule } from "primeng/checkbox";
import { ButtonModule } from "primeng/button";
import { CommonModule } from "@angular/common";

import { JobType } from "~/app/api/mmli-backend/v1";
import { OpenEnzymeDBService } from '~/app/services/open-enzyme-db.service';
import { PanelModule } from "primeng/panel";
import { QueryInputComponent, QueryValue } from "../query-input/query-input.component";
import { Table, TableModule } from "primeng/table";
import { MoleculeImageComponent } from "../molecule-image/molecule-image.component";
import { map } from "rxjs/operators";
import { ChipModule } from "primeng/chip";
import { DialogModule } from "primeng/dialog";
import { MultiSelectModule } from "primeng/multiselect";
import { KatexPipe } from "~/app/pipes/katex.pipe";
import { SafePipe } from "../../pipes/safe.pipe";

class FilterConfig {
  constructor(
    public category: string,
    public label: string,
    public options: any[],
    public value: any[],
    public placeholder: string,
    public field: string,
  ) {}
}

@Component({
  selector: 'app-query',
  templateUrl: './query.component.html',
  styleUrls: ['./query.component.scss'],
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
    MoleculeImageComponent,
    MultiSelectModule,
    ChipModule,
    DialogModule,
    SafePipe
],
  host: {
    class: "flex flex-col h-full"
  }
})
export class QueryComponent {
  @ViewChild(QueryInputComponent) queryInputComponent!: QueryInputComponent;
  @ViewChild(Table) resultsTable!: Table;

  form = new FormGroup({
    search: new FormControl<QueryValue | null>(
      null,
      [Validators.required]
    ),
  });

  result: {
    data: any[];
    total: number;
  } | null = null;

  showFilter = false;
  filters: Record<string, FilterConfig> = {
    reactions: {
      category: 'parameter',
      label: 'Reactions',
      placeholder: 'Select reaction',
      options: [],
      field: 'reaction',
      value: [],
    },
    compounds: {
      category: 'parameter',
      label: 'Compounds',
      placeholder: 'Select compound',
      field: 'compound.name',
      options: [],
      value: [],
    },
    uniprot_ids: {
      category: 'parameter',
      label: 'Uniprot IDs',
      placeholder: 'Select uniprot ID',
      field: 'uniprot_id',
      options: [],
      value: [],
    },
    ec_numbers: {
      category: 'parameter',
      label: 'EC Numbers',
      placeholder: 'Select EC number',
      field: 'ec_number',
      options: [],
      value: [],
    },
    enzyme_types: {
      category: 'parameter',
      label: 'Enzyme Types',
      placeholder: 'Select enzyme type',
      field: 'enzyme_type',
      options: [],
      value: [],
    },
    ph: {
      category: 'parameter',
      label: 'pH',
      placeholder: 'Select pH range',
      field: 'ph',
      options: [],
      value: [],
    },
    temperature: {
      category: 'parameter',
      label: 'Temperature (°C)',
      placeholder: 'Select temperature range',
      field: 'temperature',
      options: [],
      value: [],
    },
    kcat: {
      category: 'enzyme',
      label: 'kcat (s⁻¹)',
      placeholder: 'Select kcat range',
      field: 'kcat',
      options: [],
      value: [],
    },
    km: {
      category: 'enzyme',
      label: 'KM (M)',
      placeholder: 'Select KM range',
      field: 'km',
      options: [],
      value: [],
    },
    kcat_km: {
      category: 'enzyme',
      label: 'kcat/KM (M⁻¹s⁻¹)',
      placeholder: 'Select kcat/KM range',
      field: 'kcat_km',
      options: [],
      value: [],
    },
    pubmed_id: {
      category: 'literature',
      label: 'PubMed',
      placeholder: 'Select PubMed ID',
      field: 'pubmed_id',
      options: [],
      value: [],
    },
  }

  readonly filterRecordsByCategory = Object.entries(this.filters)
    .reduce((acc, [key, filter]) => {
      if (!acc[filter.category]) {
        acc[filter.category] = [filter];
      } else {
        acc[filter.category].push(filter);
      }
      return acc;
    }, {} as Record<string, FilterConfig[]>);
 
  constructor(
    public service: OpenEnzymeDBService,
    private router: Router,
  ) { }

  useExample() {
    this.queryInputComponent.useExample('compound');
  }

  clearAll() {
    this.form.reset();
    this.queryInputComponent.writeValue(null);
  }

  clearAllFilters() {

  }

  applyFilters() {
    
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

    // TODO: replace with actual job ID and job type
    this.service.getResult(JobType.Defaults, '123')
    .pipe(
      map((response: any) => 
        response
          .map((row: any, index: number) => ({
            iid: index,
            ec_number: row.EC,
            compound: {
              name: row.SUBSTRATE,
              smiles: row.SMILES,
            },
            organism: row.ORGANISM,
            uniprot_id: row.UNIPROT.split(','),
            ph: row.PH,
            temperature: row.Temperature,
            kcat: row['KCAT VALUE'],
            km: row['KM VALUE'],
            kcat_km: row['KCAT/KM VALUE'],
            pubmed_id: row.PubMedID,
          }))
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

              case 'uniprot_id':
                return row.uniprot_id.some((id: string) => id.toLowerCase() === searchValue.value.toLowerCase());

              case 'ph':
                return row.ph >= searchValue.value[0] 
                  && row.ph <= searchValue.value[1];

              case 'temperature':
                return row.temperature >= searchValue.value[0] 
                  && row.temperature <= searchValue.value[1];

              case 'ec_number':
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
        filter.options = Array.from(optionsSet).map((option: any) => ({
          label: option,
          value: option,
        }));
        console.log('filter:', key, optionsSet.size);
      });

      this.result = {
        data: response,
        total: response.length,
      };
    });
  }
}
