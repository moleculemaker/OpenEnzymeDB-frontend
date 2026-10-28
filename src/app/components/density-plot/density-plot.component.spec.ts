import { ComponentFixture, TestBed } from '@angular/core/testing';
import { testProviders } from '~/app/testing/test-providers';

import { DensityPlotComponent } from './density-plot.component';

describe('DensityPlotComponent', () => {
  let component: DensityPlotComponent;
  let fixture: ComponentFixture<DensityPlotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [DensityPlotComponent],
    providers: testProviders
})
    .compileComponents();

    fixture = TestBed.createComponent(DensityPlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
