import { Component } from '@angular/core';
import { Molecule3dComponent } from '~/app/components/molecule3d/molecule3d.component';

@Component({
  selector: 'app-font-match',
  templateUrl: './font-match.component.html',
  styleUrls: ['./font-match.component.scss'],
  standalone: true,
  imports: [Molecule3dComponent]
})
export class FontMatchComponent {
  examplePDB = ``
}
