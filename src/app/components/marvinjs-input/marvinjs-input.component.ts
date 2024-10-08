import { Component, EventEmitter, Input, Output, forwardRef } from "@angular/core";
import { AbstractControl, AsyncValidator, ControlValueAccessor, NG_ASYNC_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, FormsModule } from "@angular/forms";
import { BehaviorSubject, Observable, debounceTime, filter, first, map, of, switchMap, tap, withLatestFrom } from "rxjs";
import { InputTextModule } from "primeng/inputtext";
import { ButtonDirective, Button } from "primeng/button";
import { NgIf, AsyncPipe } from "@angular/common";
import { DialogModule } from "primeng/dialog";
import { PrimeTemplate } from "primeng/api";

import { ChemicalAutoCompleteResponse } from "~/app/api/mmli-backend/v1";
import { MarvinJsEditorComponent } from "../marvinjs/marvinjs-editor.component";

@Component({
    selector: "app-marvinjs-input",
    templateUrl: "./marvinjs-input.component.html",
    styleUrls: ["./marvinjs-input.component.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MarvinjsInputComponent),
            multi: true
        },
        {
            provide: NG_ASYNC_VALIDATORS,
            useExisting: forwardRef(() => MarvinjsInputComponent),
            multi: true
        }
    ],
    standalone: true,
    imports: [FormsModule, InputTextModule, ButtonDirective, NgIf, DialogModule, MarvinJsEditorComponent, PrimeTemplate, Button, AsyncPipe]
})
export class MarvinjsInputComponent implements ControlValueAccessor, AsyncValidator {
  @Input() placeholder: string = "";
  @Output() onChemicalValidated = new EventEmitter<ChemicalAutoCompleteResponse | null>();

  userInput$ = new BehaviorSubject<string>("");
  showDialog$ = new BehaviorSubject(false);

  validateCache = new Map();
  validatedChemical$ = this.userInput$.pipe(
    debounceTime(1000),
    switchMap((v) => 
      this.validateCache.has(v) 
      ? of(this.validateCache.get(v) as ChemicalAutoCompleteResponse)
      : of(null) //TODO: replace with actual validation
    ),
    withLatestFrom(this.userInput$),
    tap(([chemical, v]) => {
      if (!this.validateCache.has(v)) {
        this.validateCache.set(v, chemical);
        this.onChange(v);
        this.onTouched();
      }
    }),
    map(([chemical, _]) => chemical)
  );

  smiles$ = this.validatedChemical$.pipe(
    filter((chemical) => !!chemical),
    map((chemical) => chemical!.smiles),
  );

  constructor() {}
  
  /* -------------------------------------------------------------------------- */
  /*                      Control Value Accessor Interface                      */
  /* -------------------------------------------------------------------------- */
  disabled = false;
  onChange = (value: string) => {};
  onTouched = () => {};

  writeValue(obj: string): void {
    this.userInput$.next(obj);
    this.onChange(obj);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /* -------------------------------------------------------------------------- */
  /*                          Async Validator Interface                         */
  /* -------------------------------------------------------------------------- */
  onValidatorChange = () => {};

  validate(control: AbstractControl<any, any>): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> {
    return this.validatedChemical$.pipe(
      map((chemical) => {
        if (chemical) {
          this.onChemicalValidated.emit(chemical);
          return null;
        }
        return null;
      }),
      first()
    );
  }

  registerOnValidatorChange?(fn: () => void): void {
    this.onValidatorChange = fn;
  }
}
