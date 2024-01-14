import dotenv from 'dotenv'
dotenv.config()
import axios from "axios";
import { NseIndia } from "stock-nse-india";
const nseIndia = new NseIndia()
import * as cheerio from 'cheerio'
import * as fs from 'fs';

// Load the JSON file containing the name to symbol mapping
const nameToSymbolMap = JSON.parse(fs.readFileSync('./nameToSymbolMap.json', 'utf8'));


export const getSymbolFromName = (name) => {
    if (nameToSymbolMap.hasOwnProperty(name?.toLowerCase())) {
      return nameToSymbolMap[name?.toLowerCase()];
    } else {
      return null;
    }
};

export const getCurrentStockPrice = async(symbol) => {
    console.log("getting price")
    try {
        const resp = await nseIndia.getEquityDetails(symbol);
        console.log(resp)
        return resp.priceInfo?.lastPrice;
    } catch (err) {
        throw Error(err);
    }
}

export const GetStockDetails = async (sym)=>{
    if(!sym){
        return{};
    }
   
    try {

        const resp = await axios.get(`${process.env.FLASK_URL}/get_stock_data`, {
            params: {
                symbol: sym?.toUpperCase() + ".NS", // Convert the array to a comma-separated string
        }})
        const { symbol, price, volume } = resp.data
        return {
            id: symbol,
            price: price,
            dayVolume: volume
        }

        
    }catch(er){
        console.log(er);
    }
}



export const GetStockFinancialData = async (req,res)=>{
    let sym = req.params.symbol;
    console.log("Symbol",sym);
    if(!sym){
        return{};
    }
    try {
            const url = `https://finance.yahoo.com/quote/${sym}.NS`;
            console.log(url)
            const response = await axios.get(url);
            const html = response.data;
            const $ = cheerio.load(html);
            // const element = $('td[data-test="PREV_CLOSE-value"]');
            // const text = element.text();
            // console.log(text);
            const stockData = {
              previousClose: $('td[data-test="PREV_CLOSE-value"]').text(),
              open: $('td[data-test="OPEN-value"]').text(),
              bid: $('td[data-test="BID-value"]').text(),
              ask: $('td[data-test="ASK-value"]').text(),
              dayRange: $('td[data-test="DAYS_RANGE-value"]').text(),
              weekRange: $('td[data-test="FIFTY_TWO_WK_RANGE-value"]').text(),
              volume: $('td[data-test="TD_VOLUME-value"]').text(),
              avgVolume: $('td[data-test="AVERAGE_VOLUME_3MONTH-value"]').text(),
              marketCap: $('td[data-test="MARKET_CAP-value"]').text(),
              beta: $('td[data-test="BETA_5Y-value"]').text(),
              peRatio: $('td[data-test="PE_RATIO-value"]').text(),
              eps: $('td[data-test="EPS_RATIO-value"]').text(),
              earningsDate: $('td[data-test="EARNINGS_DATE-value"]').text(),
              forwardDividendAndYield: $('td[data-test="DIVIDEND_AND_YIELD-value"]').text(),
              exDividendDate: $('td[data-test="EX_DIVIDEND_DATE-value"]').text(),
              yearTargetEst: $('td[data-test="ONE_YEAR_TARGET_PRICE-value"]').text()
            };
            console.log("Meta Dataa",stockData);
           return res.json(stockData);
    }catch(er){
        console.log("ERRRO GETTING THE DATA WHEN MARKET IS COOSED",er);
    }
}


export const getStockPriceBetweenDateRange = async(req, res) => {

    const { symbol, start, end } = req.body;

    try {
        const range = {
            start: new Date(start),
            end: new Date(end)
        }

        const data = await nseIndia.getEquityHistoricalData(symbol, range);
        return res.send({ data: data });

    } catch (err) {
        throw Error(err);
    }
}


async function GetTopNiftyGainers(limit) {

    try {
     const gainersUrl = 'https://groww.in/markets/top-gainers?index=GIDXNIFTY100'; 

      const response = await axios.get(gainersUrl);
      const html = response.data;
      const $ = cheerio.load(html);
      const tb = $('.tb10Table > tbody');
      const topGainers = [];
      console.log("respose from Grow",response)
      tb.find('tr').each((index, element) => {
        if(limit == topGainers.length){
            return topGainers;
        }
        const row = $(element); 

        const name = row.find('td:eq(0)').find('> a').text();
        const stockDetailTag = row.find('td:eq(0)').find('> a').attr('href').split("/")?.at(-1);
        const lastPrice = row.find('td:eq(2)').text().split(" ")[0]; 
        const totalChange = row.find('td:eq(2)').find('> div').text(); 
        const change = totalChange.split(" ")[0]
        const pchange = totalChange.split(" ")[1]

        if(name.length > 0){
            topGainers.push({
                lastPrice:lastPrice,
                change:change,
                symbol:name,
                pChange:pchange,
                shortSymbol:getSymbolFromName(name),
                stockDetailTag:stockDetailTag
            });
        }
      });
      return topGainers
    
    } catch (error) {
      console.error('Error:', error);
    } 
}


  async function GetTopNiftyLoosers(limit) {

    console.log("scrapping loosers")
    try {
        const loosersUrl = 'https://groww.in/markets/top-losers?index=GIDXNIFTY100'; 

        const response = await axios.get(loosersUrl);
        const html = response.data;
        const $ = cheerio.load(html);
        const tb = $('.tb10Table > tbody');
        const topLoosers = [];
  
        tb.find('tr').each((index, element) => {
          if(limit == topLoosers.length){
              return topLoosers;
          }
          const row = $(element); 
  
          const name = row.find('td:eq(0)').find('> a').text();
          const stockDetailTag = row.find('td:eq(0)').find('> a').attr('href').split("/")?.at(-1);

          let lastPrice = row.find('td:eq(2)').text().split(" ")[0]; 
          lastPrice = lastPrice.split("-")[0]
          const totalChange = row.find('td:eq(2)').find('> div').text(); 
          const change = totalChange.split(" ")[0]
          const pchange = totalChange.split(" ")[1]
  
          if(name.length > 0){
            topLoosers.push({
                  lastPrice:lastPrice,
                  change:change,
                  symbol:name,
                  pChange:pchange,
                  shortSymbol:getSymbolFromName(name),
                  stockDetailTag:stockDetailTag
              });
          }
        });
        return topLoosers
    } catch (error) {
      console.error('Error:', error);
    }
  }

export const getGainersAndLoosers = async(limit) => {
    try{
        console.log("getting top stock data ...");

        const respData = {
            gainers: await GetTopNiftyGainers(limit),
            losers:  await GetTopNiftyLoosers(limit)
        }
        return respData;
}catch(err){
    console.log("Error while fetching top gainers and loosers");
    const respData = {
        gainers: [],
        losers: []
    }
    return respData;
}

}
let prev_status = false;
export const isMarketOpen = async() => {
    try {

        const resp = await axios.get("https://economictimes.indiatimes.com/markets");
        const html = resp.data;
        console.log("WEB Data")
        const $ = cheerio.load(html);
        const marketStatus = $('.mktStatus').text();
        console.log(marketStatus)
        if(marketStatus.toLowerCase() == "closed"){
            return false;
        }else{
            return true;
        }


        // console.log("fetching market status ...");
        // const data = await fetch("https://www.nseindia.com/api/marketStatus").then((da) => da.json());
        // const marketStatus = data?.marketState[0].marketStatus;
        // console.log("StsTSUYS",marketStatus)
        // if (marketStatus?.toLowerCase() == 'closed' || marketStatus?.toLowerCase() == 'close') {
        //     prev_status = false;
        //     return false;
        // }
        // prev_status = true;
        // return true;
    } catch (err) {
        console.log("Failed to fetch market status", err);
        return prev_status;
    }
}
//let prev_status = false;
// export const isMarketOpen = async () => {
//     try {
//      console.log("Fetching market status...");
//      const options = {
//        url: 'https://www.nseindia.com/api/marketStatus',
//        method: 'GET',
//        headers: {
//          'Accept': 'application/json'
//        }
//      };
//      request(options, (error, response, body) => {
//       console.log("bdhsjfljvbdjbv")
//        if (error) {
//          console.error("Error: Failed to fetch market status", error);
//          return prev_status;
//        }
   
//        if (response.statusCode !== 200) {
//          console.error("Error: Failed to fetch market status. HTTP status:", response.statusCode);
//          return prev_status;
//        }
   
//        const data = JSON.parse(body);
//        const marketStatus = data?.marketState[0].marketStatus;
   
//        if (marketStatus?.toLowerCase() === 'closed' || marketStatus?.toLowerCase() === 'close') {
//          prev_status = false;
//          return false;
//        }
   
//        prev_status = true;
//        return true;
//      });
//    } catch (err) {
//      console.error("Error: Failed to fetch market status", err);
//      return prev_status;
//    }
//    }


