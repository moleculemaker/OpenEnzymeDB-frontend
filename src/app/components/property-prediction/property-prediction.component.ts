import { Component, OnDestroy } from "@angular/core";
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
import { forkJoin, Subscription } from "rxjs";

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
export class PropertyPredictionComponent implements OnDestroy {
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

  exampleEnzyme = '>sp|Q29476|ST1A1_CANLF Sulfotransferase 1A1 OS=Canis lupus familiaris OX=9615 GN=SULT1A1 PE=1 SV=1\nMEDIPDTSRPPLKYVKGIPLIKYFAEALESLQDFQAQPDDLLISTYPKSGTTWVSEILDMIYQDGDVEKCRRAPVFIRVPFLEFKAPGIPTGLEVLKDTPAPRLIKTHLPLALLPQTLLDQKVKVVYVARNAKDVAVSYYHFYRMAKVHPDPDTWDSFLEKFMAGEVSYGSWYQHVQEWWELSHTHPVLYLFYEDMKENPKREIQKILKFVGRSLPEETVDLIVQHTSFKEMKNNSMANYTTLSPDIMDHSISAFMRKGISGDWKTTFTVAQNERFDADYAKKMEGCGLSFRTQL';
  exampleSubstrate = 'OC1=CC=C(C[C@@H](C(O)=O)N)C=C1';
  exampleUsed = false;

  subscriptions: Subscription[] = [];
 
  constructor(
    private service: OpenEnzymeDBService,
    private router: Router,
  ) {
    this.subscriptions.push(
      this.form.valueChanges.subscribe((value) => {
        this.exampleUsed = value.enzyme === this.exampleEnzyme && value.substrate === this.exampleSubstrate;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  onSubmit() {
    if (!this.form.valid) {
      return;
    }

    if (this.exampleUsed) {
      this.router.navigate(['property-prediction', 'result', 'precomputed', 'precomputed', 'precomputed']);
      return;
    }

    let name = Math.random().toString(36).substring(2, 15);
    let sequence = this.form.controls["enzyme"].value || '';

    if (sequence.split('\n').length > 1) {
      name = sequence.split('\n')[0];
      sequence = sequence.split('\n')[1];
    }

    const jobInfo = {
      job_info: JSON.stringify({
        input_pairs: [
          {
            sequence: sequence,
            smiles: this.form.controls["substrate"].value || '',
            name: name,
          }
        ]
      }),
      email: this.form.controls["email"].value || '',
    }

    forkJoin([
      this.service.createAndRunJob(JobType.OedDlkcat, jobInfo),
      this.service.createAndRunJob(JobType.OedUnikp, { ...jobInfo, email: ''}), 
      this.service.createAndRunJob(JobType.OedCatpred, { ...jobInfo, email: ''}),
    ]).subscribe(([dlkcat, unikp, catpred]) => {
      this.router.navigate(['property-prediction', 'result', dlkcat.job_id, unikp.job_id, catpred.job_id]);
    })
  }

  useExample() {
    this.form.patchValue({
      enzyme: this.exampleEnzyme,
      substrate: this.exampleSubstrate,
    });
  }

  clearAll() {
    this.form.reset();
    this.chemInfo = { status: 'na', data: null };
  }
}
