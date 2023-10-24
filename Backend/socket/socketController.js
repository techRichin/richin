import stocksocket from "stocksocket";
import { isMarketOpen } from "../controllers/stockController.js";
import { NseIndia } from "stock-nse-india";
import { getTopCryptos } from "./crypto.js";
import axios from "axios";
import request from "request";
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
                console.log("market is closed");
                console.log("hfvishgi",stocktickers.join(','))
                const symbolsWithNS = stocktickers.map(symbol => symbol + '.NS').join(',');
                axios.get('http://192.168.0.103:7000/get_stock_data', {
                  params: {
                      symbols: symbolsWithNS, // Convert the array to a comma-separated string
                }
              }).then(response => {
                  if (Array.isArray(response.data)) {
                      const transformedData = [];
              
                      response.data.forEach(data => {
                          if (!data.error) {
                              const { symbol, price, volume } = data;
                              console.log('Symbol:', symbol);
                              console.log('Price:', price);
                              console.log('Day Volume:', volume);
                              transformedData.push({
                                  id: symbol,
                                  price: price,
                                  dayVolume: volume
                              });
                          } else {
                              console.error('Error for symbol', data.symbol, ':', data.error);
                          }
                      });
                      this.socket?.emit("STATIC_STOCK_DATA", transformedData);
                  } else {
                      console.error('Invalid response data:', response.data);
                  }
              }).catch(error => {
                  console.error('Error while fetching stock data:', error);
              });
            
            }
        } catch (er) {
            console.log("error occured while getting stock stream")
        }

        async function getStockData(symbols) {
            console.log("SYMBOL",symbols)
            if (symbols.length === 0) return [];
            const responses = [];
          
            for (const symbol of symbols) {
              try {
                if (!symbol) {
                  return;
                  // throw new Error("No Symbol specified");
                }
          
                const options = {
                  url: `https://www.nseindia.com/api/quote-equity?symbol=${symbol.toUpperCase()}`,
                  method: 'GET',
                  headers: {
                    'Accept': 'application/json'
                  }
                };
                console.log("After Req")
                request(options, (error, response, body) => {
                  if (error) {
                    console.error(`Error fetching data for ${symbol}`, error);
                    return;
                  }
          
                  if (response.statusCode !== 200) {
                    console.error(`Error fetching data for ${symbol}. HTTP status:`, response.statusCode);
                    return;
                  }
                
                  console.log("BODDDDY",body)
                  const data = JSON.parse(body);
                  console.log("each stock resp", data);
                  responses.push(data);
                });
                console.log("Response",responses)
              } catch (error) {
                console.error(`Error fetching data for ${symbol}`, error);
              }
            }
          
            return responses;
          }
    }
}


