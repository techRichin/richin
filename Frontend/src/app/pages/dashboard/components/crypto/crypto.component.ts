import { Component, OnInit } from '@angular/core';
import { Routes } from '@angular/router';
import axios from 'axios';
import { StockDetailsComponent } from 'src/app/pages/stock-details/stock-details.component';
import { SocketService } from 'src/services/socketService';

@Component({
  selector: 'app-crypto',
  templateUrl: './crypto.component.html',
  styleUrls: ['./crypto.component.scss'],
})
export class CryptoComponent implements OnInit {
  public topLoosers: any[] = [];
  public topGainers: any[] = [];
  public topLosersCryptos: any[] = [];
  public mostTradedCryptos: any[] = [];
  public cryptoLogoUrL : string =''
  public cryptoMap = new Map();

  routes: Routes = [
    // ... other routes ...

    // Define the stock-details route
    { path: 'stock-details/:1', component: StockDetailsComponent },
  ];

  // async createCryptoMap() {
  //   const response = await axios.get('https://api.coincap.io/v2/assets');
  //   for (let i = 0; i < response.data.data.length; i++) {
  //     axios.get(`https://api.coingecko.com/api/v3/coins/${response.data?.data[i]?.id.toLowerCase()}`).then((dataUrl)=>{
  //       this.cryptoMap.set(
  //         response.data?.data[i]?.id,
  //         dataUrl.data.image.small
  //       );
  //    });
  //   }
  // }

  // async createCryptoMap() {
  //   const response = await axios.get('https://api.coincap.io/v2/assets');
  //   const promises = [];
  
  //   for (let i = 0; i < response.data.data.length; i++) {
  //     const cryptoId = response.data?.data[i]?.id.toLowerCase();
  //     const imageUrlPromise = axios.get(`https://api.coingecko.com/api/v3/coins/${cryptoId}`)
  //       .then((dataUrl) => dataUrl.data.image.small)
  //       .catch((error) => {
  //         console.error(`Error fetching image URL for ${cryptoId}:`, error);
  //         return null; // You can handle the error gracefully
  //       });
  
  //     promises.push(imageUrlPromise);
  //   }
  
  //   const imageUrls = await Promise.all(promises);
  
  //   for (let i = 0; i < response.data.data.length; i++) {
  //     this.cryptoMap.set(
  //       response.data?.data[i]?.id,
  //       imageUrls[i]
  //     );
  //   }
    
  //   // Now cryptoMap should be populated correctly
  // }

  
  constructor(private socketService: SocketService) {

    // this.getCryptoLogo('bitcoin')

    this.topLoosers = [...new Array(5)].map(() => 0);
    this.topGainers = [...new Array(5)].map(() => 0);

    console.log('called...');
    // this.createCryptoMap().then(()=>{
    //   console.log(this.cryptoMap)
      
    // })
    // socketService.fetchTopStocks()?.subscribe((data: any) => {
    //   // this.topLosersStocks= data;
    //   this.topGainers = data?.gainers;
    //   this.topLoosers = data?.losers;
    //   console.log(data?.gainers);
    //   console.log(data?.losers);
    //   this.cleanUp();
    // });

    socketService.fetchTopCryptos()?.subscribe((data: any) => {
      // this.topLosersStocks= data;
      this.mostTradedCryptos = data?.gainers;
      this.topLosersCryptos = data?.loosers;
      console.log(data?.gainers);
      console.log(data?.loosers);
      
        console.log("From time",this.cryptoMap)
       // Top Gainers
       if(this.mostTradedCryptos.length != undefined )
        for(let i = 0 ; i< this.mostTradedCryptos.length;i++){
          axios.get(`https://api.coingecko.com/api/v3/coins/${this.mostTradedCryptos[i]?.id}`)
        .then((data) => {
          this.mostTradedCryptos[i] = {
            ...this.mostTradedCryptos[i],
            imageUrl:data.data.image.small, 
          }
        });
          console.log("With Image URL",this.mostTradedCryptos[i])
        }
      //TOP Loosers
      console.log("LOOSERS",this.topLoosers[1])
      if(this.topLosersCryptos.length != undefined )
      for(let i = 0 ; i< this.topLosersCryptos.length;i++){
        axios.get(`https://api.coingecko.com/api/v3/coins/${this.topLosersCryptos[i]?.id}`)
      .then((data1) => {
        this.topLosersCryptos[i] = {
          ...this.topLosersCryptos[i],
          imageUrl:data1.data.image.small, 
        }
      });
        console.log("With Lossers URL",this.topLosersCryptos[i])
      }
    });
  }

  // getCryptoLogo(title: string) {
  //   if (!this.cryptoLogos[title]) {
  //     axios.get(`https://api.coingecko.com/api/v3/coins/${title?.toLowerCase()}`)
  //       .then((data) => {
  //         const logoUrl = data.data.image.small;
  //         this.cryptoLogos[title] = logoUrl;
  //       });
  //   }
  //   return this.cryptoLogos[title] || '';
  // }

  ngOnInit(): void {}
}
