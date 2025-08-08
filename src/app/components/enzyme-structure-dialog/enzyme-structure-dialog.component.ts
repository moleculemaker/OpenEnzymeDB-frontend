import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { RecommendationResultRowGroup, RecommendationResultRow } from '~/app/components/enzyme-recommendation-detail/enzyme-recommendation-detail.component';
import { MultiselectFilterConfig, SingleSelectFilterConfig } from '~/app/models/filters';
import { FilterComponent } from '~/app/components/filter/filter.component';
import { Molecule3dComponent } from '~/app/components/molecule3d/molecule3d.component';

/**
 * Enzyme Structure Dialog Component
 * 
 * This component displays a dialog for viewing enzyme structures with filtering capabilities.
 * The dialog implements a cascading filter system with the following business rules:
 * 
 * Input Handling:
 * - dataset: Array of RecommendationResultRow containing all available data
 * - group: Optional RecommendationResultRowGroup that, when provided, initializes filter values
 * 
 * Filter Initialization:
 * - All filter values are initialized using the input dataset
 * - If group is provided, filter values are set to match the group's values
 * - Compound filter contains all unique compound names from the input dataset
 * - Organism and UniProt ID filters start with no options until a compound is selected
 * 
 * Compound Filter:
 * - Single select filter that shows all unique compound names from the dataset
 * - When a compound is selected, it triggers updates to both organism and UniProt ID filters
 * - If group is provided, initializes with the group's compound name
 * 
 * Organism Filter:
 * - Multi-select filter that is dependent on the compound filter
 * - By default has no options if no compound is selected
 * - When a compound is selected, shows all unique organisms associated with that compound
 * - Selection changes trigger updates to the UniProt ID filter
 * - If group is provided, initializes with the group's organisms
 * 
 * UniProt ID Filter:
 * - Multi-select filter that is dependent on both compound and organism filters
 * - By default has no options if no compound is selected
 * - When a compound is selected, shows all unique UniProt IDs associated with that compound
 * - If organisms are selected, further filters to show only UniProt IDs that are associated with
 *   both the selected compound and the selected organisms
 * - Filter values are cleared whenever compound or organism selections change
 * - If group is provided, initializes with the group's UniProt IDs
 * 
 * Filter Dependencies:
 * - Compound selection -> Updates organism and UniProt ID options
 * - Organism selection -> Updates UniProt ID options
 * - Both compound and organism changes -> Clears UniProt ID selections
 */
@Component({
  selector: 'app-enzyme-structure-dialog',
  templateUrl: './enzyme-structure-dialog.component.html',
  styleUrls: ['./enzyme-structure-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    MultiSelectModule,
    InputTextModule,
    FilterComponent,
    Molecule3dComponent,
  ],
})
export class EnzymeStructureDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() group: RecommendationResultRowGroup | null = null;
  @Input() dataset: RecommendationResultRow[] = [];

  // Internal filter management
  compoundFilter: SingleSelectFilterConfig;
  organismFilter: MultiselectFilterConfig;
  uniprotIdFilter: MultiselectFilterConfig;

  activeMoleculeId: string | null = null;

  constructor() {
    // Initialize filters with default configurations
    this.compoundFilter = new SingleSelectFilterConfig({
      category: 'parameter',
      label: {
        value: 'Compounds',
        rawValue: 'Compounds',
      },
      placeholder: 'Select compound',
      field: 'compound.name',
      options: [],
      value: null,
    });

    this.organismFilter = new MultiselectFilterConfig({
      category: 'parameter',
      label: {
        value: 'Organisms',
        rawValue: 'Organisms',
      },
      placeholder: 'Select organism',
      field: 'organism',
      options: [],
      value: [],
    });

    this.uniprotIdFilter = new MultiselectFilterConfig({
      category: 'parameter',
      label: {
        value: 'UniProt Accessions',
        rawValue: 'UniProt Accessions',
      },
      placeholder: 'Select UniProt Accession',
      field: 'uniprot_id',
      options: [],
      value: [],
      matchMode: 'union',
    });
  }

  ngOnChanges() {
    // Update filter options whenever dataset changes
    this.updateFilterOptions();

    // If group is provided, initialize filter values
    if (this.group) {
      // Set compound filter value
      if (this.group.compound?.name) {
        this.compoundFilter.value = this.group.compound.name;
      }

      // Set organism filter values
      if (this.group.organism) {
        this.organismFilter.value = [...this.group.organism];
      }

      // Set UniProt ID filter values
      if (this.group.uniprot_id) {
        this.uniprotIdFilter.value = [...this.group.uniprot_id];
      }

      // Update filter options based on group values
      this.updateFilterOptions();
    }
  }

  /**
   * Updates all filter options based on the current dataset
   * - Updates compound options with all unique compound names
   * - Updates organism options with all unique organisms
   * - Updates UniProt ID options with all unique UniProt IDs
   */
  private updateFilterOptions() {
    // Update compound options with all unique compound names from dataset
    const compoundOptions = this.dataset
      .map(record => ({
        label: record.compound.name,
        value: record.compound.name
      }))
      .filter((option, index, self) => 
        index === self.findIndex((o) => o.value === option.value)
      );
    compoundOptions.sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
    this.compoundFilter.options = compoundOptions;

    // Update organism options based on selected compound
    const selectedCompound = this.compoundFilter.value;
    if (selectedCompound) {
      const organismOptions = this.dataset
        .filter(record => record.compound.name === selectedCompound)
        .map(record => ({
          label: record.organism,
          value: record.organism
        }))
        .filter((option, index, self) => 
          index === self.findIndex((o) => o.value === option.value)
        );
      organismOptions.sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
      this.organismFilter.options = organismOptions;
    } else {
      this.organismFilter.options = [];
    }

    // Update UniProt ID options based on selected compound and organisms
    this.updateUniprotIdFilter();
  }

  /**
   * Handles compound filter changes
   * - Clears organism and UniProt ID selections
   * - Updates organism and UniProt ID options
   */
  onCompoundFilterChange() {
    // Clear organism and UniProt ID selections
    this.organismFilter.value = [];
    this.uniprotIdFilter.value = [];
    
    // Update filter options
    this.updateFilterOptions();
  }

  /**
   * Handles organism filter changes
   * - Clears UniProt ID selections
   * - Updates UniProt ID options
   */
  onOrganismFilterChange() {
    // Clear UniProt ID selections
    this.uniprotIdFilter.value = [];
    
    // Update UniProt ID options
    this.updateUniprotIdFilter();
  }

  /**
   * Updates UniProt ID filter based on selected compound and organisms
   * - Filters UniProt IDs to only those associated with selected compound
   * - Further filters by selected organisms if any are selected
   * - Updates UniProt ID options and clears current selection
   */
  private updateUniprotIdFilter() {
    const selectedCompound = this.compoundFilter.value;
    const selectedOrganisms = this.organismFilter.value || [];

    if (!selectedCompound) {
      // If no compound is selected, clear UniProt ID options
      this.uniprotIdFilter.options = [];
      this.uniprotIdFilter.value = [];
      return;
    }

    // Filter UniProt IDs based on selected compounds and organisms
    let filteredRecords = this.dataset.filter(record => 
      record.compound.name === selectedCompound
    );

    if (selectedOrganisms.length > 0) {
      // Further filter by selected organisms
      filteredRecords = filteredRecords.filter(record =>
        selectedOrganisms.includes(record.organism)
      );
    }

    // Get unique UniProt IDs from filtered records
    const uniqueUniprotIds = [...new Set(
      filteredRecords.flatMap(record => record.uniprot_id)
    )];

    // Update UniProt ID options
    this.uniprotIdFilter.options = uniqueUniprotIds.map(id => ({
      label: id,
      value: id
    }));
    this.uniprotIdFilter.options.sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));

    // Update UniProt ID filter to only include valid options
    this.uniprotIdFilter.value = this.uniprotIdFilter.value.filter((id: string) =>
      uniqueUniprotIds.includes(id)
    );
  }

  /**
   * Gets the list of UniProt IDs based on current filter selections
   * - Filters by selected compound
   * - Filters by selected organisms
   * - Filters by selected UniProt IDs
   * @returns Array of UniProt IDs that match all filter criteria
   */
  getUniprotIds(): string[] {
    const selectedCompound = this.compoundFilter.value;
    const selectedOrganisms = this.organismFilter.value || [];
    const selectedUniprotIds = this.uniprotIdFilter.value || [];

    if (!selectedCompound) return [];

    // Filter records by compound
    let filteredRecords = this.dataset.filter(record => 
      record.compound.name === selectedCompound
    );

    // Filter by selected organisms if any
    if (selectedOrganisms.length > 0) {
      filteredRecords = filteredRecords.filter(record =>
        selectedOrganisms.includes(record.organism)
      );
    }

    // Get all UniProt IDs from filtered records
    const allUniprotIds = Array.from(
      new Set(filteredRecords.flatMap(record => record.uniprot_id))
    );

    // Filter by selected UniProt IDs if any
    if (selectedUniprotIds.length > 0) {
      return allUniprotIds.filter(id => selectedUniprotIds.includes(id));
    }

    return allUniprotIds;
  }
}
