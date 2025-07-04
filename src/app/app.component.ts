import { Component } from "@angular/core";
import { UserInfoService } from "./services/userinfo.service";
import { MenuItem } from "primeng/api";
import { MenuModule } from "primeng/menu";
import { NgIf } from "@angular/common";
import { RouterOutlet } from "@angular/router";
import { OpenEnzymeDBService } from "./services/openenzymedb.service";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
    standalone: true,
    imports: [
        MenuModule,
        NgIf,
        RouterOutlet,
    ],
})
export class AppComponent {
  emailstring: string =
    "mailto:openenzymedb-feedback@moleculemaker.org?Subject=User feedback for OpenEnzymeDB";
  showCite: boolean = false;

  showComingSoonPopup: boolean = false;
  comingSoonTimerID: number | null = null;
  autocloseComingSoonPopup: boolean = true;

  get userMenuItems(): Array<MenuItem> {
    return this.userInfo
      ? [
          {
            label: "Sign Out",
            icon: "pi pi-fw pi-sign-out",
            command: () => this.logout(),
          },
        ]
      : [];
  }

  get userInfo() {
    return this.userInfoService.userInfo;
  }

  readonly whitePaperUrl = this.openEnzymeDBService.WHITE_PAPER_URL;
  readonly visionUrl = this.openEnzymeDBService.VISION_URL;
  readonly feedbackUrl = this.openEnzymeDBService.FEEDBACK_URL;
  readonly releaseNotesUrl = this.openEnzymeDBService.RELEASE_NOTES_URL;

  constructor(
    private userInfoService: UserInfoService,
    private openEnzymeDBService: OpenEnzymeDBService,
  ) {}

  ngOnInit() {
    this.userInfoService.fetchUserInfo();
    this.comingSoonTimerID = setTimeout(() => {
      this.toggleComingSoonPopup();
    }, 2000) as unknown as number;
  }

  citeButton() {
    this.showCite = !this.showCite;
  }

  toggleComingSoonPopup() {
    this.showComingSoonPopup = !this.showComingSoonPopup;

    if (this.comingSoonTimerID) {
      clearTimeout(this.comingSoonTimerID);
    }

    if (this.autocloseComingSoonPopup) {
      this.autocloseComingSoonPopup = false;

      this.comingSoonTimerID = setTimeout(() => {
        this.toggleComingSoonPopup();
      }, 8000) as unknown as number;
    }
  }

  login() {
    this.userInfoService.login();
  }

  logout() {
    this.userInfoService.logout();
  }
}
