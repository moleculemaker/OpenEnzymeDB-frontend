import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AboutPageComponent } from './about-page.component';
import { OEDService } from '../api/mmli-backend/v1';

describe('AboutPageComponent', () => {
  let component: AboutPageComponent;
  let fixture: ComponentFixture<AboutPageComponent>;
  let oedService: jasmine.SpyObj<OEDService>;

  beforeEach(async () => {
    oedService = jasmine.createSpyObj<OEDService>('OEDService', ['submitContributionOedContributionsPost']);

    await TestBed.configureTestingModule({
      imports: [AboutPageComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: OEDService, useValue: oedService },
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
