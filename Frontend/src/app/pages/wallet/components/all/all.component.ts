import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-all',
  templateUrl: './all.component.html',
  styleUrls: ['./all.component.scss'],
})
export class AllComponent implements OnInit,OnChanges {
  constructor() {}
  data: any;
  @Input() cryptos: number;
  @Input() stocks:number;
  @Input() allInvested:number
  @Input() allCurrent:number
  options: any;


  ngOnChanges(changes: SimpleChanges) {
    console.log(this.cryptos,this.stocks)
    if (changes["cryptos"] && !changes["cryptos"].firstChange|| changes["allCurrent"] && !changes["allCurrent"].firstChange || changes["stocks"] && !changes["stocks"].firstChange ) {
        this.updateData()
    }
  }


  updateData(){
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');

    this.data = {
      labels: ['Stocks', 'Crypto'],
      datasets: [
        {
          data: [this.cryptos, this.stocks],
          backgroundColor: [
            documentStyle.getPropertyValue('--blue-500'),
            documentStyle.getPropertyValue('--yellow-500'),
          ],
          hoverBackgroundColor: [
            documentStyle.getPropertyValue('--blue-400'),
            documentStyle.getPropertyValue('--yellow-400'),
          ],
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

  ngOnInit() {
    this.updateData();
  }
}
