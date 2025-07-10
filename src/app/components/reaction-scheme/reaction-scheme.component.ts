import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { filter, Subscription } from 'rxjs';
import { ReactionSchemeRecord } from "~/app/models/ReactionSchemeRecord";
import { MoleculeImageComponent } from '../molecule-image/molecule-image.component';
import { ChemicalResolverService } from '~/app/services/chemical-resolver.service';

@Component({
  selector: 'app-reaction-scheme',
  standalone: true,
  imports: [
    CommonModule,
    MoleculeImageComponent,
  ],
  templateUrl: './reaction-scheme.component.html',
  styleUrl: './reaction-scheme.component.scss'
})
export class ReactionSchemeComponent implements OnChanges, OnDestroy {
  @Input() reactionScheme: ReactionSchemeRecord;
  cleanedReactionScheme: ReactionSchemeRecord;

  images: { [key: string]: string } = {};

  subscriptions: Subscription[] = [];
  
  constructor(public chemicalResolverService: ChemicalResolverService) {

  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reactionScheme']) {
      const reactionScheme = changes['reactionScheme'].currentValue;
      this.cleanedReactionScheme = {
        ...reactionScheme,
        // remove leading digits followed by a space from reactants and products (e.g., "2 H+" becomes "H+")
        reactants: reactionScheme.reactants.map((reactant: string) => reactant.trim().replace(/^\d+\s+/, '')),
        products: reactionScheme.products.map((product: string) => product.trim().replace(/^\d+\s+/, '')),
      };
      [...reactionScheme.reactants, ...reactionScheme.products].forEach((chemical: string) => {
        if (!this.images[chemical]) {
          const subscription = this.chemicalResolverService.getSMILESFromName(chemical)
            .pipe(
              filter((result) => result.status !== 'loading'),
            )
            .subscribe((result) => {
              if (result.status === 'loaded' && result.data) {
                this.images[chemical] = result.data;
              }
            });
          this.subscriptions.push(subscription);
        }
      });
    }
  }
}

