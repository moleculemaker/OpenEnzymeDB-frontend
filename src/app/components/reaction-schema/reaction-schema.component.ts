import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { Loadable, OpenEnzymeDBService, ReactionSchemaRecord } from '~/app/services/openenzymedb.service';
import { MoleculeImageComponent } from '../molecule-image/molecule-image.component';

@Component({
  selector: 'app-reaction-schema',
  standalone: true,
  imports: [
    CommonModule,
    MoleculeImageComponent,
  ],
  templateUrl: './reaction-schema.component.html',
  styleUrl: './reaction-schema.component.scss'
})
export class ReactionSchemaComponent implements OnChanges, OnDestroy {
  @Input() reactionSchema: ReactionSchemaRecord;

  images: { [key: string]: Loadable<string> } = {};

  subscriptions: Subscription[] = [];
  
  constructor(public service: OpenEnzymeDBService) {

  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reactionSchema']) {
      const reactionSchema = changes['reactionSchema'].currentValue;
      [...reactionSchema.reactants, ...reactionSchema.products].forEach((chemical: string) => {
        if (!this.images[chemical]) {
          const subscription = this.service.getChemicalImageFromName(chemical, 300, 300)
            .subscribe((result) => {
              this.images[chemical] = result;
            });
          this.subscriptions.push(subscription);
        }
      });
    }
  }
}

