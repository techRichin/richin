import stocksocket from "stocksocket";
import { isMarketOpen ,GetStockDetails} from "../controllers/stockController.js";
import { NseIndia } from "stock-nse-india";
import { getTopCryptos } from "./crypto.js";
import axios from "axios";
const nseIndia = new NseIndia()



export class StockDataHandler {
    // Maintaining the client to emit the socket events
    socket = null;
    constructor(socketClient) {
        console.log("Client connected");
        this.socket = socketClient;
    }

    //Getting live data for list of specified stocks
    GetStockDataStream = async(payload, cb) => {
        console.log("-------------getting socket data stream------------------")
        try {
            var stocktickers = payload.symbols;
            console.log("stock tickers",stocktickers)
            const is_market_open = await isMarketOpen();
            console.log(is_market_open)
            if (is_market_open) {
                stocktickers.forEach((symbolData) => {
                    this.socket.join(symbolData?.toUpperCase());
                });
                console.log("market is open");
                // cb({
                //     status: 200,
                //     message: "Market is open hence subscribed to the stock"
                // })
            } else {
                console.log("market is closed",stocktickers.length);
                const data = await getStockData(stocktickers);
                 console.log("received data from api as market is closed : ",data)
                    const transformedData = [];
                    if (data?.length > 0) {
                        data?.forEach(stock => {
                            const rawData = stock;
                            console.log("---oooo---",rawData)
                            transformedData.push({
                                id: rawData.id,
                                price: rawData.price,
                                dayVolume: rawData.dayVolume
                            });
                        });
                    }
                    console.log("--------successfully subscribed to the stocks-----")
                    console.log("transformed data: ",transformedData)
                   this.socket?.emit("STATIC_STOCK_DATA",transformedData)
                
            }
        } catch (er) {
            console.log("error occured while getting stock stream")
        }

        async function getStockData(symbols) {
            const responses = [];
          
            await Promise.all(symbols.map(async (symbol) => {
              try {
                if (!symbol) {
                  throw new Error("No Symbol specified");
                }
          
                const response = await GetStockDetails(symbol)
                if(response){
                    console.log("got response : ",response)
                    responses.push(response)
                }
              } catch (error) {
                console.error(`Error fetching data for ${symbol}`, error);
              }
            }));
          
            return responses;
          }
    }
}

