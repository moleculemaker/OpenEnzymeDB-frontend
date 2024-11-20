import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { FontMatchComponent } from "./components/font-match/font-match.component";
import { LandingPageComponent } from "./landing-page/landing-page.component";
import { CenterLayoutComponent } from "./components/center-layout/center-layout.component";
import { QueryComponent } from "src/app/components/query/query.component";




const routes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "home" },
  { path: "home", component: LandingPageComponent },
  {
    path: "",
    component: CenterLayoutComponent,
    children: [
      { path: 'query', component: QueryComponent },
    ]
  },
  { path: "font-match", component: FontMatchComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
