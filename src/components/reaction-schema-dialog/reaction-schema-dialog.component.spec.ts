import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReactionSchemaDialogComponent } from './reaction-schema-dialog.component';

describe('ReactionSchemaDialogComponent', () => {
  let component: ReactionSchemaDialogComponent;
  let fixture: ComponentFixture<ReactionSchemaDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactionSchemaDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReactionSchemaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
