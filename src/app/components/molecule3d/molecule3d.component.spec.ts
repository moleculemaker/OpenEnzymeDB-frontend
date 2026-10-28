import { ComponentFixture, TestBed } from '@angular/core/testing';
import { testProviders } from '~/app/testing/test-providers';

import { Molecule3dComponent } from './molecule3d.component';

describe('Molecule3dComponent', () => {
  let component: Molecule3dComponent;
  let fixture: ComponentFixture<Molecule3dComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Molecule3dComponent],
      providers: testProviders
    })
    .compileComponents();

    fixture = TestBed.createComponent(Molecule3dComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', { data: 'CCO', dataType: 'smi', viewerOptions: { mode: 'stick' } });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
