import { SharedModule } from './../../shared/modules/shared.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InvestorDetailsRoutingModule } from './investor-details-routing.module';
import { SmartInvestmentsComponent } from './components/smart-investments/smart-investments.component';
import { FDInvestmentsComponent } from './components/fd-investments/fd-investments.component';
import { ReportsComponent } from './components/reports/reports.component';
import { SupportRequestsComponent } from './components/support-requests/support-requests.component';
import { SipInvestmentsComponent } from './components/sip-investments/sip-investments.component';
import { DetailsComponent } from './components/details/details.component';
import { InvestorDetailsComponent } from './investor-details.component';
import { PrimeNgModule } from 'src/app/shared/modules/prime-ng.module';
import { HeaderModule } from '../header/header.module';

@NgModule({
  declarations: [
    InvestorDetailsComponent,
    DetailsComponent,
    SipInvestmentsComponent,
    SupportRequestsComponent,
    ReportsComponent,
    FDInvestmentsComponent,
    SmartInvestmentsComponent,
  ],
  imports: [
    CommonModule,
    HeaderModule,
    InvestorDetailsRoutingModule,
    PrimeNgModule,
    SharedModule,
  ],
})
export class InvestorDetailsModule {}
