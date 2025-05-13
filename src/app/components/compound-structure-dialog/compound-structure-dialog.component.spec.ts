import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompoundStructureDialogComponent } from './compound-structure-dialog.component';

describe('CompoundStructureDialogComponent', () => {
  let component: CompoundStructureDialogComponent;
  let fixture: ComponentFixture<CompoundStructureDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompoundStructureDialogComponent]
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
