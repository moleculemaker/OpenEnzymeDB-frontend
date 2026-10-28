import { ComponentFixture, TestBed } from '@angular/core/testing';
import { testProviders } from '~/app/testing/test-providers';

import { ReactionSchemeComponent } from './reaction-scheme.component';

describe('ReactionSchemeComponent', () => {
  let component: ReactionSchemeComponent;
  let fixture: ComponentFixture<ReactionSchemeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactionSchemeComponent],
      providers: testProviders
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReactionSchemeComponent);
    component = fixture.componentInstance;
    // ngOnChanges builds the scheme from this input, so it has to be set through setInput.
    fixture.componentRef.setInput('reactionScheme', {
      reactionPartners: 'ATP + D-glucose = ADP + D-glucose 6-phosphate',
      reactants: ['ATP', 'D-glucose'],
      products: ['ADP', 'D-glucose 6-phosphate'],
      ligandStructureId: 1,
      representative: true,
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
