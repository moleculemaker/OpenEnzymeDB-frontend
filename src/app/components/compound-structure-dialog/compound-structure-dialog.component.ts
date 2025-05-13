import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { MoleculeImageComponent } from '~/app/components/molecule-image/molecule-image.component';
import { Molecule3dComponent } from '~/app/components/molecule3d/molecule3d.component';

@Component({
  selector: 'app-compound-structure-dialog',
  standalone: true,
  imports: [
    DialogModule,

    MoleculeImageComponent,
    Molecule3dComponent,
  ],
  templateUrl: './compound-structure-dialog.component.html',
  styleUrl: './compound-structure-dialog.component.scss'
})
export class CompoundStructureDialogComponent {
  @Input() visible = false;
  @Input() smiles = '';
  @Output() visibleChange = new EventEmitter<boolean>();
}
