import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyPredictionResultComponent } from './property-prediction-result.component';

describe('PropertyPredictionResultComponent', () => {
  let component: PropertyPredictionResultComponent;
  let fixture: ComponentFixture<PropertyPredictionResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyPredictionResultComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertyPredictionResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
