import { TestBed } from '@angular/core/testing';

import { PubchemService } from './pubchem.service';

describe('PubchemService', () => {
  let service: PubchemService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PubchemService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
