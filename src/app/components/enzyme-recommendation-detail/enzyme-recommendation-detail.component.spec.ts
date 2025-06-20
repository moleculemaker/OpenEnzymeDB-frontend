import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnzymeRecommendationDetailComponent } from './enzyme-recommendation-detail.component';

describe('EnzymeRecommendationDetailComponent', () => {
  let component: EnzymeRecommendationDetailComponent;
  let fixture: ComponentFixture<EnzymeRecommendationDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnzymeRecommendationDetailComponent]
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
