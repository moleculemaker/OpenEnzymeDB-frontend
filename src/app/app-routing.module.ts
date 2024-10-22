import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { FontMatchComponent } from "./components/font-match/font-match.component";
import { MainLayoutComponent } from "./components/main-layout/main-layout.component";
import { LandingPageComponent } from "./landing-page/landing-page.component";
import { CenterLayoutComponent } from "./components/center-layout/center-layout.component";

const routes: Routes = [
  {
    path: "",
    component: CenterLayoutComponent,
    children: [
      { path: "", pathMatch: "full", redirectTo: "home" },
      { path: "home", component: LandingPageComponent },
    ]
  },
  // {
  //   path: "",
  //   pathMatch: "full",
  //   component: MainLayoutComponent,
  //   children: [
  //     { path: "", component: LandingPageComponent },
  //   ]
  // },
  { path: "font-match", component: FontMatchComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
