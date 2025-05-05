import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnzymeStructureDialogComponent } from './enzyme-structure-dialog.component';

describe('EnzymeStructureDialogComponent', () => {
  let component: EnzymeStructureDialogComponent;
  let fixture: ComponentFixture<EnzymeStructureDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnzymeStructureDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnzymeStructureDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
