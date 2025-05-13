import { Component } from "@angular/core";
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { CheckboxModule } from "primeng/checkbox";
import { ButtonModule } from "primeng/button";
import { CommonModule } from "@angular/common";

import { JobType } from "~/app/api/mmli-backend/v1";
import { OpenEnzymeDBService } from '~/app/services/openenzymedb.service';
import { JobTabPredictionComponent } from "../job-tab-prediction/job-tab-prediction.component";
import { SkeletonModule } from "primeng/skeleton";

@Component({
  selector: 'app-property-prediction',
  templateUrl: './property-prediction.component.html',
  styleUrls: ['./property-prediction.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CheckboxModule,
    ButtonModule,
    

    JobTabPredictionComponent,
  ],
  host: {
    class: "flex flex-col h-full"
  }
})
export class PropertyPredictionComponent {
  showJobTab = true;
  currentPage: 'input' | 'result' = 'input';
  
  form = new FormGroup({
    email: new FormControl("", [Validators.email]),
    agreeToSubscription: new FormControl(false),
  });
 
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
      JobType.Somn, //TODO: use the correct job type
      { 
        job_info: JSON.stringify({
          // TODO: add job info here
        }),
        email: this.form.controls["email"].value || '',
      }
    ).subscribe((response) => {
      this.router.navigate(['property-prediction', 'result', response.job_id]);
    })
  }
}
