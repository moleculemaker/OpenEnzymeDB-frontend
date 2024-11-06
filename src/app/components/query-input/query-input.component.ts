import { Component } from '@angular/core';
import { FormControl, FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';

@Component({
  selector: 'app-query-input',
  standalone: true,
  imports: [
    DropdownModule,
    FormsModule,
    InputTextModule,
    MenuModule,
  ],
  templateUrl: './query-input.component.html',
  styleUrl: './query-input.component.scss'
})
export class QueryInputComponent {
  searchConfigs = {
    'compound': { 
      label: 'Compound', 
      formControl: new FormControl<string | null>(''),
    },
    'organism': { 
      label: 'Organism', 
      formControl: new FormControl<string | null>(''),
    },
    'uniprot_id': { 
      label: 'Uniprot ID', 
      formControl: new FormControl<string | null>(''),
    },
    'ec_number': { 
      label: 'EC Number', 
      formControl: new FormControl<string | null>(''),
    },
    'ph': { 
      label: 'pH', 
      formControl: new FormControl<[number, number] | null>(null),
    },
    'temperature': { 
      label: 'Temperature', 
      formControl: new FormControl<[number, number] | null>(null),
    },
  };
  searchOptions = Object.entries(this.searchConfigs).map(([key, config]) => ({
    ...config,
    command: () => { this.selectedSearchOption = config }
  }));
  selectedSearchOption: any = null;

}
