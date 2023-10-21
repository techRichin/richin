import axios from "axios";
import { NseIndia } from "stock-nse-india";
const nseIndia = new NseIndia()
import * as cheerio from 'cheerio'
import fetch from "node-fetch";

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

export const GetStockDetails = async (req,res)=>{
    const symbol = req.params?.symbol;
    console.log("fetching data for : ---> ",symbol)

    try {
      const stockUrl = `https://www.nseindia.com/get-quotes/equity?symbol=${symbol}`; 
      const response = await axios.get(stockUrl);
      const html = response.data;
      const $ = cheerio.load(html);
      const price = $('#quoteLtp');
      console.log("-----",price)
       
        // let r = await fetch(`https://www.nseindia.com/api/quote-equity?symbol=TCS`)
        // a = await r?.json();
        // console.log(a);
        // const resp = await nseIndia.getEquityDetails(symbol);
        return response;
    } catch (err) {
        throw Error(err);
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
        console.log(data[0].data);
        return res.send({ data: data });

    } catch (err) {
        throw Error(err);
    }
}


async function GetTopNiftyGainers(limit) {
    try {
     const gainersUrl = 'https://www.moneycontrol.com/stocks/marketstats/nsegainer/index.php'; 

      const response = await axios.get(gainersUrl);
      const html = response.data;
      const $ = cheerio.load(html);
      const tb = $('.bsr_table > table > tbody');
      const topGainers = [];
      const set = new Set();

      tb.find('tr').each((index, element) => {
        if(limit == topGainers.length){
            return topGainers;
        }
        const row = $(element); 
        const linkHref = row.find('td').find("> span > h3 > a").attr('href');
        let hrefArr = linkHref?.split("/")
        const name = row.find('td:eq(0)').find('> span > h3 > a').text();
        const lastPrice = row.find('td:eq(3)').text(); 
        const change = row.find('td:eq(5)').text(); 
        const pchange = row.find('td:eq(6)').text(); 
        if(name.length > 0 && !set.has(name)){
            set.add(name)
            let shortSymbol = hrefArr[hrefArr.length -1];

            let ssCopy = "";

            for(let i in shortSymbol){
                if(!isNumber(shortSymbol[i])){
                    ssCopy += shortSymbol[i];
                }
            }

            topGainers.push({
                lastPrice:lastPrice,
                change:change,
                symbol:name,
                pChange:pchange,
                shortSymbol:ssCopy
            });
        }
      });
      return topGainers
    
    } catch (error) {
      console.error('Error:', error);
    }
  }

  function isNumber(char) {
    return /^\d$/.test(char);
  }

  async function GetTopNiftyLoosers(limit) {
    const loosersUrl = 'https://www.moneycontrol.com/stocks/marketstats/nseloser/index.php'; 

    console.log("scrapping loosers")
    try {
      const response = await axios.get(loosersUrl);
      const html = response.data;
      const $ = cheerio.load(html);
      const tb = $('.bsr_table > table > tbody');
      const topLoosers = [];

      const set = new Set();

      tb.find('tr').each((index, element) => {
        if(limit == topLoosers.length){
            return topLoosers;
        }
        const row = $(element); 
        const name = row.find('td:eq(0)').find('> span > h3 > a').text();
        const lastPrice = row.find('td:eq(3)').text(); 
        const change = row.find('td:eq(5)').text(); 
        const pchange = row.find('td:eq(6)').text(); 
        const linkHref = row.find('td').find("> span > h3 > a").attr('href');
        let hrefArr = linkHref?.split("/")

        if(name.length > 0 && !set.has(name)){
            set.add(name)
            let shortSymbol = hrefArr[hrefArr.length -1];

            let ssCopy = "";

            for(let i in shortSymbol){
                if(!isNumber(shortSymbol[i])){
                    ssCopy += shortSymbol[i];
                }
            }

            topLoosers.push({
                lastPrice:lastPrice,
                change:change,
                symbol:name,
                pChange:pchange,
                shortSymbol:ssCopy
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

    // // let res = await fetch("https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050");
    // const x = await fetch(`https://www.nseindia.com/api/equity-stockIndices?index=${encodeURIComponent("NIFTY 50".toUpperCase())}`);
    //     const d = await x.json()

    //     let indexData = d
    //     const gainers = [];
    //     const losers = [];
    //     console.log(indexData.data?.length)
    //     indexData?.data?.forEach((equityInfo) => {
    //         if (gainers.length < limit && equityInfo.pChange > 0)
    //             gainers.push(equityInfo)
    //         else if (losers.length < limit && equityInfo.pChange <= 0) {
    //             losers.push(equityInfo)
    //         } else {
    //             return true;
    //         }
    //     });

    //     const respData = {
    //         gainers: [...gainers].sort((a, b) => b.pChange - a.pChange),
    //         losers: [...losers].sort((a, b) => a.pChange - b.pChange)
    //     }
        // return respData;
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

        // const d = await nseIndia.getData("https://www.nseindia.com/api/marketStatus");
        // console.log(d);
        console.log("fetching market status ...")
        const data = await fetch("https://www.nseindia.com/api/marketStatus").then((da)=>da.json());
        const marketStatus = data?.marketState[0].marketStatus;
        console.log(marketStatus)
        if (marketStatus?.toLowerCase() == 'closed' || marketStatus?.toLowerCase() == 'close') {
            prev_status = false;
            return false;
        }
        prev_status = true;
        return true;
    } catch (err) {
        console.log("Failed to fetch market status",err)
        return prev_status;
    }
}