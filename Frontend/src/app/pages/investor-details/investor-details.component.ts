import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { InvestorDetail, IInvestorDetailResponse } from 'src/models/investor';
import { InvestorService } from 'src/services/investor.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-investor-details',
  templateUrl: './investor-details.component.html',
  styleUrls: ['./investor-details.component.scss'],
})
export class InvestorDetailsComponent implements OnInit {
  loading: boolean = true;
  investorDetail!: InvestorDetail;
  userid: string | null = null;
  constructor(
    private investorService: InvestorService,
    private route: ActivatedRoute,
    public messageService: MessageService,
    private location: Location
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.userid = params.get('id');
      if (this.userid) {
        this.getInvestorDetails();
      }
    });
  }
  
  getInvestorDetails() {
    this.loading = true;
    this.investorService.fetchInvestorDetail(Number(this.userid)).subscribe({
      next: (res: IInvestorDetailResponse) => {
        this.investorDetail = res.data;
        console.log('Investor Detail', this.investorDetail);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Something went wrong',
          detail: err.error.message,
        });
        console.error('Investor Detail Error', err);
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  navigateBack() {
    this.location.back();
  }
}
