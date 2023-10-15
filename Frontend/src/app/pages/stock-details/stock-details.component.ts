import { SocketService } from 'src/services/socketService';
import { Component,HostListener, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AssetService } from 'src/services/asset.service';
import axios from 'axios';
import { environment } from 'src/environments/environment';
import { webSocket } from 'rxjs/webSocket';
import { MessageService, SelectItem } from 'primeng/api';
declare const TradingView: any;



@Component({
  selector: 'app-stock-details',
  templateUrl: './stock-details.component.html',
  styleUrls: ['./stock-details.component.scss'],
})
export class StockDetailsComponent implements AfterViewInit,OnDestroy  {
  quantity: number = 1;
  subtotal: number;
  title: string; // Add this property to store the title
  ASSET_TYPE: string;
  cryptoSocket: any = undefined;
  marketStatus:boolean = true;
  //For Buy
  assetSymbol: string;
  assetName: string;
  assetPrice: number;
  assetType: string = 'STOCK';
  assetQuantity: number;
  cryptoMap = new Map();
  public cryptoStat = new Map();
  stockData: any;
  cryptoData: any;
  cryptoStatsInfo : any;
  currentStock: any;
  cryptoLogoURL : any;
  //WatchList
  stockSymbol: string;
  stockName: string;
  type: string = 'STOCK';
  //Added explisitly to check

  public async createCryptoMap() {
    const response = await axios.get('https://api.coincap.io/v2/assets');

    for (let i = 0; i < response.data.data.length; i++) {
      this.cryptoMap.set(
        response.data?.data[i]?.id,
        response.data?.data[i]?.symbol,
        
      );
    const cryptoId = response.data.data[i].id;
    const cryptoData = response.data.data[i];

    const cryptoStats = {
      rank: cryptoData?.rank,
      symbol: cryptoData?.symbol,
      name: cryptoData?.name,
      supply: cryptoData?.supply,
      maxSupply: cryptoData?.maxSupply,
      marketCapUsd: cryptoData?.marketCapUsd,
      volumeUsd24Hr: cryptoData?.volumeUsd24Hr,
      priceUsd: cryptoData?.priceUsd,
      changePercent24Hr: cryptoData?.changePercent24Hr,
      vwap24Hr: cryptoData?.vwap24Hr,
      explorer: cryptoData?.explorer
    };

    this.cryptoStat.set(cryptoId, cryptoStats);
    }
    //console.log(" Fromm function BTC",this.cryptoStat.get("bitcoin"))
  }

  async getcryptoStats(){
    console.log("BTC",this.cryptoStat.get("bitcoin"))
  }

  async getStockDetails() {
    if (this.ASSET_TYPE == 'STOCK') {
      await axios
        .get(
          `${
            environment.baseUrl
          }/api/getStockDetails/${this.title?.toUpperCase()}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            },
          }
        )
        .then((res) => {
          console.log('Stock details : ', res.data);
          this.stockData = res.data;
        });
    } else {
      await axios
        .get(`https://api.coingecko.com/api/v3/coins/bitcoin`)
        .then((res) => {
          console.log('crypto details ARE :', res.data);
          this.cryptoData = res.data;
        });
    }
  }


  getMarketStatus(){
    console.log(this.currentStock);
    axios.interceptors.request.use(function (config) {
      config.headers.Authorization = `Bearer ${localStorage.getItem(
        'authToken'
      )}`;
      return config;
    });
    axios
      .post(`${environment.baseUrl}/api/assets/getMarketStatus`)
      .then((response) =>{
        console.log(response);
        console.log('Market Status',response);
        this.marketStatus = response.data?.marketStatus;
      })
      .catch(function (error) {
        console.log(error);
        alert('Something went wrong , please try again');
      });
  }
  
  constructor(
    private route: ActivatedRoute,
    private buyreq: AssetService,
    private socketService: SocketService,
    private messageService: MessageService
  ) 
  {

    window.addEventListener('beforeunload', function (event) {
      // You can perform actions or show a confirmation message here
      // For example, you can show a confirmation dialog to the user
      // event.preventDefault(); // This line is needed to display the confirmation message
    
      // You can customize the confirmation message
      console.log("-----------unloading--------")
    });

    // Retrieve the title parameter from the route
    this.route.params.subscribe((params: any) => {
      this.title = params.title;
      console.log(params);
      this.ASSET_TYPE = params?.type;
    });

    if (this.ASSET_TYPE == 'STOCK') {
      this.getMarketStatus();
      this.getStockDetails();
      socketService.subscribeToContinousData().subscribe((data: any) => {
        console.log('socket live data : ', data);

        if (data?.id?.split('.')[0]?.toLowerCase() == this.title.toLowerCase())
          this.currentStock = data;
        this.subtotal = this.currentStock?.price * this.quantity;
      });

      socketService.getStockData([this.title]);
      socketService.getStaticStockData()?.subscribe((data: any) => {
        console.log('static stock data : ', data);
        this.currentStock = data[0];
        this.subtotal = data[0].price;
        this.assetPrice = data[0]?.price;
      });
    } else if (this.ASSET_TYPE == 'CRYPTO') {
      
      this.createCryptoMap().then(() => {
        this.loadTradingViewLibrary();
        //console.log("crypto Analysis Data",this.cryptoStat.get(this.title.toLowerCase()))
        this.cryptoStatsInfo = this.cryptoStat.get(this.title.toLowerCase());
        console.log("IN VAR",this.cryptoStatsInfo)
      });

      axios.get(`https://api.coingecko.com/api/v3/coins/${this.title?.toLowerCase()}`)
        .then((data) => {
           this.cryptoLogoURL = data.data.image.small;
        });

      if (this.ASSET_TYPE === 'CRYPTO') {
        console.log('established socketiopd');

        this.cryptoSocket = new WebSocket(
          `wss://ws.coincap.io/prices?assets=${this.title.toLowerCase()}`
        );
        console.log("Live crytpo data",this.cryptoSocket)
      }

      if (this.cryptoSocket) {
        const temptite = this.title;
        
        console.log(temptite);
        this.cryptoSocket.onmessage = (msg: any) => {
          console.log("Crypto Data",JSON.parse(msg.data));
          const objCopy = {
            price: Object.entries(JSON.parse(msg.data))[0][1],
            id: temptite,
          };
          this.currentStock = objCopy; // Update the class variable
          this.subtotal = this.currentStock?.price * this.quantity;
        };
      }
    } else {
      console.log('invalid asset name');
    }


   
  }
  
  ngOnDestroy(){
    console.log("_________")
    this.socketService.unsubscribeToContinousData(this.title?.toUpperCase())
  }

  ngAfterViewInit(): void {
    this.loadTradingViewLibrary();
    console.log("1st")
  }

  calculateDailyHigh(): number {
    const minValue = this.stockData?.priceInfo?.intraDayHighLow.min;
    const maxValue = this.stockData?.priceInfo?.intraDayHighLow.max;
    const currentValue = this.stockData?.priceInfo?.intraDayHighLow.value;
    const positionPercentage =
      ((currentValue - minValue) / (maxValue - minValue)) * 100;
    console.log(positionPercentage);

    return positionPercentage;
  }
  calculateWeaklyHigh(): number {
    const minValue = this.stockData?.priceInfo?.weekHighLow?.min;
    const maxValue = this.stockData?.priceInfo?.weekHighLow?.max;
    const currentValue = this.stockData?.priceInfo?.weekHighLow?.value;
    const positionPercentage =
      ((currentValue - minValue) / (maxValue - minValue)) * 100;
    console.log(positionPercentage);

    return positionPercentage;
  }
  
  formatMarketCap(marketCap: string): string {
    const marketCapNumber = parseFloat(marketCap);

    if (!isNaN(marketCapNumber)) {
      if (marketCapNumber >= 10000000) {
        return (marketCapNumber / 10000000).toFixed(2) + ' Cr';
      } else if (marketCapNumber >= 100000) {
        return (marketCapNumber / 100000).toFixed(2) + ' Lac';
      }
    }

    // Return the original value if it couldn't be formatted
    return marketCap;
  }


  loadTradingViewLibrary() {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      this.initializeTradingViewWidget();
    };
    document.head.appendChild(script);
  }

  initializeTradingViewWidget() {
    if (typeof TradingView !== 'undefined') {
      new TradingView.widget({
        with: '100%',
        symbol:
          this.cryptoMap.get(this.title.toLocaleLowerCase()) ?? this.title,
        interval: 'D',
        timezone: 'Etc/UTC',
        theme: 'light',
        style: '1',
        locale: 'en',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: 'trading-chart',
      });
    } else {
      console.error('TradingView library is not loaded.');
    }
  }
  calculateSubtotal() {
    // Calculate the subtotal based on the quantity
    this.subtotal = this.quantity * this.currentStock?.price; // Replace with the actual stock price
  }

  //this function will accept a name of stock
  buyAssest() {
    if(!this.marketStatus){
      return alert("Sorry the market is closed!")
    }
    console.log(this.currentStock);
    axios.interceptors.request.use(function (config) {
      config.headers.Authorization = `Bearer ${localStorage.getItem(
        'authToken'
      )}`;
      return config;
    });
    axios
      .post(`${environment.baseUrl}/api/assets/purchaseAsset`, {
        assetSymbol: this.title.toUpperCase(),
        assetName: this.title.toUpperCase(),
        assetPrice: this.currentStock?.price,
        assetType: this.ASSET_TYPE,
        assetQuantity: this.quantity,
      })
      .then(function (response) {
        console.log(response);
        console.log(response)
        if(response.status == 201 || response.status == 200){
          alert('Buy successfull');
        }else{
          alert(`Error occcured : ${response?.data?.message}`)
        }
      })
      .catch(function (error) {
        console.log(error);
        alert('Something went wrong , please try again');
      });

    return;
    // Create a FormData object with your data
  }

  addToWatchlist() {
    axios.interceptors.request.use(function (config) {
      config.headers.Authorization = `Bearer ${localStorage.getItem(
        'authToken'
      )}`;
      return config;
    });
    axios
      .post(`${environment.baseUrl}/api/watchlist/createWatchList`, {
        stockSymbol: this.title.toUpperCase(),
        stockName: this.title.toUpperCase(),
        type: this.assetType,
      })
      .then(function (response) {
        console.log(response);
        // this.messageService.add({
        //   severity: 'success',
        //   summary: 'Added To the Watchlist',
        //   detail: 'Richin',
        // });
        alert('Added To the Watchlist');
      })
      .catch(function (error) {
        console.log(error);
        alert('Something went wrong , please try again');
      });

    return;
  }
}
