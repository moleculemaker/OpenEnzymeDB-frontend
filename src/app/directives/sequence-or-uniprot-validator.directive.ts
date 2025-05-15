import { Directive, forwardRef, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({
  selector: '[appSequenceOrUniprotValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => SequenceOrUniprotValidatorDirective),
      multi: true
    }
  ],
  standalone: true
})
export class SequenceOrUniprotValidatorDirective implements Validator {
  @Input() multiple: boolean = false;
  private maxSeqNum: number = 20;
  private validAminoAcid = new RegExp("[^GPAVLIMCFYWHKRQNEDST]", "i");
  private validDNA = new RegExp("[^ACTG]", "i");
  private uniprotPattern = new RegExp("^[A-Z][A-Z0-9_]{5,9}$");

  validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return { required: true };
    }

    const value = control.value.trim();

    // Check if it starts with '>'
    if (value.startsWith('>')) {
      // Validate as sequence
      if (this.multiple) {
        return this.validateMultipleSequences(value);
      } else {
        return this.validateSingleSequence(value);
      }
    } else {
      // Validate as UniProt ID
      return this.validateUniprotId(value);
    }
  }

  private validateUniprotId(value: string): ValidationErrors | null {
    if (this.uniprotPattern.test(value)) {
      return null;
    }
    return { invalidUniprotId: true };
  }

  private validateMultipleSequences(sequenceData: string): ValidationErrors | null {
    const splitString: string[] = sequenceData.split('>').slice(1);
    const headers: string[] = [];
    const errors: ValidationErrors[] = [];

    // Check if sequence is empty
    if (splitString.length === 0) {
      return { noSequence: true };
    }

    // Check if exceeds max sequence number
    if (splitString.length > this.maxSeqNum) {
      return { exceedsMaxSeqNum: true };
    }

    // Check for whitespace after >
    if (splitString[0].charAt(0) === ' ') {
      return { containsWhitespace: true };
    }

    // Validate each sequence
    splitString.forEach((seq: string, index: number) => {
      const aminoHeader: string = seq.split('\n')[0];
      let aminoSeq: string = seq.split('\n').slice(1).join('');

      // Remove trailing * if present
      if (aminoSeq.slice(-1) === '*') {
        aminoSeq = aminoSeq.slice(0, -1);
      }
      aminoSeq = aminoSeq.toUpperCase();

      // Check for empty header
      if (aminoHeader.length === 0) {
        errors.push({ headerCannotBeEmpty: index });
      }

      // Check for invalid sequence
      if (this.isInvalidFasta(aminoSeq)) {
        errors.push({ invalidSequence: aminoHeader });
      }

      // Check sequence length
      if (aminoSeq.length > 1022) {
        errors.push({ sequenceLengthGreaterThan1022: aminoHeader });
      }

      if (aminoSeq.length === 0) {
        errors.push({ sequenceLengthIs0: aminoHeader });
      }

      headers.push(aminoHeader);
    });

    // Check for duplicate headers
    if (this.hasDuplicateHeaders(headers)) {
      return { duplicateHeaders: true };
    }

    // Return all validation errors if any exist
    if (errors.length > 0) {
      return { errors };
    }

    return null;
  }

  private validateSingleSequence(sequenceData: string): ValidationErrors | null {
    // Remove the '>' character and get the header and sequence
    const [header, ...sequenceParts] = sequenceData.split('\n');
    const aminoHeader = header.substring(1).trim(); // Remove '>' and trim
    let aminoSeq = sequenceParts.join('').trim().toUpperCase();

    // Check for empty header
    if (aminoHeader.length === 0) {
      return { headerCannotBeEmpty: true };
    }

    // Remove trailing * if present
    if (aminoSeq.slice(-1) === '*') {
      aminoSeq = aminoSeq.slice(0, -1);
    }

    // Check for invalid sequence
    if (this.isInvalidFasta(aminoSeq)) {
      return { invalidSequence: true };
    }

    // Check sequence length
    if (aminoSeq.length > 1022) {
      return { sequenceLengthGreaterThan1022: true };
    }

    if (aminoSeq.length === 0) {
      return { sequenceLengthIs0: true };
    }

    return null;
  }

  private isInvalidFasta(seq: string): boolean {
    return this.validAminoAcid.test(seq);
  }

  private hasDuplicateHeaders(array: string[]): boolean {
    return (new Set(array)).size !== array.length;
  }
} 