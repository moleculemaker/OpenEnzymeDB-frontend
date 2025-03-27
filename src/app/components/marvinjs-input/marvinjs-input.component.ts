import { Component, EventEmitter, forwardRef, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import { Button } from "primeng/button";
import { NgIf } from "@angular/common";
import { DialogModule } from "primeng/dialog";
import { PrimeTemplate } from "primeng/api";
import { KetcherComponent } from "../ketcher/ketcher.component";

@Component({
  selector: "app-marvinjs-input",
  templateUrl: "./marvinjs-input.component.html",
  styleUrls: ["./marvinjs-input.component.scss"],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MarvinjsInputComponent),
      multi: true
    }
  ],
  standalone: true,
  imports: [FormsModule, InputTextModule, NgIf, DialogModule, KetcherComponent, PrimeTemplate, Button]
})
export class MarvinjsInputComponent implements OnChanges, ControlValueAccessor {
  @Input() placeholder: string = "";
  @Input() ngModel: string = '';
  @Output() ngModelChange = new EventEmitter<string>();

  showDialog = false;
  disabled = false;

  // this value is broadcasted to parent
  #textInput = '';

  // this value is used to sync with ketcher and text input
  // sometimes text input can be a molecule object. in this case
  // we need to convert it to a string
  #marvinInput = '';

  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  get textInput() {
    return this.#textInput;
  }

  set textInput(value: string) {
    this.#textInput = value;
    this.#marvinInput = value;
    
    this.ngModelChange.emit(value);
    this.onChange(value);
    this.onTouched();
  }

  get marvinInput() {
    return this.#marvinInput;
  }

  set marvinInput(value: string) {
    this.#marvinInput = value;
    this.textInput = value;
  }

  constructor() {
    if (this.ngModel) {
      this.#textInput = this.ngModel;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['ngModel']) {
      this.#textInput = this.ngModel;
      this.#marvinInput = this.ngModel;
    }
  }

  writeValue(value: string): void {
    this.#textInput = value;
    this.#marvinInput = value;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
