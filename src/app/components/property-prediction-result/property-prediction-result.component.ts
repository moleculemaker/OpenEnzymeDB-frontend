import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { JobType } from '~/app/api/mmli-backend/v1';
import { JobResult } from '~/app/models/job-result';
import { OpenEnzymeDBService } from '~/app/services/openenzymedb.service';
import { LoadingComponent } from '~/app/components/loading/loading.component';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';

export type PropertyPredictionJobInfo = {
  substrate: string;
  enzyme: string;
};

@Component({
  selector: 'app-property-prediction-result',
  templateUrl: './property-prediction-result.component.html',
  styleUrls: ['./property-prediction-result.component.scss'],
  standalone: true,
  imports: [
    TableModule,
    PanelModule,
    RouterLink,

    CommonModule,
    LoadingComponent,
  ],
  host: {
    class: 'flex flex-col h-full',
  }
})
export class PropertyPredictionResultComponent extends JobResult<PropertyPredictionJobInfo> {
  override jobId: string = this.route.snapshot.paramMap.get("id") || "example-id";
  override jobType: JobType; //TODO: use the correct job type

  response$ = this.jobResultResponse$;

  columns = [

  ];

  results = [
    {
      "algorithm": "dlkcat",
      "values": {
        "kcat": 0.072
      }
    },
    {
      "algorithm": "unikp",
      "values": {
        "kcat": 0.072,
        "km": 0.694,
        "kcat_km": 0.104
      }
    },
    {
      "algorithm": "catpred",
      "values": {
        "kcat": 0.072,
        "km": 0.694,
        "ki": 0.123
      }
    }
  ]

  data$ = this.service.getData();

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

