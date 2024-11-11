import { CommonModule, JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { MarvinjsInputComponent } from '../marvinjs-input/marvinjs-input.component';

interface SearchOption {
  key: string;
  label: string;
  type: string;
  formControl: FormControl<any | null>;
  example: {
    label: string;
    value: string;
  };
}

@Component({
  selector: 'app-query-input',
  standalone: true,
  imports: [
    DropdownModule,
    FormsModule,
    InputTextModule,
    MenuModule,
    JsonPipe,
    CommonModule,
    MarvinjsInputComponent,
    ReactiveFormsModule
  ],
  templateUrl: './query-input.component.html',
  styleUrl: './query-input.component.scss'
})
export class QueryInputComponent {
  searchConfigs: SearchOption[] = [
    { 
      key: 'compound',
      label: 'Compound', 
      type: 'string',
      formControl: new FormControl<string | null>(''),
      example: {
        label: 'Ethanol (CCO)',
        value: 'CCO'
      },
    },
    { 
      key: 'organism',
      label: 'Organism', 
      type: 'string',
      formControl: new FormControl<string | null>(''),
      example: {
        label: 'Lentzea aerocolonigenes',
        value: 'Lentzea aerocolonigenes'
      }
    },
    { 
      key: 'uniprot_id',
      label: 'Uniprot ID', 
      type: 'string',
      formControl: new FormControl<string | null>(''),
      example: {
        label: 'A2BC19',
        value: 'A2BC19'
      }
    },
    { 
      key: 'ec_number',
      label: 'EC Number', 
      type: 'string',
      formControl: new FormControl<string | null>(''),
      example: {
        label: '2.7.10.1',
        value: '2.7.10.1'
      }
    },
    { 
      key: 'ph',
      label: 'pH', 
      type: 'range',
      formControl: new FormControl<[number, number] | null>(null),
      example: {
        label: '1-8',
        value: '1-8'
      }
    },
    { 
      key: 'temperature',
      label: 'Temperature', 
      type: 'range',
      formControl: new FormControl<[number, number] | null>(null),
      example: {
        label: '37-39°C',
        value: '37-39'
      }
    },
  ];

  readonly searchOptions = this.searchConfigs.map((config) => ({
    ...config,
    command: () => { this.selectedSearchOption = config }
  }));

  readonly searchOptionRecords = this.searchConfigs.reduce((acc, config) => {
    acc[config.key] = config;
    return acc;
  }, {} as Record<string, typeof this.searchConfigs[0]>);


  selectedSearchOption: SearchOption | null = null;

}
