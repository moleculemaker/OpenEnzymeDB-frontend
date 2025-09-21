import { NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { FileUploadModule, FileSelectEvent } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

import { FilesService } from '../api/mmli-backend/v1';
import { DataSnapshotComponent } from "../components/data-snapshot/data-snapshot.component";
import { TutorialComponent } from "../components/tutorial/tutorial.component";

enum ActiveAboutPanel {
  ABOUT,
  LICENSE,
  TUTORIAL,
  STATISTICS,
  API,
  GITHUB,
  PUBLICATIONS,
  TEAM,
  GET_INVOLVED,
}

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [
    NgIf,
    DataSnapshotComponent,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CheckboxModule,
    FileUploadModule,
    InputTextModule,
    TooltipModule,
    TutorialComponent,
  ],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.scss'
})
export class AboutPageComponent {
  readonly ActiveAboutPanel = ActiveAboutPanel;

  activePanel = ActiveAboutPanel.ABOUT;
  private activatedRoute = inject(ActivatedRoute);

  contributionForm = new FormGroup({
    email: new FormControl<string | null>(null, [Validators.required, Validators.email]),
    file: new FormControl<File | null>(null, Validators.required),
    license: new FormControl<string | null>(null, Validators.required),
    rights: new FormControl<string | null>(null, Validators.required),
  });
  contributionFormStatus: 'unsubmitted' | 'submitted' | 'error' = 'unsubmitted';

  constructor(private fileService: FilesService) {
    this.activatedRoute.params.subscribe((params) => {
      if (params['section'] && ActiveAboutPanel[params['section'].replaceAll('-', '_').toUpperCase()]) {
        this.activePanel = ActiveAboutPanel[params['section'].replaceAll('-', '_').toUpperCase()] as any as ActiveAboutPanel;
      } else {
        this.activePanel = ActiveAboutPanel.ABOUT;
      }
    });
  }

  onUploadSelect(event: FileSelectEvent) {
    if (event.files && event.files.length > 0) {
      this.contributionForm.patchValue({ file: event.files[0] });
    }
  }

  submitContributionForm() {
    const renamedFile = new File([this.contributionForm.value.file!], this.contributionForm.value.email! + '_' + this.contributionForm.value.file!.name, {
        type: this.contributionForm.value.file!.type,
        lastModified: this.contributionForm.value.file!.lastModified,
    });
    this.fileService.uploadFileBucketNameUploadPost('oed-contributions', renamedFile).subscribe({
      next: (response) => {
        this.contributionFormStatus = 'submitted';
      },
      error: (error) => {
        console.error('File upload error', error);
        this.contributionFormStatus = 'error';
      }
    });
  }

  resetContributionForm() {
    this.contributionForm.reset();
    this.contributionFormStatus = 'unsubmitted';
  }
}
