import { Component } from "@angular/core";
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { CheckboxModule } from "primeng/checkbox";
import { ButtonModule } from "primeng/button";
import { CommonModule } from "@angular/common";

import { JobType } from "~/app/api/mmli-backend/v1";
import { OpenEnzymeDBService } from '~/app/services/openenzymedb.service';
import { Loadable } from "~/app/models/Loadable";
import { JobTabPredictionComponent } from "../job-tab-prediction/job-tab-prediction.component";
import { PanelModule } from "primeng/panel";
import { MoleculeImageComponent } from "../molecule-image/molecule-image.component";
import { MarvinjsInputComponent } from "../marvinjs-input/marvinjs-input.component";
import { SmilesValidatorDirective } from "~/app/directives/smiles-validator.directive";
import { InputTextModule } from "primeng/inputtext";
import { InputTextareaModule } from "primeng/inputtextarea";
import { SequenceOrUniprotValidatorDirective } from "~/app/directives/sequence-or-uniprot-validator.directive";

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
    PanelModule,
    InputTextModule,
    InputTextareaModule,
    
    JobTabPredictionComponent,
    MarvinjsInputComponent,
    MoleculeImageComponent,
    SmilesValidatorDirective,
    SequenceOrUniprotValidatorDirective,
  ],
  host: {
    class: "flex flex-col h-full"
  }
})
export class PropertyPredictionComponent {
  showJobTab = true;
  currentPage: 'input' | 'result' = 'input';
  
  form = new FormGroup({
    enzyme: new FormControl("", [Validators.required]),
    substrate: new FormControl(""),
    email: new FormControl("", [Validators.email]),
    agreeToSubscription: new FormControl(false),
  });

  chemInfo: Loadable<string> = { 
    status: 'na',
    data: null,
  };
 
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

  useExample() {
    this.form.patchValue({
      enzyme: '>WP_063460136\nMAIPPYPDFRSAAFLRQHLRATMAFYDPVATDASGGQFHFFLDDGTVYNTHTRHLVSATRFVVTHAMLYRTTGEARYQVGMRHALEFLRTAFLDPATGGYAWLIDWQDGRATVQDTTRHCYGMAFVMLAYARAYEAGVPEARVWLAEAFDTAEQHFWQPAAGLYADEASPDWQLTSYRGQNANMHACEAMISAFRATGERRYIERAEQLAQGICQRQAALSDRTHAPAAEGWVWEHFHADWSVDWDYNRHDRSNIFRPWGYQVGHQTEWAKLLLQLDALLPADWHLPCAQRLFDTAVERGWDAEHGGLYYGMAPDGSICDDGKYHWVQAESMAAAAVLAVRTGDARYWQWYDRIWAYCWAHFVDHEHGAWFRILHRDNRNTTREKSNAGKVDYHNMGACYDVLLWALDAPGFSKESRSAALGRP',
      substrate: 'COC1=C(C=CC(=C1)CCN)O',
    });
  }

  clearAll() {
    this.form.reset();
    this.chemInfo = { status: 'na', data: null };
  }
}
