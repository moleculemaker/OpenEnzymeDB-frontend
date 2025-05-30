import { ChangeDetectorRef, Component, computed, ElementRef, QueryList, ViewChild, ViewChildren } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { OpenEnzymeDBService } from "../services/open-enzyme-db.service";
import { ChartModule, UIChart } from "primeng/chart";
import { CommonModule } from "@angular/common";
import { TableModule } from "primeng/table";
import { PanelModule } from "primeng/panel";
import { BehaviorSubject } from "rxjs";
import { DropdownModule } from "primeng/dropdown";
import { FormsModule } from "@angular/forms";
import { SkeletonModule } from "primeng/skeleton";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { DialogModule } from "primeng/dialog";
import { TutorialService } from "../services/tutorial.service";
import { CheckboxModule } from "primeng/checkbox";
import { transition, style, animate, trigger } from "@angular/animations";


enum ODBTools {
  DB_SEARCH,
  ENZYME_PREDICTION,
  ENZYME_RECOMMENDATION,
  NA
}

const showTransition = transition(":enter", [
  style({ opacity: 0 }),
  animate(".2s ease-in", style({ opacity: 1 })),
]);
const fadeIn = trigger("fadeIn", [showTransition]);

@Component({
  selector: "landing-page",
  templateUrl: "./landing-page.component.html",
  styleUrls: ["./landing-page.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    RouterLink,
    RouterLinkActive,
    ChartModule,
    TableModule,
    PanelModule,
    DropdownModule,
    FormsModule,
    SkeletonModule,
    ProgressSpinnerModule,
    DialogModule,
    CheckboxModule,
  ],
  host: {
    class: 'flex flex-col justify-center items-center w-full'
  },
  animations: [fadeIn],
})
export class LandingPageComponent {
  @ViewChildren(UIChart) charts!: QueryList<UIChart>;
  @ViewChild('dataSnapshot') dataSnapshot!: ElementRef<HTMLDivElement>;

  readonly whitePaperUrl = this.service.WHITE_PAPER_URL;
  readonly visionUrl = this.service.VISION_URL;
  readonly feedbackUrl = this.service.FEEDBACK_URL;

  researchNeeds = [
    {
      label: "find experimental and entity information in OED",
      value: ODBTools.DB_SEARCH,
    },
    {
      label: "make a prediction for enzyme properties",
      value: ODBTools.ENZYME_PREDICTION,
    },
    {
      label: "get substrate-specific enzyme recommendations",
      value: ODBTools.ENZYME_RECOMMENDATION,
    },
  ];

  readonly ODBTools = ODBTools;
  selectedResearchNeed$ = new BehaviorSubject(ODBTools.NA);
  displayedResearchNeed$ = new BehaviorSubject(ODBTools.NA);

  displayTutorial = true;

  constructor(
    protected service: OpenEnzymeDBService,
    private cdr: ChangeDetectorRef,
    protected tutorialService: TutorialService,
  ) {

    this.tutorialService.tutorialKey = 'landing-page-tutorial';
    if (!this.tutorialService.showTutorial) {
      this.displayTutorial = true;
    } else {
      this.displayTutorial = false;
    }
  }
}
