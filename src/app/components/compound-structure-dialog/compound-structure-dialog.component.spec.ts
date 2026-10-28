import { ComponentFixture, TestBed } from '@angular/core/testing';
import { testProviders } from '~/app/testing/test-providers';

import { CompoundStructureDialogComponent } from './compound-structure-dialog.component';

describe('CompoundStructureDialogComponent', () => {
  let component: CompoundStructureDialogComponent;
  let fixture: ComponentFixture<CompoundStructureDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompoundStructureDialogComponent],
      providers: testProviders
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompoundStructureDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
