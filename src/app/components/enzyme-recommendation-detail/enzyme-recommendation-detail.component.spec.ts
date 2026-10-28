import { ComponentFixture, TestBed } from '@angular/core/testing';
import { testProviders } from '~/app/testing/test-providers';

import { EnzymeRecommendationDetailComponent } from './enzyme-recommendation-detail.component';

describe('EnzymeRecommendationDetailComponent', () => {
  let component: EnzymeRecommendationDetailComponent;
  let fixture: ComponentFixture<EnzymeRecommendationDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnzymeRecommendationDetailComponent],
      providers: testProviders
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnzymeRecommendationDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
