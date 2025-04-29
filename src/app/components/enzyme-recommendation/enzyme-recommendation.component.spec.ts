import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnzymeRecommendationComponent } from './enzyme-recommendation.component';

describe('EnzymeRecommendationComponent', () => {
  let component: EnzymeRecommendationComponent;
  let fixture: ComponentFixture<EnzymeRecommendationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnzymeRecommendationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnzymeRecommendationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
