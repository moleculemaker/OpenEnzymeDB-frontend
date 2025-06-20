import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityUniprotComponent } from './entity-uniprot.component';

describe('EntityUniprotComponent', () => {
  let component: EntityUniprotComponent;
  let fixture: ComponentFixture<EntityUniprotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityUniprotComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntityUniprotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
