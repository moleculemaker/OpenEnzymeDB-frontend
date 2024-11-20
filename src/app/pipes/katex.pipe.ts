import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import katex from 'katex';

@Pipe({
    name: 'katex',
    standalone: true
})
export class KatexPipe implements PipeTransform {

constructor(protected sanitizer: DomSanitizer) {}

  public transform(value: any): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
        katex.renderToString(value, { 
            output: 'mathml',
        })
    );
  }
}
