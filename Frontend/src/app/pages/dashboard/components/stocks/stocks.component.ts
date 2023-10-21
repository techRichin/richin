import axios  from 'axios';
import { Component, OnInit } from '@angular/core';
import { Routes } from '@angular/router';
import { StockDetailsComponent } from 'src/app/pages/stock-details/stock-details.component';
import { SocketService } from 'src/services/socketService';

@Component({
  selector: 'app-stocks',
  templateUrl: './stocks.component.html',
  styleUrls: ['./stocks.component.scss'],
})
export class StocksComponent implements OnInit {
  public topLoosers: any[] = [];
  public topGainers: any[] = [];

  routes: Routes = [
    // ... other routes ...

    // Define the stock-details route
    { path: 'stock-details/:1', component: StockDetailsComponent },
  ];

  constructor(private socketService: SocketService) {
    this.topLoosers = [...new Array(5)].map(() => 0);
    this.topGainers = [...new Array(5)].map(() => 0);
    // setInterval(()=>{
    //   this.getGainersAndLoosers(6)
    // },10000);
    console.log('called...');
    socketService.fetchTopStocks()?.subscribe((data: any) => {
      // this.topLosersStocks= data;
      this.topGainers = data.gainers;
      this.topLoosers = data.losers;
      console.log("fetched from server",data);
      // console.log(data?.losers);
      // this.cleanUp();
    });

    // socketService.fetchTopCryptos()?.subscribe((data: any) => {
    //   // this.topLosersStocks= data;
    //   this.mostTradedCryptos = data?.gainers;
    //   this.topLosersCryptos = data?.loosers;
    //   console.log(data?.loosers);
    // });
  }

  cleanUp() {
    // this.topGainers = this.topGainers.filter(
    //   (stock) => stock?.meta && stock?.symbol != 'NIFTY 50'
    // );
    // this.topLoosers = this.topLoosers.filter(
    //   (stock) => stock?.meta && stock?.symbol != 'NIFTY 50'
    // );
    // this.topGainers.length = 5;
    // this.topLoosers.length = 5;
  }

  stocksData: any[] = [];

    ngOnInit(): void {}
}
