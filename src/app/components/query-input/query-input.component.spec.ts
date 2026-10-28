import { ComponentFixture, TestBed } from '@angular/core/testing';
import { testProviders } from '~/app/testing/test-providers';

import { QueryInputComponent } from './query-input.component';

describe('QueryInputComponent', () => {
  let component: QueryInputComponent;
  let fixture: ComponentFixture<QueryInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QueryInputComponent],
      providers: testProviders
    })
    .compileComponents();

    fixture = TestBed.createComponent(QueryInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
