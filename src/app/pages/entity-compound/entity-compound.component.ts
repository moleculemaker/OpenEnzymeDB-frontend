import { ChangeDetectorRef, Component, ViewChild } from "@angular/core";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { CheckboxModule } from "primeng/checkbox";
import { ButtonModule } from "primeng/button";
import { CommonModule } from "@angular/common";

import { OpenEnzymeDBService, type SubstrateRecord } from '~/app/services/openenzymedb.service';
import { PanelModule } from "primeng/panel";
import { combineLatest, combineLatestWith, map, switchMap } from "rxjs/operators";
import { ChipModule } from "primeng/chip";
import { DialogModule } from "primeng/dialog";
import { MultiSelectModule } from "primeng/multiselect";
import { InputTextModule } from "primeng/inputtext";
import { MenuModule } from "primeng/menu";
import { DropdownModule } from "primeng/dropdown";
import { TooltipModule } from "primeng/tooltip";
import { DividerModule } from "primeng/divider";
import { TieredMenuModule } from "primeng/tieredmenu";

import { MultiselectFilterConfig, RangeFilterConfig } from "~/app/models/filters";
import { FilterConfig } from "~/app/models/filters";
import { Molecule3dComponent } from "~/app/components/molecule3d/molecule3d.component";
import { MoleculeImageComponent } from "~/app/components/molecule-image/molecule-image.component";
import { KineticTableComponent } from "~/app/components/kinetic-table/kinetic-table.component";
import { ChemicalPropertyPipe } from '~/app/pipes/chemical-property.pipe';


@Component({
  selector: 'app-entity-compound',
  templateUrl: './entity-compound.component.html',
  styleUrls: ['./entity-compound.component.scss'],
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

    Molecule3dComponent,
    MoleculeImageComponent,
    KineticTableComponent,
    ChemicalPropertyPipe,
  ],
  host: {
    class: "flex flex-col h-full"
  }
})
export class EntityCompoundComponent {
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

  // compound$: Observable<SubstrateRecord> = 
  compound: SubstrateRecord | null = null;

  exportOptions = [
    {
      label: 'Compound Information',
      command: () => {
        // export compound information as json
        const json = JSON.stringify(this.compound, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.compound?.SUBSTRATE}.json`;
        a.click();

        URL.revokeObjectURL(url);
        a.remove();
      },
    },
    {
      label: 'Compound Structure (2D)',
      command: () => {
        this.molecule2d.exportImage('png');
      },
    },
    {
      label: 'Compound Structure (3D)',
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
    ['compound', new MultiselectFilterConfig({
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
    ['uniprot_ids', new MultiselectFilterConfig({
      category: 'parameter',
      label: {
        value: 'Uniprot IDs',
        rawValue: 'Uniprot IDs',
      },
      placeholder: 'Select uniprot ID',
      field: 'uniprot_id',
      options: [],
      value: [],
      matchMode: 'subset',
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
      matchMode: 'subset',
    })],
  ] as [string, FilterConfig][])
 
  constructor(
    public service: OpenEnzymeDBService,
    private route: ActivatedRoute,
  ) {
    const compoundName$ = this.route.params.pipe(map((params) => params['name']));

    compoundName$.pipe(
      switchMap((compoundName) => this.service.getSubstrateInfo(compoundName))
    ).subscribe((compound) => {
      this.compound = compound;
    });

    compoundName$.pipe(
      combineLatestWith(this.service.getData()),
    ).subscribe({
      next: ([compoundName, response]) => {
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
          }))
          .filter((row: any) => row.compound.name === compoundName);  

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
}
