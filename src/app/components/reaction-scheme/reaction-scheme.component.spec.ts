import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReactionSchemeComponent } from './reaction-scheme.component';

describe('ReactionSchemeComponent', () => {
  let component: ReactionSchemeComponent;
  let fixture: ComponentFixture<ReactionSchemeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactionSchemeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReactionSchemeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
