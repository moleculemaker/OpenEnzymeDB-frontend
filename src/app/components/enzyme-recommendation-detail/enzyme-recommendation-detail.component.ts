import { ChangeDetectorRef, Component, ViewChild } from "@angular/core";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { CheckboxModule } from "primeng/checkbox";
import { ButtonModule } from "primeng/button";
import { CommonModule } from "@angular/common";

import { OpenEnzymeDBService, type SubstrateRecord } from '~/app/services/open-enzyme-db.service';
import { PanelModule } from "primeng/panel";
import { map } from "rxjs/operators";
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
import { JobResult } from "~/app/models/job-result";
import { JobType } from "~/app/api/mmli-backend/v1";


@Component({
  selector: 'app-enzyme-recommendation-detail',
  templateUrl: './enzyme-recommendation-detail.component.html',
  styleUrls: ['./enzyme-recommendation-detail.component.scss'],
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

    MoleculeImageComponent,
    KineticTableComponent,
    ChemicalPropertyPipe,
],
  host: {
    class: "flex flex-col h-full"
  }
})
export class EnzymeRecommendationDetailComponent extends JobResult {
  override jobId: string = this.route.snapshot.paramMap.get("id") || "example-id";
  override jobType: JobType = JobType.OedCheminfo;
  algorithm: 'mcs' | 'fragment' | 'tanimoto' = this.route.snapshot.paramMap.get("algorithm") as 'mcs' | 'fragment' | 'tanimoto';

  @ViewChild(KineticTableComponent) kineticTable!: KineticTableComponent;
  @ViewChild(MoleculeImageComponent) molecule2d!: MoleculeImageComponent;
  @ViewChild(Molecule3dComponent) molecule3d!: Molecule3dComponent;

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
      label: 'Table Results',
      command: () => {
        this.kineticTable.export();
      },
    },
  ];

  filters: Record<string, FilterConfig> = {
    compounds: new MultiselectFilterConfig({
      category: 'parameter',
      disabled: true,
      label: {
        value: 'Compounds',
        rawValue: 'Compounds',
      },
      placeholder: 'Select compound',
      field: 'compound.name',
      options: [],
      value: [],
    }),
    organism: new MultiselectFilterConfig({
      category: 'parameter',
      label: {
        value: 'Organisms',
        rawValue: 'Organisms',
      },
      placeholder: 'Select organism',
      field: 'organism',
      options: [],
      value: [],
    }),
    uniprot_ids: new MultiselectFilterConfig({
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
    }),
    ec_numbers: new MultiselectFilterConfig({
      category: 'parameter',
      label: {
        value: 'EC Numbers',
        rawValue: 'EC Numbers',
      },
      placeholder: 'Select EC number',
      field: 'ec_number',
      options: [],
      value: [],
    }),
    enzyme_types: new MultiselectFilterConfig({
      category: 'parameter',
      label: {
        value: 'Enzyme Types',
        rawValue: 'Enzyme Types',
      },
      placeholder: 'Select enzyme type',
      field: 'enzyme_type',
      options: [],
      value: [],
    }),
    ph: new RangeFilterConfig({
      category: 'parameter',
      label: {
        value: 'pH',
        rawValue: 'pH',
      },
      placeholder: 'Enter pH range',
      field: 'ph',
      min: 0,
      max: 14,
    }),
    temperature: new RangeFilterConfig({
      category: 'parameter',
      label: {
        value: 'Temperature (°C)',
        rawValue: 'Temperature (°C)',
      },
      placeholder: 'Enter temperature range',
      field: 'temperature',
      min: 0,
      max: 100,
    }),
    kcat: new RangeFilterConfig({
      category: 'enzyme',
      label: {
        value: '<span class="italic">k</span><sub>cat</sub> (s<sup class="text-xs"> -1</sup>)',
        rawValue: 'kcat',
      },
      placeholder: 'Enter kcat range',
      field: 'kcat',
      min: 0,
      max: 100
    }),
    km: new RangeFilterConfig({
      category: 'enzyme',
      label: {
        value: '<span class="italic">K</span><sub>m</sub> (mM)',
        rawValue: 'km',
      },
      placeholder: 'Enter KM range',
      field: 'km',
      min: 0,
      max: 100
    }),
    kcat_km: new RangeFilterConfig({
      category: 'enzyme',
      label: {
        value: '<span class="italic">k</span><sub>cat</sub>/<span class="italic">K</span><sub>m</sub> (mM<sup class="text-xs"> -1</sup>s<sup class="text-xs"> -1</sup>)',
        rawValue: 'kcat_km',
      },
      placeholder: 'Enter kcat/KM range',
      field: 'kcat_km',
      min: 0,
      max: 100
    }),
    pubmed_id: new MultiselectFilterConfig({
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
    }),
  }
 
  constructor(
    service: OpenEnzymeDBService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
  ) {
    super(service);

    this.service.getData()
      .pipe(
        map((response: any) => 
          response
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
            .filter((row: any) => !!row.kcat && !!row.kcat_km)
        )
      )
      .subscribe({
        next: (response: any) => {
          this.result = {
            status: 'loaded',
            data: response,
            total: response.length,
          };
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error(err);
          this.result = {
            status: 'error',
            data: [],
            total: 0,
          };
        }
      });
  }

  backToSearch() {
    history.back();
  }

  copyAndPasteURL(): void {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = window.location.href;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
  }
}
