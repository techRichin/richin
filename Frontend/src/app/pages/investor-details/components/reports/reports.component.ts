import { DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Report } from 'src/constants/global-constants';
import { IReportListResponse, IReport } from 'src/models/investor';
import { CommonService } from 'src/services/common.service';
import { InvestorService } from 'src/services/investor.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {

  reportList: Array<IReport> = [];
  loading: boolean = false;
  selectedDate: any = [];
  @Input() userId: any = '';
  showData: boolean = true;
  typesOption: Array<string> = Report.types;
  selectedReportType: string;
  totalCount: number = 0;
  limit: number = 10;
  currentTableType: string = '';

  constructor(
    private investorService: InvestorService,
    public messageService: MessageService,
    public datepipe: DatePipe,
    private commonService: CommonService
  ) {
  }

  ngOnInit() {
  }

  generate() {
    this.getReports(false);
  }

  getReports(emailReport: boolean, download: boolean = false) {
    this.loading = true;

    if(!this.selectedReportType) {
      this.displayToast('error','Required', 'Please select report type !');
      return ;
    }

    let startDate;
    let endDate;
    if (
      this.selectedDate &&
      this.selectedDate[0] != null &&
      this.selectedDate[1] != null
    ) {
      startDate = this.datepipe.transform(this.selectedDate[0], 'yyyy-MM-dd');
      endDate = this.datepipe.transform(this.selectedDate[1], 'yyyy-MM-dd');
    }
    else {
      this.displayToast('error','Required', 'Please select a date range !');
      return ;
    }

    this.investorService
      .fetchReportList(
        this.selectedReportType,
        emailReport,
        startDate,
        endDate,
        this.showData,
        this.userId
      )
      .subscribe({
        next: (res: IReportListResponse) => {
          if(res.data) {
            if(emailReport) {
              this.displayToast('success', 'Report', 'Email sent successfully !');
            }
            else {
              this.reportList = res.data;
              this.totalCount = res.data.length;
              this.currentTableType = this.selectedReportType;
              if(download) {
                this.downloadReport();
              }
              console.log('Report List Response:', res);
            }
          }
          else {
            this.reportList = [];
            this.totalCount = 0;
            this.displayToast('info', 'Report', res.message);
          }
        },
        error: (err) => {
          this.displayToast('error', 'Something went wrong', err.error.message);
          console.error('Report List Error:', err);
        },
        complete: () => {
          this.loading = false;
        },
      });
  }
  
  sendReportInEmail() {
    this.getReports(true);
  }

  downloadReport() {

    var data: Array<any> = [];
    if(this.currentTableType == 'ACCOUNT_STATEMENT') {
      this.reportList.forEach((item, index) => {
        var record: any = {
          'Sr No.': index + 1,
          'Transaction ID': item.transaction_id,
          'Amount': item.amount,
          'Purpose': item.purpose,
          'Transaction Date': this.datepipe.transform(item.transaction_dtm, 'MMM d, y, h:mm:ss a')
        };
  
        data.push(record);
      });
    }
    else {
      this.reportList.forEach((item, index) => {
        var record: any = {
          'Sr No.': index + 1,
          'Investor ID': item.investment_id,
          'Type': item.type,
          'Amount': item.amount,
          'Expected ROI': item.expected_roi,
          'Tenure': item.tenure,
          'Tenure Type': item.tenure_type,
          'Maturity Date': this.datepipe.transform(item.maturity_date, 'MMM d, y'),
          'Created On': this.datepipe.transform(item.created_on, 'MMM d, y, h:mm:ss a')
        };
  
        data.push(record);
      });
    }

    console.log('Download Report:', data);
    this.commonService.downloadDataAsCSV(data, this.selectedReportType);
  }

  displayToast(severity: string, summary: string, detail: string) {
    this.messageService.add({
      severity: severity,
      summary: summary,
      detail: detail,
    });
  }

}
