import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { FontMatchComponent } from "./components/font-match/font-match.component";
import { LandingPageComponent } from "./pages/landing-page/landing-page.component";
import { QueryComponent } from "~/app/pages/query/query.component";
import { EntityCompoundComponent } from "./pages/entity-compound/entity-compound.component";
import { EntityECNumberComponent } from "./pages/entity-ecnumber/entity-ecnumber.component";
import { EntityUniprotComponent } from "./pages/entity-uniprot/entity-uniprot.component";
import { MainLayoutComponent } from "./components/main-layout/main-layout.component";
import { EnzymeRecommendationComponent } from "./components/enzyme-recommendation/enzyme-recommendation.component";
import { EnzymeRecommendationResultComponent } from "./components/enzyme-recommendation-result/enzyme-recommendation-result.component";
import { EnzymeRecommendationDetailComponent } from "./components/enzyme-recommendation-detail/enzyme-recommendation-detail.component";
import { PropertyPredictionComponent } from "src/app/components/property-prediction/property-prediction.component";
import { PropertyPredictionResultComponent } from "src/app/components/property-prediction-result/property-prediction-result.component";
import { PropertyPredictionDetailComponent } from "./components/property-prediction-detail/property-prediction-detail.component";
import { AboutPageComponent } from "./about-page/about-page.component";
import { TutorialPageComponent } from "./tutorial-page/tutorial-page.component";
import { CenterLayoutComponent } from "./components/center-layout/center-layout.component";



const routes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "home" },
  { 
    path: "", 
    component: CenterLayoutComponent, 
    children: [
      { path: "home", component: LandingPageComponent },
      { path: 'about/:section', component: AboutPageComponent },
      { path: 'about', component: AboutPageComponent },
      { path: 'tutorial', component: TutorialPageComponent },
    ]
  },
  {
    path: "",
    component: MainLayoutComponent,
    children: [
      { path: 'query', component: QueryComponent },
      { path: 'query/compound/:name', component: EntityCompoundComponent },
      { path: 'query/ec/:ec', component: EntityECNumberComponent },
      { path: 'query/uniprot/:id', component: EntityUniprotComponent },
      
      { path: 'enzyme-recommendation', component: EnzymeRecommendationComponent },
      { path: 'enzyme-recommendation/result/:id', component: EnzymeRecommendationResultComponent },
      { path: 'enzyme-recommendation/result/:id/:algorithm', component: EnzymeRecommendationDetailComponent },

      { path: 'property-prediction', component: PropertyPredictionComponent },
      { path: 'property-prediction/result/:dlkcat/:unikp/:catpred', component: PropertyPredictionResultComponent },
      { path: 'property-prediction/result/detail/:algorithm/:id/:index', component: PropertyPredictionDetailComponent },
    ]
  },
  { path: "font-match", component: FontMatchComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
