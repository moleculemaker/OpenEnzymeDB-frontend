import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CactusService {
  private readonly API_URL = 'https://cactus.nci.nih.gov';

  constructor(
    private http: HttpClient
  ) { }


  /**
   * Get SMILES from Cactus
   */
  getSMILESFromName(name: string): Observable<string> {
    return this.http.get(`${this.API_URL}/chemical/structure/${name}/smiles`, { responseType: 'text' });
  }
}
