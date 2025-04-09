import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { FilterConfig } from '~/app/models/filters';

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [
    CommonModule,
    MultiSelectModule,
    FormsModule,
  ],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss'
})
export class FilterComponent {
  @Input() filter!: FilterConfig;
  @Output() filterChange = new EventEmitter<FilterConfig>();

  onFilterChange(event: any) {
    switch (this.filter.type) {
      case 'range':
        this.filter.value = event.target.value;
        break;
      case 'multiselect':
        this.filter.value = event.value;
        break;
    }
    this.filterChange.emit(this.filter);
  }
}
