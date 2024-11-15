import { Component } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";

@Component({
  selector: "landing-page",
  templateUrl: "./landing-page.component.html",
  styleUrls: ["./landing-page.component.scss"],
  standalone: true,
  imports: [
    CardModule,
    ButtonModule,
    RouterLink,
    RouterLinkActive,
  ],
})
export class LandingPageComponent {

  constructor() {}
}
