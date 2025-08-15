import { Component, Input, OnChanges, SimpleChanges, ViewChild } from "@angular/core";
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { CheckboxModule } from "primeng/checkbox";
import { ButtonModule } from "primeng/button";
import { CommonModule } from "@angular/common";

import { JobType } from "~/app/api/mmli-backend/v1";
import { OpenEnzymeDBService } from '~/app/services/openenzymedb.service';
import { JobTabComponent } from "~/app/components/job-tab/job-tab.component";
import { PanelModule } from "primeng/panel";
import { MenuModule } from "primeng/menu";
import { QueryInputComponent } from "../query-input/query-input.component";
import { QueryValue, SearchOption, SmilesSearchOption } from "~/app/models/search-options";
import { ChemicalResolverService } from '~/app/services/chemical-resolver.service';

@Component({
  selector: 'app-enzyme-recommendation',
  templateUrl: './enzyme-recommendation.component.html',
  styleUrls: ['./enzyme-recommendation.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PanelModule,
    CheckboxModule,
    MenuModule,

    ButtonModule,
    JobTabComponent,
    QueryInputComponent,
  ],
  host: {
    class: "flex flex-col h-full"
  }
})
export class EnzymeRecommendationComponent implements OnChanges {
  @Input() formValue!: {
    query_smiles: string;
    query_value: QueryValue;
    email: string;
  };
  @Input() showJobTab = true;

  @ViewChild(QueryInputComponent) queryInput!: QueryInputComponent;

  currentPage = 'input';

  form = new FormGroup({
    search: new FormControl<QueryValue | null>(null, [Validators.required]),
    email: new FormControl("", [Validators.email]),
    agreeToSubscription: new FormControl(false),
  });

  searchConfigs: SearchOption[] = [
    new SmilesSearchOption({
      key: 'smiles',
      label: 'Substrate',
      placeholder: 'Enter a substrate',
      example: {
        label: '7-Methyltryptamine',
        inputType: 'smiles',
        inputValue: 'CC1=C2C(=CC=C1)C(=CN2)CCN',
        value: 'CC1=C2C(=CC=C1)C(=CN2)CCN'
      },
      nameToSmilesConverter: (name: string) => this.chemicalResolverService.getSMILESFromName(name),
    })
  ];

  constructor(
    private service: OpenEnzymeDBService,
    private chemicalResolverService: ChemicalResolverService,
    private router: Router,
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formValue'] && changes['formValue'].currentValue) {
      this.form.patchValue({
        search: this.formValue.query_value ?? {
          selectedOption: 'smiles',
          inputValue: this.formValue.query_smiles,
          inputType: 'smiles',
          value: this.formValue.query_smiles,
        },
        email: this.formValue.email,
      });
    }
  }

  onSubmit() {
    if (!this.form.valid) {
      return;
    }

    if (this.isUsingExample()) {
      this.router.navigate(['enzyme-recommendation', 'result', 'precomputed']);
      return;
    }

    this.service.createAndRunJob(
      JobType.OedCheminfo,
      {
        job_info: JSON.stringify({
          query_smiles: this.form.controls["search"].value?.value,
          query_value: this.form.controls["search"].value, // for result page
        }),
        email: this.form.controls["email"].value || '',
      }
    ).subscribe((response) => {
      if (this.router.url.search(/\/.*\/result\//) !== -1) {
        window.open(
          this.router.url.replace(/\/result\/.*/g, `/result/${response.job_id}`), 
          '_blank'
        );
      } else {
        this.router.navigate(['enzyme-recommendation', 'result', response.job_id]);
      }
    })
  }

  clearAll() {
    this.form.reset();
    this.queryInput.reset();
  }

  useExample() {
    this.queryInput.useExample('smiles');
  }

  isUsingExample() {
    return this.form.controls['search'].value ? (this.form.controls['search'].value as any)['inputValue'] === this.searchConfigs[0].example['inputValue'] : false;
  }
}
