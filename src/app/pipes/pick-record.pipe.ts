import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pickRecord',
  standalone: true
})
export class PickRecordPipe implements PipeTransform {

  transform(
    value: Record<string | number | symbol, unknown>, 
    arg: 'key' | 'value'
  ): unknown[] {
    return arg === 'key' ? Object.keys(value) : Object.values(value);
  }

}
