import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { SafePipe } from '../../pipes/safe.pipe';
import { OpenEnzymeDBService } from '~/app/services/openenzymedb.service';
import { of, map } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
  @Input() loadableImage: Loadable<string> = {
    data: '',
    status: 'na'
  };
  @Input() width: number;
  @Input() height: number;
  @Input() smiles: string = '';

  placeholderClassName = ''
  chemical: Loadable<string> = {
    data: '',
    status: 'na'
  }

  getSVG = (smiles: string) => {
    this.service.validateChemical(smiles)
      .pipe(
        catchError((err) => 
          of({
            data: '',
            status: 'invalid' as const
          } as Loadable<string>)
        )
      )
      .subscribe((chemical) => {
        this.chemical = chemical;
        this.init(chemical);
      });
  }

  constructor(
    private service: OpenEnzymeDBService
  ) {}

  ngOnInit(): void {
    if (this.loadableImage && this.loadableImage.data) {
      this.init(this.loadableImage);

    } else if (this.smiles) {
      this.getSVG(this.smiles);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['loadableImage'] && changes['loadableImage'].currentValue) {
      this.init(changes['loadableImage'].currentValue);

    } else if (changes['smiles'] 
      && changes['smiles'].currentValue
      && changes['smiles'].currentValue !== changes['smiles'].previousValue) {
      this.getSVG(this.smiles);

    } else if (changes['width'] || changes['height']) {
      this.init(this.chemical);
    }
  }

  init(data: Loadable<string>) {
    if (data.status !== 'loaded') {
      return;
    }

    const element = document.createElement('div');
    element.innerHTML = data.data || '';
    
    console.log(element.querySelector('svg'));

    element.querySelector('svg')?.setAttribute('width', `${this.width}px`);
    element.querySelector('svg')?.setAttribute('height', `${this.height}px`);
    element.querySelector('svg rect')?.setAttribute('style', 'opacity:1.0;fill:#FFFFFF00;stroke:none');

    this.chemical = {
      ...data,
      data: element.innerHTML
    }
    this.placeholderClassName = `w-[${this.width}px] h-[${this.height}px]`
  }

  exportImage(type: 'svg' | 'png') {
    const filename = this.smiles || 'molecule';
    if (type === 'svg') {
      const blob = new Blob([this.chemical.data!], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.svg`;
      a.click();

      URL.revokeObjectURL(url);
      a.remove();
    } else {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      const svg = new Blob([this.chemical.data!], {type: 'image/svg+xml;charset=utf-8'});
      const url = URL.createObjectURL(svg);

      canvas.height = this.height;
      canvas.width = this.width;

      img.src = url;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = canvas.toDataURL();
        link.click();

        link.remove();
        canvas.remove();
      }
    }
  }
}
