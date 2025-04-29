import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

import { JobType } from '~/app/api/mmli-backend/v1';
import { JobResult } from '~/app/models/job-result';
import { OpenEnzymeDBService } from '~/app/services/open-enzyme-db.service';
import { LoadingComponent } from '~/app/components/loading/loading.component';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { SafePipe } from '~/app/pipes/safe.pipe';

@Component({
  selector: 'app-enzyme-recommendation-result',
  templateUrl: './enzyme-recommendation-result.component.html',
  styleUrls: ['./enzyme-recommendation-result.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    PanelModule,
    TableModule,
    
    LoadingComponent,
    SafePipe
  ],
  host: {
    class: 'flex flex-col h-full',
  }
})
export class EnzymeRecommendationResultComponent extends JobResult {
  override jobId: string = this.route.snapshot.paramMap.get("id") || "example-id";
  override jobType: JobType; //TODO: use the correct job type
  
  response$ = this.jobResultResponse$;

  results = [
    { 
      model: 'Maximum Common Substructure (MCS)', 
      algorithm: 'mcs',
      description: {
        html: '<span class="italic">MCS identifies the largest shared substructure between two molecules, highlighting core structural similarities that may influence enzyme compatibility, where a higher <span class="p-1 text-white font-semibold rounded-sm bg-[#726EDE]">MCS Score</span> indicates greater similarity.</span>'
      },
      topSubstratesMatches: [],
    },
    { 
      model: 'Tanimoto Similarity', 
      algorithm: 'tanimoto',
      description: {
        html: ''
      }, 
      topSubstratesMatches: [],
    },
    { 
      model: 'Fragment Algorithm', 
      algorithm: 'fragment',
      description: {
        html: ''
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
