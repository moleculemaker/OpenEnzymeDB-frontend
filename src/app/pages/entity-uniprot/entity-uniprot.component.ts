import { ChangeDetectorRef, Component, ViewChild } from "@angular/core";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { CheckboxModule } from "primeng/checkbox";
import { ButtonModule } from "primeng/button";
import { CommonModule } from "@angular/common";

import { OpenEnzymeDBService, UniprotRecord } from '~/app/services/openenzymedb.service';
import { PanelModule } from "primeng/panel";
import { combineLatestWith, map, switchMap } from "rxjs/operators";
import { ChipModule } from "primeng/chip";
import { DialogModule } from "primeng/dialog";
import { MultiSelectModule } from "primeng/multiselect";
import { InputTextModule } from "primeng/inputtext";
import { MenuModule } from "primeng/menu";
import { DropdownModule } from "primeng/dropdown";
import { TooltipModule } from "primeng/tooltip";
import { DividerModule } from "primeng/divider";
import { TieredMenuModule } from "primeng/tieredmenu";
import { MessageService } from "primeng/api";
import { ToastModule } from "primeng/toast";

import { MultiselectFilterConfig, RangeFilterConfig } from "~/app/models/filters";
import { FilterConfig } from "~/app/models/filters";
import { Molecule3dComponent } from "~/app/components/molecule3d/molecule3d.component";
import { MoleculeImageComponent } from "~/app/components/molecule-image/molecule-image.component";
import { KineticTableComponent } from "~/app/components/kinetic-table/kinetic-table.component";
import { ExternalLinkComponent } from "~/app/components/external-link/external-link.component";

@Component({
  selector: 'app-entity-uniprot',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CheckboxModule,
    ButtonModule,
    PanelModule,
    MultiSelectModule,
    ChipModule,
    DialogModule,
    InputTextModule,
    MenuModule,
    DropdownModule,
    TooltipModule,
    DividerModule,
    TieredMenuModule,
    DividerModule,
    ToastModule,

    Molecule3dComponent,
    KineticTableComponent,
    ExternalLinkComponent,
  ],
  providers: [MessageService],
  templateUrl: './entity-uniprot.component.html',
  styleUrl: './entity-uniprot.component.scss'
})
export class EntityUniprotComponent {
  @ViewChild(KineticTableComponent) kineticTable!: KineticTableComponent;
  @ViewChild(MoleculeImageComponent) molecule2d!: MoleculeImageComponent;
  @ViewChild(Molecule3dComponent) molecule3d!: Molecule3dComponent;

  logicalOperators = [
    { label: 'AND', value: 'AND' },
    { label: 'OR', value: 'OR' },
    { label: 'NOT', value: 'NOT' }
  ];

  result: {
    status: 'loading' | 'loaded' | 'error' | 'na';
    data: any[];
    total: number;
  } = {
    status: 'na',
    data: [],
    total: 0,
  };

  uniprot: UniprotRecord | null = null;
  
  exportOptions = [
    {
      label: 'UniProt Information',
      command: () => {
        // export compound information as json
        const json = JSON.stringify(this.uniprot, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.uniprot?.primaryAccession}.json`;
        a.click();

        URL.revokeObjectURL(url);
        a.remove();
      },
    },
    {
      label: 'UniProt Structure',
      command: () => {
        this.molecule3d.export('structure');
      },
    },
    {
      label: 'Table Results',
      command: () => {
        this.kineticTable.export();
      },
    },
  ];

  filters: Map<string, FilterConfig> = new Map([
    ['compounds', new MultiselectFilterConfig({
      category: 'parameter',
      label: {
        value: 'Compounds',
        rawValue: 'Compounds',
      },
      placeholder: 'Select compound',
      field: 'compound.name',
      options: [],
      value: [],
    })],
    ['organism', new MultiselectFilterConfig({
      category: 'parameter',
      label: {
        value: 'Organisms',
        rawValue: 'Organisms',
      },
      placeholder: 'Select organism',
      field: 'organism',
      options: [],
      value: [],
    })],
    ['enzyme_name', new MultiselectFilterConfig({
      category: 'parameter',
      label: {
        value: 'Enzyme Names',
        rawValue: 'Enzyme Names',
      },
      placeholder: 'Select Enzyme Names',
      field: 'enzyme_name',
      options: [],
      value: [],
      matchMode: 'union',
      suppressColumnInResultsTable: true
    })],
    ['uniprot_ids', new MultiselectFilterConfig({
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
    })],
    ['ec_numbers', new MultiselectFilterConfig({
      category: 'parameter',
      label: {
        value: 'EC Numbers',
        rawValue: 'EC Numbers',
      },
      placeholder: 'Select EC number',
      field: 'ec_number',
      options: [],
      value: [],
    })],
    ['enzyme_types', new MultiselectFilterConfig({
      category: 'parameter',
      label: {
        value: 'Enzyme Types',
        rawValue: 'Enzyme Types',
      },
      placeholder: 'Select enzyme type',
      field: 'enzyme_type',
      options: [],
      value: [],
    })],
    ['ph', new RangeFilterConfig({
      category: 'parameter',
      label: {
        value: 'pH',
        rawValue: 'pH',
      },
      placeholder: 'Enter pH range',
      field: 'ph',
      min: 0,
      max: 14,
    })],
    ['temperature', new RangeFilterConfig({
      category: 'parameter',
      label: {
        value: 'Temp (°C)',
        rawValue: 'Temp (°C)',
      },
      placeholder: 'Enter temperature range',
      field: 'temperature',
      min: 0,
      max: 100,
    })],
    ['kcat', new RangeFilterConfig({
      category: 'enzyme',
      label: {
        value: '<span class="italic">k</span><sub class="text-xs">cat</sub> (s<sup class="text-xs"> -1</sup>)',
        rawValue: 'kcat',
      },
      placeholder: 'Enter kcat range',
      field: 'kcat',
      min: 0,
      max: 100
    })],
    ['km', new RangeFilterConfig({
      category: 'enzyme',
      label: {
        value: '<span class="italic">K</span><sub class="text-xs">m</sub> (mM)',
        rawValue: 'km',
      },
      placeholder: 'Enter KM range',
      field: 'km',
      min: 0,
      max: 100
    })],
    ['kcat_km', new RangeFilterConfig({
      category: 'enzyme',
      label: {
        value: '<span class="italic">k</span><sub class="text-xs">cat</sub>/<span class="italic">K</span><sub class="text-xs">m</sub> (mM<sup class="text-xs"> -1</sup>s<sup class="text-xs"> -1</sup>)',
        rawValue: 'kcat_km',
      },
      placeholder: 'Enter kcat/KM range',
      field: 'kcat_km',
      min: 0,
      max: 100
    })],
    ['pubmed_id', new MultiselectFilterConfig({
      category: 'literature',
      label: {
        value: 'PubMed',
        rawValue: 'PubMed',
      },
      placeholder: 'Select PubMed ID',
      field: 'pubmed_id',
      options: [],
      value: [],
      matchMode: 'in',
    })],
  ] as [string, FilterConfig][])
 
  constructor(
    public service: OpenEnzymeDBService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private messageService: MessageService,
  ) {
    const uniprotId$ = this.route.params.pipe(map((params) => params['id']));

    uniprotId$.pipe(
      switchMap((uniprotId) => this.service.getUniprotInfo(uniprotId))
    ).subscribe((uniprot) => {
      this.uniprot = uniprot;
    });

    uniprotId$.pipe(
      combineLatestWith(this.service.getDataWithBestEnzymeNames()),
    ).subscribe({
      next: ([uniprotId, response]) => {
        const results = response
          .map((row: any, index: number) => ({
            iid: index,
            ec_number: row.EC,
            compound: {
              name: row.SUBSTRATE,
              smiles: row.SMILES,
            },
            enzyme_type: row.EnzymeType,
            organism: row.ORGANISM,
            uniprot_id: row.UNIPROT.split(','),
            ph: row.PH,
            temperature: row.Temperature,
            kcat: row['KCAT VALUE'],
            km: row['KM VALUE'],
            kcat_km: row['KCAT/KM VALUE'],
            pubmed_id: `${row.PubMedID}`,
            enzyme_name: row.bestEnzymeNames
          }))
          .filter((row: any) => row.uniprot_id.includes(uniprotId));  

        this.result = {
          status: 'loaded',
          data: results,
          total: results.length,
        };
      },
      error: (err: any) => {
        console.error(err);
        this.result = {
          status: 'error',
          data: [],
          total: 0,
        };
      },
    });
  }

  backToSearch() {
    history.back();
  }

  copySequence() {
    const sequence = this.uniprot?.sequence?.value;
    if (sequence) {
      navigator.clipboard.writeText(sequence);
    }
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Sequence copied to clipboard',
    });
  }
}
