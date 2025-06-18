import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of, switchMap } from 'rxjs';
import { Loadable } from '../models/Loadable';

@Injectable({
  providedIn: 'root'
})
export class PubchemService {

  private readonly API_URL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';

  constructor(
    private http: HttpClient
  ) { }

  getCompoundSMILES(name: string): Observable<Loadable<string>> {
    return new Observable(observer => {
      observer.next({ status: 'loading', data: null });

      const subscription = this.http.get(`${this.API_URL}/compound/name/${name}/property/CanonicalSMILES/TXT`, { responseType: 'text' })
        .subscribe({
          next: (smiles) => {
            console.log('[pubchem-service] smiles', smiles);
            observer.next({ status: 'loaded', data: smiles });
            observer.complete();
          },
          error: (error) => {
            observer.next({ 
              status: error.status >= 500 ? 'error' : 'invalid',
              data: null 
            });
            observer.complete();
          }
        });

      return () => subscription.unsubscribe();
    });
  }

  /**
   * Get 3D Structure from PubChem in SDF format
   */
  get3DStructureFromSMILES(smiles: string): Observable<string> {
    return this.getCompoundCIDsFromSMILES(smiles).pipe(
      switchMap((cidline: string) => {
        const cids = cidline.split('\n').filter(cid => cid.trim() !== '');
        if (cids.length === 0) {
          throw new Error('No CID found for the given SMILES');
        }
        return this.http.get(`${this.API_URL}/compound/cid/${cids[0]}/record/SDF?record_type=3d`, { responseType: 'text' });
      })
    );
  }

  getCompoundCIDsFromSMILES(smiles: string): Observable<string> {
    return this.http.get(`${this.API_URL}/compound/smiles/${smiles}/cids/TXT`, { responseType: 'text' });
  }
}
