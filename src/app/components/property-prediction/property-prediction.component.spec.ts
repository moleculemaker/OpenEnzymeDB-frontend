import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyPredictionComponent } from './property-prediction.component';

describe('PropertyPredictionComponent', () => {
  let component: PropertyPredictionComponent;
  let fixture: ComponentFixture<PropertyPredictionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyPredictionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertyPredictionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
