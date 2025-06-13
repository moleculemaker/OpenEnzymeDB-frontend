import { Component, ViewChild } from "@angular/core";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { CheckboxModule } from "primeng/checkbox";
import { ButtonModule } from "primeng/button";
import { CommonModule } from "@angular/common";

import { ECRecord, OpenEnzymeDBService } from '~/app/services/openenzymedb.service';
import { ReactionSchemeRecordWithKeyInfo } from "~/app/models/ReactionSchemeRecord";
import { PanelModule } from "primeng/panel";
import { TableModule } from "primeng/table";
import { combineLatestWith, map, switchMap } from "rxjs/operators";
import { ChipModule } from "primeng/chip";
import { DialogModule } from "primeng/dialog";
import { MultiSelectModule } from "primeng/multiselect";
import { InputTextModule } from "primeng/inputtext";
import { MenuModule } from "primeng/menu";
import { trigger } from "@angular/animations";
import { animate } from "@angular/animations";
import { style, transition } from "@angular/animations";
import { DropdownModule } from "primeng/dropdown";
import { TooltipModule } from "primeng/tooltip";
import { DividerModule } from "primeng/divider";
import { TieredMenuModule } from "primeng/tieredmenu";

import { MultiselectFilterConfig, RangeFilterConfig } from "~/app/models/filters";
import { FilterConfig } from "~/app/models/filters";
import { ExternalLinkComponent } from "~/app/components/external-link/external-link.component";
import { Molecule3dComponent } from "~/app/components/molecule3d/molecule3d.component";
import { KineticTableComponent } from "~/app/components/kinetic-table/kinetic-table.component";
import { ReactionSchemeComponent } from "~/app/components/reaction-scheme/reaction-scheme.component";
import { ScrollPanelModule } from "primeng/scrollpanel";


@Component({
  selector: 'app-entity-ecnumber',
  templateUrl: './entity-ecnumber.component.html',
  styleUrls: ['./entity-ecnumber.component.scss'],
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
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CheckboxModule,
    ButtonModule,
    PanelModule,
    TableModule,
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
    ScrollPanelModule,
    
    Molecule3dComponent,
    KineticTableComponent,
    ExternalLinkComponent,
    ReactionSchemeComponent,
],
  host: {
    class: "flex flex-col h-full"
  }
})
export class EntityECNumberComponent {
  @ViewChild(KineticTableComponent) kineticTable!: KineticTableComponent;
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

  ec: ECRecord | null = null;
  reactionScheme: ReactionSchemeRecordWithKeyInfo | null = null;

  exportOptions = [
    {
      label: 'EC Number Information (JSON)',
      command: () => {
        // export compound information as json
        const json = JSON.stringify(this.ec, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.ec?.entry.replace('.', '_')}.json`;
        a.click();

        URL.revokeObjectURL(url);
        a.remove();
      },
    },
    {
      label: 'Reaction Scheme',
      command: () => {
        // TODO: export reaction scheme
        // this.molecule2d.exportImage('png');
      },
    },
    {
      label: 'Representative Structure',
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

  showFilter = false;
  hasFilter = false;
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
        value: 'Temperature (°C)',
        rawValue: 'Temperature (°C)',
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

  columns: any[] = [];

  readonly filterRecordsByCategory = Object.entries(this.filters)
    .reduce((acc, [key, filter]) => {
      if (!acc[filter.category]) {
        acc[filter.category] = [filter];
      } else {
        acc[filter.category].push(filter);
      }
      return acc;
    }, {} as Record<string, FilterConfig[]>);

  readonly filterRecords = Object.values(this.filters);
 
  constructor(
    public service: OpenEnzymeDBService,
    private route: ActivatedRoute,
  ) {
    const ecNumber$ = this.route.params.pipe(map((params) => params['ec']));

    ecNumber$.pipe(
      switchMap((ecNumber) => this.service.getECInfo(ecNumber))
    ).subscribe((ec) => {
      this.ec = ec;
    });

    ecNumber$.pipe(
      switchMap((ecNumber) => this.service.getSingleReactionSchemeByEC(ecNumber))
    ).subscribe({
      next: (scheme) => {
        this.reactionScheme = scheme;
      },
      error: (error) => {
        console.error('Error fetching reaction scheme:', error);
        this.reactionScheme = null;
      }
    });

    ecNumber$.pipe(
      combineLatestWith(this.service.getData()),
    ).subscribe({
      next: ([ecNumber, response]) => {
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
          .filter((row: any) => row.ec_number === ecNumber);  

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
