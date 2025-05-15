import { Directive, EventEmitter, forwardRef, Output } from '@angular/core';
import { AbstractControl, AsyncValidator, NG_ASYNC_VALIDATORS, ValidationErrors } from '@angular/forms';
import { Observable, of, tap, startWith, distinctUntilChanged, debounceTime, switchMap, filter, map, first } from 'rxjs';
import { Loadable } from '../services/openenzymedb.service';
import { CommonService } from '../services/common.service';

@Directive({
  selector: '[appSmilesValidator]',
  providers: [
    {
        provide: NG_ASYNC_VALIDATORS,
        useExisting: forwardRef(() => SmilesValidatorDirective),
        multi: true
    }
],
  standalone: true
})
export class SmilesValidatorDirective implements AsyncValidator {
  @Output() onSmilesValidationStatusChange = new EventEmitter<Loadable<string>>();

  constructor(
    private commonService: CommonService
  ) { }

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    if (!control.value || control.value.trim() === '') {
      this.onSmilesValidationStatusChange.emit({
        status: 'na',
        data: null
      });
      return of({ required: true });
    }
    return control.valueChanges.pipe(
      tap(() => {
        this.onSmilesValidationStatusChange.emit({
          status: 'loading',
          data: null
        })
      }),
      startWith(control.value),
      distinctUntilChanged(),
      debounceTime(300),
      switchMap(() => this.commonService.drawSMILES(control.value)),
      filter((result: Loadable<string>) => 
          result.status === 'loaded' 
        || result.status === 'error' 
        || result.status === 'invalid'
      ),
      map((result: Loadable<string>) => {
        this.onSmilesValidationStatusChange.emit(result);
        if (result.status === 'error' || result.status === 'invalid') {
          return { invalidSmiles: true };
        }
        return null;
      }),
      first()
    );
  }

}
