import { DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { StatusFilter } from 'src/constants/global-constants';
import { IName, IAssetClassesResponse } from 'src/models/asset';
import {
  ISmartInvestmentListResponse,
  SmartInvestment,
} from 'src/models/investor';
import { AssetService } from 'src/services/asset.service';
import { InvestorService } from 'src/services/investor.service';

@Component({
  selector: 'app-smart-investments',
  templateUrl: './smart-investments.component.html',
  styleUrls: ['./smart-investments.component.scss'],
})
export class SmartInvestmentsComponent implements OnInit {

  @Input() userId: any = '';
  smartInvestmentList: SmartInvestment[] = [];
  loading: boolean = true;
  statusOption: Array<string> = StatusFilter.options;
  selectedStatus: string | null = null;
  assetTypeOption: Array<IName> = [];
  selectedAssetType: Array<IName> = [];
  offset: number = 0;
  limit: number = 10;
  totalCount: number = 0;
  selectedDate: any = null;

  constructor(
    private investorService: InvestorService,
    public messageService: MessageService,
    private assetService: AssetService,
    public datepipe: DatePipe,
    private router: Router
  ) {}

  ngOnInit() {
    this.getAssetTypeList();
    this.getSmartInvestments();
  }

  getAssetTypeList() {
    this.assetService.fetchAssetClasses().subscribe({
      next: (res: IAssetClassesResponse) => {
        this.assetTypeOption = res.data;
        console.log('Asset Type List Response:', res);
      },
      error: (err) => {
        console.error('Asset Type List Error:', err);
      },
    });
  }

  getSmartInvestments() {
    this.loading = true;
    let status: string = this.selectedStatus ? this.selectedStatus : '';

    let startDate;
    let endDate;
    if (
      this.selectedDate &&
      this.selectedDate[0] != null &&
      this.selectedDate[1] != null
    ) {
      startDate = this.datepipe.transform(this.selectedDate[0], 'yyyy-MM-dd');
      endDate = this.datepipe.transform(this.selectedDate[1], 'yyyy-MM-dd');
    } else {
      startDate = '';
      endDate = '';
    }

    var assetIds: Array<number> = [];
    this.selectedAssetType.forEach((asset) => assetIds.push(asset.id));

    this.investorService
      .fetchSmartInvestmentList(
        this.offset,
        this.limit,
        status,
        startDate,
        endDate,
        assetIds.toString(),
        this.userId
      )
      .subscribe({
        next: (res: ISmartInvestmentListResponse) => {
          this.totalCount = res.data.count;
          this.smartInvestmentList = res.data.investments;
          console.log('Smart Investment List Response:', res);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Something went wrong',
            detail: err.error.message,
          });
          console.error('Smart Investment List Error:', err);
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  changeFilterDate() {
    if (this.selectedDate[0] != null && this.selectedDate[1] != null) {
      this.offset = 0;
      this.getSmartInvestments();
    }
  }

  filterChange() {
    this.offset = 0;
    this.getSmartInvestments();
  }

  clearFilter() {
    this.selectedStatus = null;
    this.selectedAssetType = [];
    this.offset = 0;
    this.limit = 10;
    this.selectedDate = null;
    this.getSmartInvestments();
  }

  paginate(event: any) {
    this.offset = event.first;
    this.limit = event.rows;
    this.getSmartInvestments();
  }
  openInvestmentInNewTab(assetId: string) {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/assets', 'list', assetId])
    );
    window.open(url, '_blank');
  }
}
