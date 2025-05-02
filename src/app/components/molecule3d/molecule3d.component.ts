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
import { combineLatest, BehaviorSubject, Subscription, Observable } from "rxjs";
import { combineLatestWith, distinctUntilChanged, filter, first, map, mergeMap, switchMap } from "rxjs/operators";
import { PubchemService } from "~/app/services/pubchem.service";
import { AlphafoldService } from "~/app/services/alphafold.service";

export interface ThreeDMolInputOptions {
  data: string;
  dataType: 'uniprot' | 'smi';
  viewerOptions: {
    mode: 'line' | 'stick' | 'cartoon';
    modeConfig?: any,
  };
}

interface FetchMoleculeResult {
  model: string;
  dtype: 'sdf' | 'pdb';
}

interface FetchMoleculeResultWithViewerOptions extends FetchMoleculeResult {
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

  moleculeToRender: FetchMoleculeResultWithViewerOptions | null = null;

  constructor(
    private $3dMolLoaderService: ThreedmolLoaderService,
    private pubchemService: PubchemService,
    private alphafoldService: AlphafoldService
  ) { }

  ngAfterViewInit(): void {
    const viewer$ = this.$3dMolLoaderService.get3DMol().pipe(
      first(),
      map($3dmol => $3dmol.createViewer(this.container.nativeElement))
    );

    this.subscriptions.push(
      viewer$.pipe(
        combineLatestWith(this.options$.pipe(
          filter((options) => options !== null),
          distinctUntilChanged()
        )),
        switchMap(([viewer, options]) => {
          return this.fetchMolecule$(options!).pipe(
            map(result => ({
              viewer,
              result: {
                ...result,
                viewerOptions: options!.viewerOptions
              }
            }))
          );
        })
      ).subscribe(({viewer, result}) => {
        this.moleculeToRender = result;
        this.renderMolecule(viewer, result);
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.options$.next(this.options);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  export(type: 'structure' | 'image') {
    switch (type) {
      case 'image':
        const viewer = this.$3dMolLoaderService.get3DMol().pipe(
            first(),
            map($3dmol => $3dmol.createViewer(this.container.nativeElement))
        );

        this.subscriptions.push(
          viewer.subscribe((viewer: any) => {
            viewer.exportImage('png');
          })
        );
        break;

      case 'structure':
        if (this.moleculeToRender) {
          const blob = new Blob([this.moleculeToRender.model], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const fileType = this.moleculeToRender.dtype;
          a.href = url;
          a.download = `${this.options.dataType}-${this.options.data}.${fileType}`;
          a.click();
          
          URL.revokeObjectURL(url);
          a.remove();
        }
        break;
    }
  }

  fetchMolecule$(options: ThreeDMolInputOptions): Observable<FetchMoleculeResult> {
    const dataType = options.dataType === 'uniprot' ? 'pdb' : 'sdf';
    const fetcher$ = options.dataType === 'uniprot' 
      ? this.alphafoldService.get3DProtein(options.data)
      : this.pubchemService.get3DStructureFromSMILES(options.data);

    return fetcher$.pipe(
      map(data => ({
        model: `${data}`,
        dtype: dataType,
      }))
    );
  }

  private renderMolecule(
    viewer: any, 
    result: FetchMoleculeResultWithViewerOptions
  ) {
    viewer.clear();
    viewer.addModel(result.model, result.dtype);

    viewer.setStyle({}, { 
      [result.viewerOptions.mode]: {
        ...(result.viewerOptions.modeConfig ?? {})
      }
    });

    // Center and zoom the molecule
    viewer.zoomTo();
    viewer.render();
    viewer.zoom(0.8, 2000);
  }
}