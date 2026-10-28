import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExternalLinkComponent } from './external-link.component';

describe('ExternalLinkComponent', () => {
  let component: ExternalLinkComponent;
  let fixture: ComponentFixture<ExternalLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExternalLinkComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExternalLinkComponent);
    component = fixture.componentInstance;
    component.linkItem = { url: 'https://example.org', label: 'Example' };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
