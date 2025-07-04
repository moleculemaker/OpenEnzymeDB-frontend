// $3DMol is loaded in index.html; see the other changes included with the commit that introduced this comment
import { Injectable } from "@angular/core";
import { interval, Observable, ReplaySubject } from "rxjs";
import { first } from "rxjs/operators";

declare global {
  interface Window {
    $3Dmol: any;
  }
}

@Injectable({
  providedIn: "root"
})
export class ThreedmolLoaderService {
  private ThreeDMolSubject$: ReplaySubject<any> = new ReplaySubject<any>(1);

  constructor() {
    // Check if 3DMol is already loaded
    if (window.$3Dmol) {
      this.ThreeDMolSubject$.next(window.$3Dmol);
    } else {
      // If not loaded, wait for it to be available
      const checkInterval = interval(100).subscribe(() => {
        if (window.$3Dmol) {
          this.ThreeDMolSubject$.next(window.$3Dmol);
          checkInterval.unsubscribe();
        }
      });
    }
  }

  /**
   * Returns an observable with the $3DMol module in it.
   */
  get3DMol(): Observable<any> {
    return this.ThreeDMolSubject$.asObservable().pipe(first());
  }
}