import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { StockService } from 'src/services/stock.service';
import { environment } from 'src/environments/environment';
import axios from "axios";

@Component({
  selector: 'app-gpt',
  templateUrl: './gpt.component.html',
  styleUrls: ['./gpt.component.scss'],
})
export class GptComponent implements AfterViewInit {
  @ViewChild('messageInput', { static: false }) messageInput!: ElementRef;

  constructor(private stockService: StockService) {}

  ngAfterViewInit(): void {
    this.messageInput.nativeElement.addEventListener(
      'keydown',
      (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
          this.sendMessage();
        }
      }
    );
  }

  msg_response: string;
  messages: { text: string; isUser: boolean }[] = [];
  value: string = '';
  showReference: boolean = true;

  async sendMessage() {
    const user_input = this.value.trim();
    if (!user_input) {
      return;
    }

    this.messages.push({ text: user_input, isUser: true });

    const resp = await axios.get(`${environment.baseUrl}/api/user/canChatToday`).then((res:any)=>{
      console.log(res);
      if(res.data?.status == 200){
        this.stockService
        .GetGptOutput({ user_input })
        .subscribe((response: any) => {
          console.log(response);
          this.msg_response = response.response;
          this.messages.push({ text: this.msg_response, isUser: false });
          this.value = '';
          this.showReference = false;
        });
      }else{
        alert(res?.data.message);
      }
    })

   
  }
  referenceData: { question: string; answer: string }[] = [
    {
      question: 'Compare TCS and Reliance',
      answer: 'TCS and Reliance are two different companies...',
    },
    {
      question:
        'Is it better to invest money in crypto or stocks, or a mix of both?',
      answer: 'The choice between investing in crypto or stocks...',
    },
    {
      question:
        'Suggest me 5 stocks with a potential upside of 15% and more within the next one year',
      answer:
        'However, here are some general tips on how you can approach the ....',
    },
    {
      question: 'Should I buy and hold ICICI for the next 6 months',
      answer:
        'Deciding whether to buy and hold a specific stock, including ICICI Bank, for the next...',
    },
  ];

  removeReferenceQuestion(index: number) {
    this.referenceData.splice(index, 1);
  }

  scrollToBottom() {}
}
