import { Component, OnInit,OnChanges,SimpleChanges,Input } from '@angular/core';
import { AssetService } from 'src/services/asset.service';
import { SocketService } from 'src/services/socketService';

@Component({
  selector: 'app-stocks',
  templateUrl: './stocks.component.html',
  styleUrls: ['./stocks.component.scss'],
})
export class StocksComponent implements OnInit ,OnChanges{
  @Input() quantityMap: Map<string, number>;
  @Input() currentValue: number;
  @Input() percentChange:number;
  @Input() investedAmt:number;
  data: any;

  options: any;
  symbols: string;
  assests: any;
  updatedStocks: any;
  currentAmountStocks: number;
  currentAmount: number;
  currentAmountCrypto: number;
  tp: any;

  ngOnChanges(changes: SimpleChanges) {
    this.tp = this.quantityMap;
    console.log("00000000000000000000000000000000000000000",this.quantityMap)
    if (changes["quantityMap"] && !changes["quantityMap"].firstChange) {
      this.tp = this.quantityMap;
      this.updateData();
    }
  }
  tempBgColorsMap:Map<string,string> = new Map();

  names: any[] = [];
  pricePercent: any[] = [];

  getRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  updateData() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');

    this.names = [];
    this.pricePercent = [];
    
    for (let [key, value] of this.tp.entries()) {
      this.names.push(key);
      this.pricePercent.push(value);
      console.log(key,value)
    }

    let tempBgColors = new Array(this.names.length);

    for(let i = 0;i<this.names.length;i++){
      let randomColor = this.getRandomColor();
      while(tempBgColors.includes(randomColor)){
        randomColor = this.getRandomColor();
      }
      tempBgColors[i] = randomColor;
      this.tempBgColorsMap.set(this.names[i],randomColor);
    }


    const backgroundColors = tempBgColors;
    const hoverBackgroundColors = backgroundColors.slice(); // Copy the colors array

    this.data = {
      labels: [...this.names],
      datasets: [
        {
          data: [...this.pricePercent],
          backgroundColor: backgroundColors,
          hoverBackgroundColor: hoverBackgroundColors,
        },
      ],
    };

    this.options = {
      cutout: '60%',
      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },
      },
    };
  }

  ngOnInit(): void {
      this.updateData();
  }

}

