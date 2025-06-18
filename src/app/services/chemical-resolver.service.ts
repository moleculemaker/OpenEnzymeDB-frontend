import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Loadable } from "../models/Loadable";
import { CactusService } from './cactus.service';
import { PubchemService } from './pubchem.service';

@Injectable({
  providedIn: 'root'
})
export class ChemicalResolverService {

  constructor(
    private cactusService: CactusService,
    private pubchemService: PubchemService
  ) { }

  getSMILESFromName(name: string): Observable<Loadable<string>> {
    return this.pubchemService.getCompoundSMILES(name);
  }
}
