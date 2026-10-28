import { ComponentFixture, TestBed } from '@angular/core/testing';
import { testProviders } from '~/app/testing/test-providers';

import { EntityCompoundComponent } from './entity-compound.component';

describe('EntityCompoundComponent', () => {
  let component: EntityCompoundComponent;
  let fixture: ComponentFixture<EntityCompoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityCompoundComponent],
      providers: testProviders
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
