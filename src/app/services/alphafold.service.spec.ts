import { TestBed } from '@angular/core/testing';

import { AlphafoldService } from './alphafold.service';

describe('AlphafoldService', () => {
  let service: AlphafoldService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlphafoldService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
