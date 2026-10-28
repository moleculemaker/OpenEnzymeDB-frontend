import { ComponentFixture, TestBed } from '@angular/core/testing';
import { testProviders } from '~/app/testing/test-providers';

import { PropertyPredictionDetailComponent } from './property-prediction-detail.component';

describe('PropertyPredictionDetailComponent', () => {
  let component: PropertyPredictionDetailComponent;
  let fixture: ComponentFixture<PropertyPredictionDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyPredictionDetailComponent],
      providers: testProviders
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertyPredictionDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
