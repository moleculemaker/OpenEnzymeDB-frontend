import { NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataSnapshotComponent } from "../components/data-snapshot/data-snapshot.component";
import { TutorialComponent } from "../components/tutorial/tutorial.component";

enum ActiveAboutPanel {
  ABOUT,
  TUTORIAL,
  STATISTICS,
  API,
  GITHUB,
  PUBLICATIONS,
  TEAM,
  GET_INVOLVED,
}

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [NgIf, DataSnapshotComponent, RouterLink, TutorialComponent],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.scss'
})
export class AboutPageComponent {
  readonly ActiveAboutPanel = ActiveAboutPanel;

  activePanel = ActiveAboutPanel.ABOUT;
  private activatedRoute = inject(ActivatedRoute);

  constructor() {
    this.activatedRoute.params.subscribe((params) => {
      if (params['section'] && ActiveAboutPanel[params['section'].toUpperCase()]) {
        this.activePanel = ActiveAboutPanel[params['section'].toUpperCase()] as any as ActiveAboutPanel;
      } else {
        this.activePanel = ActiveAboutPanel.ABOUT;
      }
    });
  }
}
