import { ComponentFixture, TestBed } from '@angular/core/testing';
import { testProviders } from '~/app/testing/test-providers';

import { EntityUniprotComponent } from './entity-uniprot.component';

describe('EntityUniprotComponent', () => {
  let component: EntityUniprotComponent;
  let fixture: ComponentFixture<EntityUniprotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityUniprotComponent],
      providers: testProviders
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
