import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AboutPageComponent } from './about-page.component';
import { OpenEnzymeDBService } from '../api/mmli-backend/v1';

describe('AboutPageComponent', () => {
  let component: AboutPageComponent;
  let fixture: ComponentFixture<AboutPageComponent>;
  let oedService: jasmine.SpyObj<OpenEnzymeDBService>;

  beforeEach(async () => {
    oedService = jasmine.createSpyObj<OpenEnzymeDBService>('OpenEnzymeDBService', ['submitContributionOedContributionsPost']);

    await TestBed.configureTestingModule({
      imports: [AboutPageComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: OpenEnzymeDBService, useValue: oedService },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(AboutPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('file picker', () => {
    const file = new File(['data'], 'kinetics.xlsx');

    it('takes the file the picker accepted', () => {
      component.onUploadSelect({ files: [file], currentFiles: [file] } as any);

      expect(component.contributionForm.value.file).toBe(file);
    });

    it('clears the file when the picker rejects the selection', () => {
      component.contributionForm.patchValue({ file });

      // PrimeNG still lists a rejected (e.g. oversized) file in event.files, but not in currentFiles.
      component.onUploadSelect({ files: [file], currentFiles: [] } as any);

      expect(component.contributionForm.value.file).toBeNull();
    });
  });

  describe('email', () => {
    it('rejects a domain without a dot, which the backend rejects', () => {
      component.contributionForm.controls.email.setValue('me@lab');

      expect(component.contributionForm.controls.email.valid).toBeFalse();
    });

    it('accepts a normal address', () => {
      component.contributionForm.controls.email.setValue('me@example.org');

      expect(component.contributionForm.controls.email.valid).toBeTrue();
    });
  });

  describe('contribution form', () => {
    const file = new File(['data'], 'kinetics.xlsx');

    beforeEach(() => {
      // The checkboxes are non-binary p-checkboxes, so a checked box holds an array of its value.
      component.contributionForm.setValue({
        email: 'contributor@example.org',
        file,
        license: ['cc-by-4'] as any,
        rights: ['confirm'] as any,
      });
    });

    it('submits the original file, email and both agreements to the contributions endpoint', () => {
      oedService.submitContributionOedContributionsPost.and.returnValue(of({}) as any);

      component.submitContributionForm();

      expect(oedService.submitContributionOedContributionsPost)
        .toHaveBeenCalledOnceWith(file, 'contributor@example.org', true, true);
      expect(component.contributionFormStatus).toBe('submitted');
    });

    it('shows the error state when the backend rejects the contribution', () => {
      spyOn(console, 'error');
      oedService.submitContributionOedContributionsPost.and.returnValue(throwError(() => new Error('400')));

      component.submitContributionForm();

      expect(component.contributionFormStatus).toBe('error');
    });
  });
});
