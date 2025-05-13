import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobTabPredictionComponent } from './job-tab-prediction.component';

describe('JobTabPredictionComponent', () => {
  let component: JobTabPredictionComponent;
  let fixture: ComponentFixture<JobTabPredictionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [JobTabPredictionComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(JobTabPredictionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
