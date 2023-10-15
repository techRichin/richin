import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InvestorDetailsComponent } from './investor-details.component';

const routes: Routes = [
  { path: '', component: InvestorDetailsComponent, pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InvestorDetailsRoutingModule { }
