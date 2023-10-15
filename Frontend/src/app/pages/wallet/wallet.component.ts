import { AssetService } from './../../../services/asset.service';
import { Component, OnInit } from '@angular/core';
import axios from 'axios';
import { map } from 'highcharts';
import { MenuItem, SelectItem } from 'primeng/api';
import { Product } from 'src/models/Product';
import { Stock } from 'src/models/stock';
import { ProductService } from 'src/services/productservice';
import { SocketService } from 'src/services/socketService';
import { StockService } from 'src/services/stock.service';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss'],
})
// export class WalletComponent implements OnInit {
//   items: MenuItem[] = [];
//   stocksData: any[] = [];
//   products: Product[] = [];
//   assets:any[]
//   symbols:string[] = []
//   allInvestedPrice:number = 0;
//   allCurrentPrice:number = 0;
//   stockInvestedPrice:number = 0;
//   stockCurrentPrice:number = 0;
//   cryptoInvestedPrice:number = 0;
//   cryptoCurrentPrice:number = 0;
//   cryptoSocket:any;
//   cryptoQuantityMap:Map<string,number> = new Map();
//   priceCryptoMap:Map<string,number> = new Map();
//   loader:boolean = this.cryptoQuantityMap.size > this.priceCryptoMap.size;
//   // get the list of stocks from the api and then get the live data for this stock if the market is open the subscribe to continous data
//   assests: any[];
//   updatedStocks:any;
//   currentAmountStocks:number = 0;
//   currentAmount: number;
//   investedAmount: number;
//   investedAmountStocks: number;


//   calculateGainLossPercent(investedPrice:number, currentValue:number) {
//     return ((currentValue - investedPrice) / investedPrice) * 100;
//   }

//   getContinousCryptoData = ()=>{
//     this.cryptoSocket = new WebSocket(`wss://ws.coincap.io/prices?assets=${this.symbols?.join(",")}`);

//     this.cryptoSocket.onmessage = (msg:any) => {
//       console.log(JSON.parse(msg.data));
//       const objCopy:any = {
//         price: parseFloat(Object.entries(JSON.parse(msg.data))[0][1] as string),
//       };

//       const cryptoName = Object.entries(JSON.parse(msg.data))[0][0];
//       console.log(cryptoName);

//       if(!this.priceCryptoMap.get(cryptoName)){
//         console.log("in iff",this.cryptoQuantityMap.get(cryptoName))
//         this.priceCryptoMap.set(cryptoName,objCopy?.price);
//         this.cryptoCurrentPrice += objCopy?.price * (this.cryptoQuantityMap.get(cryptoName) ?? 1)
//         this.allCurrentPrice += objCopy?.price * (this.cryptoQuantityMap.get(cryptoName) ?? 1)
//       }else{
//         console.log("in else",this.cryptoQuantityMap.get(cryptoName))
//         const previousPrice = this.priceCryptoMap.get(cryptoName);
//         if(previousPrice != null || previousPrice != undefined){
//           this.cryptoCurrentPrice += (objCopy?.price- previousPrice) * (this.cryptoQuantityMap.get(cryptoName) ?? 1)
//           this.allCurrentPrice += (objCopy?.price- previousPrice) * (this.cryptoQuantityMap.get(cryptoName) ?? 1)
//         }

//         this.loader =  this.cryptoQuantityMap.size >= this.priceCryptoMap.size
//       }
//     };
//   }

//   constructor(private stockService: AssetService,private socketService: SocketService) {
    
//     setTimeout(()=>{
//       this.fetchStocks();
//     },2000);
    
//     setTimeout(()=>{
//       this.getContinousCryptoData();
//     },2000);

//     setTimeout(()=>{
//       const set = new Set(this.symbols);
//       socketService.getStockData([...set]);
//       console.log("symbol",this.symbols);
//     },1000);

//     setTimeout(()=>{
//       socketService.subscribeToContinousData().subscribe((data:any)=>{
//         //setting the live price
//         console.log("live socket data &&&&&*&(*&) : ",data)
//         for(let i= 0;i<this.assests.length;i++){
//           if(this.assests[i]?.assetName?.toLowerCase() == data.id?.split(".")[0]?.toLowerCase()){
//             this.assests[i] = {
//               ...this.assests[i],
//               currentPrice:data?.price
              
//             }
//           }
//         }
  
//       })
//     },3000)

    
//     setInterval(()=>{
//       //current count total
//       let c_total = 0;
//       let s_total = 0;
//       let total = 0;

//       this.assests?.forEach((asset)=>{
//         if(asset.assetType == "CRYPTO"){
//           c_total += parseFloat(asset?.currentPrice * asset?.assetQuantity as any)
//         }else{
//           s_total += parseFloat(asset?.currentPrice * asset?.assetQuantity as any)
//         }
//         total += parseFloat(asset?.currentPrice * asset?.assetQuantity as any)
//       })

//       this.currentAmountStocks = s_total;
//       this.allCurrentPrice = total;

//     },1000);


//     socketService.getStaticStockData()?.subscribe((data:any)=>{
//       console.log("static stock data : ",data);
//       console.log(data);
//       this.updatedStocks = data

//       const map = new Map();

//       data?.forEach((ele:any) => {
//           map.set(ele?.id?.toLowerCase(),ele?.price);
//       });

//       const copy:any[] = [];

//       this.assests.map((asset:any)=>{
//         const entry = {
//           ...asset,
//           currentPrice:map.get(asset?.assetSymbol?.toLowerCase())
//         }

//         // this will be updated when we fetch the assets itself

//         // this.currentAmount += entry?.currentPrice * entry?.assetQuantity;
//         // this.investedAmount += entry?.assetQuantity * entry?.assetPrice;

//         // if(asset.assetType ==='STOCK'){
//         // this.currentAmountStocks += entry?.currentPrice * entry?.assetQuantity;
//         // this.investedAmountStocks += entry?.assetQuantity * entry?.assetPrice
//         // }
//         // else{
//         // this.currentAmountCrypto += entry?.currentPrice * entry?.assetQuantity;
//         // this.investedAmountCrypto += entry?.assetQuantity * entry?.assetPrice
//         // }
//         console.log("Current ENtri",entry);
//         copy.push(entry);
//       });

//       this.assests = copy;
//     })
// }

// fetchStocks(): void {
        
//   this.stockService.GetAssest().subscribe({
//     next: (res: any) => {
//       console.log(res)
//       this.assests = res;
//       if(typeof res == typeof []){
//         this.assests.reverse();
//       }
//       console.log(res);
//       const temp:any[] = []
//       res?.forEach((d:any)=>{
//         console.log("datatttttttttt",d)
//         temp?.push(d?.assetSymbol?.toLowerCase())
        
//         this.currentAmount += d?.currentPrice * d?.assetQuantity;
//         this.investedAmount += d?.assetQuantity * d?.assetPrice;

//         if(d.assetType ==='STOCK'){
//         this.currentAmountStocks += d?.currentPrice * d?.assetQuantity;
//         this.investedAmountStocks += d?.assetQuantity * d?.assetPrice
//         }

//       })
//       // console.log("ALL",this.currentAmount)
//       // console.log("Invested", this.investedAmount)

//       // console.log("Current Stock",this.currentAmountStocks)
      
//       this.symbols = temp;

//     },
//   });
// }
  

//   ngOnInit() {
//     this.items = [
//       { label: 'ALL', icon: 'pi pi-fw pi-calendar' },
//       { label: 'Stocks', icon: 'pi pi-fw pi-shield' },
//       { label: 'Crypto', icon: 'pi pi-fw pi-bitcoin' },
//     ];
//   }
// }

export class WalletComponent implements OnInit {
  filteredStocks: Stock[] = [];
  sortOptions: SelectItem[];
  stocks: Stock[] = [];
  items: MenuItem[] = [];
  goals:any[];
  assests: any[];
  symbols:string[] = [];
  updatedStocks:any;
  investedAmount:number = 0;
  currentAmount:number = 0;
  cryptoQuantityMap:Map<string,number> = new Map();
  investedAmountStocks:number = 0;
  currentAmountStocks:number = 0;
  stockQuantityMap:Map<string,number> = new Map();
  investedAmountCrypto:number = 0;
  currentAmountCrypto:number = 0.00;

  
  cryptoSocket:any
  cryptoMap:Map<string,string> = new Map();



  subscribeToWebsocket(cryptoNames:string) {
    console.log("cryptos subscribed")
    this.cryptoSocket = new WebSocket(
      `wss://ws.coincap.io/prices?assets=${cryptoNames}`
    );   
  }

  async createCryptoMap() {
    const response = await axios.get('https://api.coincap.io/v2/assets');
    for (let i = 0; i < response.data.data.length; i++) {
      this.cryptoMap.set(
        response.data?.data[i]?.id,
        response.data?.data[i]?.symbol
      );
    }
  }


  ngOnInit(): void {
    this.items = [
      { label: 'ALL', icon: 'pi pi-fw pi-calendar' },
      { label: 'Stocks', icon: 'pi pi-fw pi-shield' },
      { label: 'Crypto', icon: 'pi pi-fw pi-bitcoin' },
    ];
  }

  constructor(private stockService: AssetService,private socketService: SocketService) {
    this.createCryptoMap().then(()=>{
      this.fetchStocks()
    });



    
    this.sortOptions = [
      { label: 'Symbol', value: 'symbol' },
      { label: 'Company Name', value: 'name' },
      { label: 'Price', value: 'price' },
      { label: 'Change (%)', value: 'changePercentage' },
    ];


    setTimeout(()=>{
      const set = new Set(this.symbols);
      socketService.getStockData([...set]);
      console.log("symbol",this.symbols);
    },1000);

    console.log(typeof this.currentAmountCrypto)

    setTimeout(()=>{
      console.log(typeof this.currentAmountCrypto)
      if(this.cryptoSocket){
        this.cryptoSocket.onmessage = (msg: any) => {
          console.log(JSON.parse(msg.data));

          for(let i= 0;i<this.assests.length;i++){
            if(this.assests[i]?.assetSymbol?.toLowerCase() == Object.entries(JSON.parse(msg.data))[0][0]?.toLowerCase()){
              const copy = this.assests[i];
              this.assests[i] = {
                ...this.assests[i],
                currentPrice:parseFloat(Object.entries(JSON.parse(msg.data))[0][1] as any), // current dollar price
                changePercent: this.calculatePercentageChange(this.assests[i].currentPrice ,(Object.entries(JSON.parse(msg.data))[0][1] as number))
              }

              // this.currentAmountCrypto += parseFloat(copy[i]?.currentPrice) -  this.assests[i]?.currentPrice
            }
          }
          console.log("crypto live data : ")
        };
      }
      
    },3000);


    setInterval(()=>{
      //current count total
      let c_total = 0;
      let s_total = 0;
      let total = 0;

      this.assests?.forEach((asset)=>{
        if(asset.assetType == "CRYPTO"){
          c_total += parseFloat(asset?.currentPrice * asset?.assetQuantity as any)
        }else{
          s_total += parseFloat(asset?.currentPrice * asset?.assetQuantity as any)
        }
        total += parseFloat(asset?.currentPrice * asset?.assetQuantity as any)
      })

      this.currentAmountCrypto = c_total;
      this.currentAmountStocks = s_total;
      this.currentAmount = total;

    },1000);
   
    setTimeout(()=>{
      socketService.subscribeToContinousData().subscribe((data:any)=>{
        //setting the live price
        console.log("live socket data : ",data)
        for(let i= 0;i<this.assests.length;i++){
          if(this.assests[i]?.assetName?.toLowerCase() == data.id?.split(".")[0]?.toLowerCase()){
            this.assests[i] = {
              ...this.assests[i],
              currentPrice:data?.price
            }
            
          }

          // this.investedAmountStocks +=  this.assests[i].currentPrice
        }
  
      })
    },3000)

    
    socketService.getStaticStockData()?.subscribe((data:any)=>{
      console.log("static stock data : ",data);
      this.updatedStocks = data

      const map = new Map();

      data?.forEach((ele:any) => {
          map.set(ele?.id?.toLowerCase(),ele?.price);
      });

      const copy:any[] = [];

      this.assests.map((asset:any)=>{
        const entry = {
          ...asset,
          currentPrice:map.get(asset?.assetSymbol?.toLowerCase())
        }

        // this will be updated when we fetch the assets itself

        // this.currentAmount += entry?.currentPrice * entry?.assetQuantity;
        // this.investedAmount += entry?.assetQuantity * entry?.assetPrice;

        // if(asset.assetType ==='STOCK'){
        // this.currentAmountStocks += entry?.currentPrice * entry?.assetQuantity;
        // this.investedAmountStocks += entry?.assetQuantity * entry?.assetPrice
        // }
        // else{
        // this.currentAmountCrypto += entry?.currentPrice * entry?.assetQuantity;
        // this.investedAmountCrypto += entry?.assetQuantity * entry?.assetPrice
        // }
        console.log(entry);
        copy.push(entry);
      });

     
      this.assests = copy;
      console.log(this.assests);
    })
    
    // setTimeout(()=>{
    //   const set = new Set(this.symbols);
    //   socketService.getStockData([...set]).subscribe((data: any) => {
    //     console.log(data);
    //   });
    // },2000);


    this.stockService.getCreatedGoals().subscribe((data)=>{
      console.log("goals :",data?.goals)
      this.goals = data?.goals;
    })
  }


  calculatePercentageChange(oldValue:number, newValue:number) {
    var change = newValue - oldValue;
  
    var absoluteOldValue = Math.abs(oldValue);
  
    var percentageChange = (change / absoluteOldValue) * 100;
  
    return percentageChange;
  }

  fetchStocks(): void {
        
      this.stockService.GetAssest().subscribe({
        next: (res: any) => {
          console.log(res)
          this.assests = res;
          if(typeof res == typeof []){
            this.assests.reverse();
          }

          let cryptos = "";
          console.log(this.cryptoMap)
          console.log(res);
          const temp:any[] = []
          res?.forEach((d:any)=>{
            console.log("datatttttttttt",d)
            temp?.push(d?.assetSymbol?.toLowerCase())
            if(this.cryptoMap.get(d?.assetSymbol?.toLowerCase())){
              cryptos += d?.assetSymbol?.toLowerCase() + ","
            }

            this.currentAmount += d?.currentPrice * d?.assetQuantity;
            this.investedAmount += d?.assetQuantity * d?.assetPrice;
    
            if(d.assetType ==='STOCK'){
            this.currentAmountStocks += d?.currentPrice * d?.assetQuantity;
            this.investedAmountStocks += d?.assetQuantity * d?.assetPrice
            this.stockQuantityMap.set(d?.assetSymbol,d?.assetQuantity);

            }
            else{
              this.cryptoQuantityMap.set(d?.assetSymbol,d?.assetQuantity);
              this.currentAmountCrypto += d?.currentPrice * d?.assetQuantity;
              this.investedAmountCrypto += d?.assetQuantity * d?.assetPrice
            }

          })

          if(cryptos[cryptos.length-1] == ","){
            cryptos = cryptos.slice(0,cryptos.length - 1);
          }
          this.symbols = temp;
          console.log(cryptos);
          this.subscribeToWebsocket(cryptos);
        },
      });
    }
  }
