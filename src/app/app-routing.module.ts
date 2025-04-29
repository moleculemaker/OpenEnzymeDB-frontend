import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { FontMatchComponent } from "./components/font-match/font-match.component";
import { LandingPageComponent } from "./pages/landing-page/landing-page.component";
import { CenterLayoutComponent } from "./components/center-layout/center-layout.component";
import { QueryComponent } from "~/app/pages/query/query.component";
import { EntityCompoundComponent } from "./pages/entity-compound/entity-compound.component";
import { EntityECNumberComponent } from "./pages/entity-ecnumber/entity-ecnumber.component";
import { EntityUniprotComponent } from "./pages/entity-uniprot/entity-uniprot.component";
import { MainLayoutComponent } from "./components/main-layout/main-layout.component";
import { EnzymeRecommendationComponent } from "./components/enzyme-recommendation/enzyme-recommendation.component";
import { EnzymeRecommendationResultComponent } from "./components/enzyme-recommendation-result/enzyme-recommendation-result.component";

const routes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "home" },
  { path: "home", component: LandingPageComponent },
  {
    path: "",
    component: MainLayoutComponent,
    children: [
      { path: 'query', component: QueryComponent },
      { path: 'compound/:name', component: EntityCompoundComponent },
      { path: 'ec/:number', component: EntityECNumberComponent },
      { path: 'uniprot/:id', component: EntityUniprotComponent },
      
      { path: 'enzyme-recommendation', component: EnzymeRecommendationComponent },
      { path: 'enzyme-recommendation/result/:id', component: EnzymeRecommendationResultComponent },
    ]
  },
  { path: "font-match", component: FontMatchComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
