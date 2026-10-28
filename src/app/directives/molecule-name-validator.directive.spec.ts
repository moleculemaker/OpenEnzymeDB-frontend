import { MoleculeNameValidatorDirective } from './molecule-name-validator.directive';
import { ChemicalResolverService } from '../services/chemical-resolver.service';
import { CommonService } from '../services/common.service';

describe('MoleculeNameValidatorDirective', () => {
  it('should create an instance', () => {
    const directive = new MoleculeNameValidatorDirective({} as ChemicalResolverService, {} as CommonService);
    expect(directive).toBeTruthy();
  });
});
