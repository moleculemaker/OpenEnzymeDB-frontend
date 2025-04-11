import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild
} from "@angular/core";
import { ThreedmolLoaderService } from "src/app/services/threedmol-loader.service";
import { combineLatest, BehaviorSubject, Subscription } from "rxjs";
import { filter, first, map } from "rxjs/operators";

export interface ThreeDMolInputOptions {
  data: string;
  dataType: 'uniprot' | 'smi';
  viewerOptions: {
    mode: 'line' | 'stick';
  };
}

interface FetchMoleculeResult {
  model: string;
  dtype: 'sdf' | 'pdb';
  viewerOptions: ThreeDMolInputOptions['viewerOptions'];
}

@Component({
  selector: 'app-molecule3d',
  templateUrl: './molecule3d.component.html',
  styleUrls: ['./molecule3d.component.scss'],
  providers: [ThreedmolLoaderService],
  standalone: true,
  host: {
    class: 'inline-block'
  }
})
export class Molecule3dComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() options: ThreeDMolInputOptions;

  @ViewChild("molContainer", { read: ElementRef })
  container: ElementRef<HTMLDivElement>;

  options$ = new BehaviorSubject<ThreeDMolInputOptions | null>(null);
  subscriptions: Subscription[] = [];


  constructor(
    private $3dMolLoaderService: ThreedmolLoaderService
  ) { }

  ngAfterViewInit(): void {
    const viewer$ = this.$3dMolLoaderService.get3DMol().pipe(
      first(),
      map($3dmol => $3dmol.createViewer(this.container.nativeElement))
    );

    combineLatest([
      viewer$,
      this.options$
    ])
      .pipe(
        filter(([_, options]) => options !== null)
      )
      .subscribe(([viewer, options]) => {
        this.fetchMolecule(viewer, options!).then(result => {
          this.renderMolecule(viewer, result);
        });
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.options$.next(this.options);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  fetchMolecule(viewer: any, options: ThreeDMolInputOptions): Promise<FetchMoleculeResult> {
    
    if (options.dataType === 'uniprot') {
      // For UniProt IDs, fetch the PDB file from AlphaFold
      const url = `https://alphafold.ebi.ac.uk/files/AF-${options.data}-F1-model_v4.pdb`;

      return fetch(url)
        .then(response => response.text())
        .then(data => ({
          model: data,
          dtype: 'pdb',
          viewerOptions: options.viewerOptions
        }));

    } else {
      // For SMILES, first convert to PubChem CID and then fetch the 3D structure
      const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${options.data}/cids/TXT`;

      return fetch(url)
        .then(response => response.text())
        .then(data => {
          const cids = data.split('\n').filter(line => line.trim() !== '');
          if (cids.length > 0) {
            const cid = cids[0];
            return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/record/SDF?record_type=3d`;
          }
          throw new Error(`No CID found for the given SMILES ${options.data}`);
        })
        .then(url => 
          fetch(url)
            .then(response => response.text())
            .then(data => ({
              model: data,
              dtype: 'sdf',
              viewerOptions: options.viewerOptions
            })
          )
        );
    }
  }

  private renderMolecule(
    viewer: any, 
    result: FetchMoleculeResult
  ) {
    viewer.clear();
    viewer.addModel(result.model, result.dtype);

    viewer.setStyle({}, { [result.viewerOptions.mode]: {} });

    // Center and zoom the molecule
    viewer.zoomTo();
    viewer.render();
    viewer.zoom(0.8, 2000);
  }
}