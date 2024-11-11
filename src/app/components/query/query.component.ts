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

  onSubmit() {
    if (!this.form.valid) {
      return;
    }

    console.log(this.form.value);

    // this.service.createAndRunJob(
    //   JobType.Somn, //TODO: use the correct job type
    //   { 
    //     job_info: JSON.stringify({
    //       // TODO: add job info here
    //     }),
    //     email: this.form.controls["email"].value || '',
    //   }
    // ).subscribe((response) => {
    //   this.router.navigate(['query', 'result', response.job_id]);
    // })
  }
}
