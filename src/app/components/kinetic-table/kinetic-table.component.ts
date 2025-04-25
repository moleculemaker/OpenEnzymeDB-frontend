import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PanelModule } from 'primeng/panel';
import { ExportCSVOptions, Table, TableModule } from 'primeng/table';
import { ExternalLinkComponent } from '../external-link/external-link.component';
import { FilterDialogComponent } from '../filter-dialog/filter-dialog.component';
import { FilterConfig, MultiselectFilterConfig, RangeFilterConfig } from '~/app/models/filters';
import { FilterService } from 'primeng/api';
import { animate } from '@angular/animations';
import { style, transition } from '@angular/animations';
import { trigger } from '@angular/animations';

@Component({
  selector: 'app-kinetic-table',
  standalone: true,
  animations: [
    trigger(
      'slideIn', 
      [
        transition(
          ':enter', 
          [
            style({ maxHeight: 0 }),
            animate('.5s ease-out', 
                    style({ maxHeight: 800 }))
          ]
        )
      ]
    )
  ],
  imports: [
    PanelModule,
    TableModule,
    CommonModule,

    ExternalLinkComponent,
    FilterDialogComponent,
  ],
  templateUrl: './kinetic-table.component.html',
  styleUrl: './kinetic-table.component.scss'
})
export class KineticTableComponent implements OnChanges {
  @Input() result: {
    status: 'loading' | 'loaded' | 'error' | 'na';
    data: any[];
    total: number;
  } = {
    status: 'na',
    data: [],
    total: 0,
  };
  @Input() filters: Record<string, FilterConfig> = {};

  @ViewChild(Table) resultsTable!: Table;

  columns: any[] = [];

  showFilter = false;
  hasFilter = false;

  get filterRecordsByCategory() {
    return Object.entries(this.filters)
      .reduce((acc, [key, filter]) => {
        if (!acc[filter.category]) {
          acc[filter.category] = [filter];
      } else {
        acc[filter.category].push(filter);
      }
      return acc;
    }, {} as Record<string, FilterConfig[]>);
  }

  get filterRecords() {
    return Object.values(this.filters);
  }

  constructor(
    private filterService: FilterService
  ) {
    this.filterService.register(
      "range",
      (value: number, filter: [number, number]) => {
        if (!filter) {
          return true;
        }
        return value >= filter[0] && value <= filter[1];
      },
    );

    this.filterService.register(
      "subset",
      (value: any[], filter: any[]) => {
        if (!filter) {
          return true;
        }
        return filter.every((f) => value.includes(f));
      },
    );

    this.updateFilterOptions(this.result.data);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['result'] && this.result.data) {
      this.updateFilterOptions(this.result.data);
    }
  }

  export(options?: ExportCSVOptions) {
    this.resultsTable.exportCSV(options);
  }

  clearAllFilters() {
    this.showFilter = false;
    this.filterRecords.forEach((filter) => {
      filter.value = filter.defaultValue;
    });
    if (this.resultsTable) {
      this.applyFilters();
    }
  }

  applyFilters() {
    this.showFilter = false;
    this.filterRecords.forEach((filter) => {
      this.resultsTable.filter(filter.value, filter.field, filter.matchMode);
    });
    this.hasFilter = this.filterRecords.some((filter) => filter.hasFilter());
  }

  searchTable(filter: FilterConfig): void {
    this.resultsTable.filter(filter.value, filter.field, filter.matchMode);
    this.hasFilter = this.filterRecords.some(f => f.hasFilter());
  }

  private updateFilterOptions(response: any[]) {
    function getField(obj: any, dotPath: string) {
      return dotPath.split('.').reduce((obj, key) => obj[key], obj);
    }
    
    Object.entries(this.filters).forEach(([key, filter]) => {
      const options = response.map((row: any) => getField(row, filter.field)).flat();
      const optionsSet = new Set(options);
      if (filter instanceof MultiselectFilterConfig) {
        filter.options = Array.from(optionsSet).map((option: any) => ({
          label: option,
          value: option,
        }));
        filter.defaultValue = [];
      } else if (filter instanceof RangeFilterConfig) {
        filter.min = Math.min(...options);
        filter.max = Math.max(...options);
        filter.value = [filter.min, filter.max];
        filter.defaultValue = [filter.min, filter.max];
      }
    });
    
    this.columns = Object.values(this.filters).map((filter) => ({
      field: filter.field,
      header: filter.label.rawValue,
    }));
  }
}
