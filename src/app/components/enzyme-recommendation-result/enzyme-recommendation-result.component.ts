import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

import { JobType } from '~/app/api/mmli-backend/v1';
import { JobResult } from '~/app/models/job-result';
import { OpenEnzymeDBService, RecommendationResult } from '~/app/services/openenzymedb.service';
import { LoadingComponent } from '~/app/components/loading/loading.component';
import { SafePipe } from '~/app/pipes/safe.pipe';
import { MoleculeImageComponent } from '../molecule-image/molecule-image.component';
import { ChemicalPropertyPipe } from '~/app/pipes/chemical-property.pipe';
import { JobTabComponent } from '../job-tab/job-tab.component';
import { EnzymeRecommendationComponent } from '../enzyme-recommendation/enzyme-recommendation.component';
import { QueryValue } from '~/app/models/search-options';

export type EnzymeRecommendationJobInfo = {
  query_smiles: string;
  query_value: QueryValue;
  email: string;
}

@Component({
  selector: 'app-enzyme-recommendation-result',
  templateUrl: './enzyme-recommendation-result.component.html',
  styleUrls: ['./enzyme-recommendation-result.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    PanelModule,
    TableModule,
    RouterLink,
    TooltipModule,
    
    LoadingComponent,
    MoleculeImageComponent,
    JobTabComponent,
    ChemicalPropertyPipe,
    EnzymeRecommendationComponent,
    SafePipe,
  ],
  host: {
    class: 'flex flex-col h-full',
  }
})
export class EnzymeRecommendationResultComponent extends JobResult<EnzymeRecommendationJobInfo, RecommendationResult> {
  override jobId: string = this.route.snapshot.paramMap.get("id") || "example-id";
  override jobType: JobType = JobType.OedCheminfo;

  currentPage = 'result';
  response$ = this.jobResultResponse$;

  substrate: RecommendationResult['query_smiles'];

  results: Array<{
    model: string,
    algorithm: 'mcs' | 'tanimoto' | 'fragment',
    description: {
      html: string,
    },
    topSubstratesMatches: [string, any][],
  }> = [
    { 
      model: 'Maximum Common Substructure (MCS)', 
      algorithm: 'mcs',
      description: {
        html: '<span class="italic leading-xl">MCS identifies the largest shared substructure between two molecules, highlighting core structural similarities that may influence enzyme compatibility, where a higher <span class="p-1 text-white font-semibold rounded-md bg-[#726EDE]">MCS Score</span> indicates greater similarity.</span>'
      },
      topSubstratesMatches: [],
    },
    { 
      model: 'Tanimoto Similarity', 
      algorithm: 'tanimoto',
      description: {
        html: '<span class="italic leading-xl">Tanimoto Similarity calculates similarity based on molecular fingerprints, quantifying how much two molecules share in common relative to their overall structure, where a higher <span class="p-1 text-black font-semibold rounded-md bg-[#B2FDEF]">Tanimoto Score</span> indicates greater similarity.</span>'
      }, 
      topSubstratesMatches: [],
    },
    { 
      model: 'Fragment Algorithm', 
      algorithm: 'fragment',
      description: {
        html: '<span class="italic leading-xl">Fragment Algorithm compares molecules by breaking them into smaller chemical fragments and assessing overlap, capturing similarities in localized functional groups or motifs, where larger fragment sizes indicate greater similarity.</span>'
      }, 
      topSubstratesMatches: [],
    }
  ]

  columns = [

  ];

  constructor(
    service: OpenEnzymeDBService,
    private route: ActivatedRoute,
  ) {
    super(service);

    this.response$.subscribe((resp: RecommendationResult) => {
      this.substrate = resp.query_smiles;
      this.results.forEach((resultObj) => {
        const algorithm = resultObj['algorithm'];
        const results = resp[algorithm];
        let topSubstrates = [];
        if (algorithm === 'fragment') {
          // find top 3 substrates with the most fragment matches
          topSubstrates = Object.entries(results)
            .sort((a, b) => b[1].matches.length - a[1].matches.length)
            .slice(0, 3)
            .map(([smiles, values]) => [smiles, { 
              matches: values.matches.flat(),
              numSubstructureMatches: values.matches.length,
              numAtomMatches: (new Set(values.matches.flat())).size,
            }]) as [string, any][];
        }

        else if (algorithm === 'mcs') {
          topSubstrates = Object.entries(results).sort((a, b) => b[1].value - a[1].value).slice(0, 3);
        }

        else {
          // find top 3 substrates with the highest score
          topSubstrates = Object.entries(results).sort((a, b) => b[1] - a[1]).slice(0, 3);
        }

        resultObj['topSubstratesMatches'] = topSubstrates;
      })
    });
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
