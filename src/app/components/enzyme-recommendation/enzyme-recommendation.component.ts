import { Component, ViewChild } from "@angular/core";
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { CheckboxModule } from "primeng/checkbox";
import { ButtonModule } from "primeng/button";
import { CommonModule } from "@angular/common";

import { JobType } from "~/app/api/mmli-backend/v1";
import { OpenEnzymeDBService } from '~/app/services/open-enzyme-db.service';
import { JobTabComponent } from "~/app/components/job-tab/job-tab.component";
import { PanelModule } from "primeng/panel";
import { MenuModule } from "primeng/menu";
import { QueryInputComponent } from "../query-input/query-input.component";
import { QueryValue, SearchOption } from "~/app/models/search-options";
import { MoleculeSearchOption } from '~/app/models/search-options/MoleculeSearchOption';

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
export class EnzymeRecommendationComponent {
  @ViewChild(QueryInputComponent) queryInput!: QueryInputComponent;

  currentPage = 'input';

  form = new FormGroup({
    search: new FormControl<QueryValue>({
      value: '',
      selectedOption: 'compound',
    }, [Validators.required]),
    email: new FormControl("", [Validators.email]),
    agreeToSubscription: new FormControl(false),
  });

  searchConfigs: SearchOption[] = [
    new MoleculeSearchOption({
      key: 'compound',
      label: 'Substrate',
      placeholder: 'Enter a substrate',
      example: {
        label: 'Ethanol (CCO)',
        inputType: 'smiles',
        value: 'CCO'
      },
      moleculeValidator: (smiles: string) => this.service.validateChemical(smiles),
    })
  ];

  constructor(
    private service: OpenEnzymeDBService,
    private router: Router,
  ) { }

  onSubmit() {
    if (!this.form.valid) {
      return;
    }

    console.log(this.form.value);

    this.service.createAndRunJob(
      JobType.OedCheminfo,
      {
        job_info: JSON.stringify({
          query_smiles: this.form.controls["search"].value?.value,
        }),
        email: this.form.controls["email"].value || '',
      }
    ).subscribe((response) => {
      this.router.navigate(['enzyme-recommendation', 'result', response.job_id]);
    })
  }

  clearAll() {
    this.form.reset();
    this.queryInput.reset();
  }

  useExample() {
    this.queryInput.useExample('compound');
  }
}
