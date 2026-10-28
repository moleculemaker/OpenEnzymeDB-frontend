import { ComponentFixture, TestBed } from '@angular/core/testing';
import { testProviders } from '~/app/testing/test-providers';

import { JobTabComponent } from './job-tab.component';

describe('JobTabComponent', () => {
  let component: JobTabComponent;
  let fixture: ComponentFixture<JobTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [JobTabComponent],
    providers: testProviders
})
    .compileComponents();

    fixture = TestBed.createComponent(JobTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
