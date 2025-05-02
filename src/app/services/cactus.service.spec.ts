import { TestBed } from '@angular/core/testing';

import { CactusService } from './cactus.service';

describe('CactusService', () => {
  let service: CactusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CactusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
