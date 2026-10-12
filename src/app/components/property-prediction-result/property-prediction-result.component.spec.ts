import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Subject } from 'rxjs';

import { PropertyPredictionResultComponent } from './property-prediction-result.component';
import { OpenEnzymeDBService } from '~/app/services/openenzymedb.service';
import { EnvironmentService } from '~/app/services/environment.service';

describe('PropertyPredictionResultComponent', () => {
  let component: PropertyPredictionResultComponent;
  let fixture: ComponentFixture<PropertyPredictionResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyPredictionResultComponent],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]), provideNoopAnimations(),
        // The service reads its URLs and the frontendOnly flag off the env config at construction.
        { provide: EnvironmentService, useValue: { getEnvConfig: () => ({}) } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertyPredictionResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('result fetch', () => {
    let fetches: Subject<any>[];
    let dlkcatSpy: jasmine.Spy;

    beforeEach(() => {
      fetches = [];
      const pending = () => {
        const fetch = new Subject<any>();
        fetches.push(fetch);
        return fetch;
      };
      const service = TestBed.inject(OpenEnzymeDBService);
      dlkcatSpy = spyOn(service, 'getDLKcatResult').and.callFake(pending);
      spyOn(service, 'getUnikpResult').and.callFake(pending);
      spyOn(service, 'getCatpredResult').and.callFake(pending);
    });

    it('fetches once when the loader reports 100 again while the fetch is pending', () => {
      // <app-loading> reports 100 on every poll tick until showResults removes it,
      // so a fetch slower than a tick used to be issued again on each tick.
      component.onProgressChange(100);
      component.onProgressChange(100);
      expect(dlkcatSpy).toHaveBeenCalledTimes(1);

      const row = [{ kcat: 1, km: 1, ki: 1, kcat_km: 1 }];
      fetches.forEach((fetch) => { fetch.next(row); fetch.complete(); });
      expect(component.showResults).toBeTrue();
    });

    it('fetches again on the next 100 after a failed fetch', () => {
      component.onProgressChange(100);
      fetches[0].error(new Error('503'));
      expect(component.showResults).toBeFalse();

      component.onProgressChange(100);
      expect(dlkcatSpy).toHaveBeenCalledTimes(2);
    });
  });
});
