import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReactionSchemeDialogComponent } from './reaction-scheme-dialog.component';

describe('ReactionSchemeDialogComponent', () => {
  let component: ReactionSchemeDialogComponent;
  let fixture: ComponentFixture<ReactionSchemeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactionSchemeDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReactionSchemeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
