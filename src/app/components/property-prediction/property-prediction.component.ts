import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from "@angular/core";
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
export class PropertyPredictionComponent implements OnDestroy, OnChanges {
  @Input() formValue: any = null;
  @Input() showJobTab = true;
  currentPage: 'input' | 'result' = 'input';
  
  form = new FormGroup({
    sequence: new FormControl("", [Validators.required]),
    smiles: new FormControl(""),
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
        // this.exampleUsed = value.sequence === this.exampleEnzyme && value.smiles === this.exampleSubstrate;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formValue'] && changes['formValue'].currentValue) {
      // console.log(this.formValue);
      this.form.patchValue({
        sequence: this.formValue.name.startsWith('>') 
          ? `${this.formValue.name}\n${this.formValue.sequence}`
          : this.formValue.sequence,
        smiles: this.formValue.smiles,
        email: this.formValue.email,
      });
    }
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
    let sequence = this.form.controls["sequence"].value || '';

    if (sequence.split('\n').length > 1) {
      name = sequence.split('\n')[0];
      sequence = sequence.split('\n')[1];
    }

    const jobInfo = {
      job_info: JSON.stringify({
        input_pairs: [
          {
            sequence: sequence,
            smiles: this.form.controls["smiles"].value || '',
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
      if (this.router.url.search(/\/.*\/result\//) !== -1) {
        window.open(
          this.router.url.replace(/\/result\/.*/g, `/result/${dlkcat.job_id}/${unikp.job_id}/${catpred.job_id}`), 
          '_blank'
        );
      } else {
        this.router.navigate(['property-prediction', 'result', dlkcat.job_id, unikp.job_id, catpred.job_id])
      }
    });
  }

  useExample() {
    this.form.patchValue({
      sequence: this.exampleEnzyme,
      smiles: this.exampleSubstrate,
    });
  }

  clearAll() {
    this.form.reset();
    this.chemInfo = { status: 'na', data: null };
  }
}
