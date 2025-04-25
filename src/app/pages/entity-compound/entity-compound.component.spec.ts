import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityCompoundComponent } from './entity-compound.component';

describe('EntityCompoundComponent', () => {
  let component: EntityCompoundComponent;
  let fixture: ComponentFixture<EntityCompoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityCompoundComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntityCompoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
