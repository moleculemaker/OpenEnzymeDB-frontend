import { SmilesValidatorDirective } from './smiles-validator.directive';
import { CommonService } from '../services/common.service';

describe('SmilesValidatorDirective', () => {
  it('should create an instance', () => {
    const directive = new SmilesValidatorDirective({} as CommonService);
    expect(directive).toBeTruthy();
  });
});
