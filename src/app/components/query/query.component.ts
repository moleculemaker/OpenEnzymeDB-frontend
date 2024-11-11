import { Component, ViewChild } from "@angular/core";
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { CheckboxModule } from "primeng/checkbox";
import { ButtonModule } from "primeng/button";
import { CommonModule } from "@angular/common";

import { JobType } from "~/app/api/mmli-backend/v1";
import { OpenEnzymeDBService } from '~/app/services/open-enzyme-db.service';
import { PanelModule } from "primeng/panel";
import { QueryInputComponent, QueryValue } from "../query-input/query-input.component";
import { TableModule } from "primeng/table";
import { MoleculeImageComponent } from "../molecule-image/molecule-image.component";
import { map } from "rxjs/operators";

@Component({
  selector: 'app-query',
  templateUrl: './query.component.html',
  styleUrls: ['./query.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CheckboxModule,
    ButtonModule,
    PanelModule,
    QueryInputComponent,
    TableModule, 
    MoleculeImageComponent,
  ],
  host: {
    class: "flex flex-col h-full"
  }
})
export class QueryComponent {
  @ViewChild(QueryInputComponent) queryInputComponent!: QueryInputComponent;
  
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
 
  constructor(
    private service: OpenEnzymeDBService,
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
      this.result = {
        data: response,
        total: response.length,
      };
    });
  }
}
