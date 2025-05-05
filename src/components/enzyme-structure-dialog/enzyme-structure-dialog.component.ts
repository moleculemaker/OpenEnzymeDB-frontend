import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { Molecule3dComponent } from '~/app/components/molecule3d/molecule3d.component';
import { MultiselectFilterConfig } from '~/app/models/filters';
import { FilterComponent } from '~/app/components/filter/filter.component';
import { OpenEnzymeDBService } from '~/app/services/openenzymedb.service';

@Component({
  selector: 'app-enzyme-structure-dialog',
  standalone: true,
  imports: [
    DialogModule,
    DropdownModule,
    FormsModule,

    FilterComponent,
    Molecule3dComponent,
  ],
  templateUrl: './enzyme-structure-dialog.component.html',
  styleUrl: './enzyme-structure-dialog.component.scss'
})
export class EnzymeStructureDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() compoundFilter: MultiselectFilterConfig;
  @Input() organismFilter: MultiselectFilterConfig;
  @Input() uniprotIdFilter: MultiselectFilterConfig;
  @Output() visibleChange = new EventEmitter<boolean>();

  uniprotIds: string[] = [];

  constructor(
    private service: OpenEnzymeDBService,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    // if (changes['compoundFilter']) {
  }

  getUniprotIds(compounds: string[], organisms: string[], uniprotIds: string[]) {
    // this.service.getEnzymeStructure(compounds, organisms, uniprotIds).subscribe((data) => {
    //   this.uniprotIds = data;
    // });
  }
}
