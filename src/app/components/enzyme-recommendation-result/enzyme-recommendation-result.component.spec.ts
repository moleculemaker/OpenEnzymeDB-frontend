import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnzymeRecommendationResultComponent } from './enzyme-recommendation-result.component';

describe('EnzymeRecommendationResultComponent', () => {
  let component: EnzymeRecommendationResultComponent;
  let fixture: ComponentFixture<EnzymeRecommendationResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnzymeRecommendationResultComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnzymeRecommendationResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
