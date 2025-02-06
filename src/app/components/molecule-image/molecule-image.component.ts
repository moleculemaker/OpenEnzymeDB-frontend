import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { SafePipe } from '../../pipes/safe.pipe';
import { Loadable } from '~/app/services/openenzymedb.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
    selector: 'app-molecule-image',
    templateUrl: './molecule-image.component.html',
    styleUrls: ['./molecule-image.component.scss'],
    standalone: true,
    imports: [SafePipe, ProgressSpinnerModule],
    host: {
        class: 'flex items-center justify-center'
    }
})
export class MoleculeImageComponent implements OnInit, OnChanges {
  @Input() loadableImage: Loadable<string>;
  @Input() width: string = '300px';
  @Input() height: string = '150px';

  image = ''
  placeholderClassName = ''

  ngOnInit(): void {
    this.init();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['loadableImage']) {
      this.init();
    }
  }

  init() {
    const element = document.createElement('div');
    element.innerHTML = this.loadableImage.data ?? '';
    element.querySelector('svg')?.setAttribute('width', this.width);
    element.querySelector('svg')?.setAttribute('height', this.height);
    element.querySelector('svg rect')?.setAttribute('style', 'opacity:1.0;fill:#FFFFFF00;stroke:none');

    this.image = element.innerHTML;
    this.placeholderClassName = `w-[${this.width}] h-[${this.height}]`
  }
}
