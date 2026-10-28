import { ComponentFixture, TestBed } from '@angular/core/testing';
import { testProviders } from '~/app/testing/test-providers';

import { EntityECNumberComponent } from './entity-ecnumber.component';

describe('EntityECNumberComponent', () => {
  let component: EntityECNumberComponent;
  let fixture: ComponentFixture<EntityECNumberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityECNumberComponent],
      providers: testProviders
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntityECNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
