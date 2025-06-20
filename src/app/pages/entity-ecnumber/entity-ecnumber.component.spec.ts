import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityEcnumberComponent } from './entity-ecnumber.component';

describe('EntityEcnumberComponent', () => {
  let component: EntityEcnumberComponent;
  let fixture: ComponentFixture<EntityEcnumberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityEcnumberComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntityEcnumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
