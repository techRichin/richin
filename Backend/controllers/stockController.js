import axios from "axios";
import { NseIndia } from "stock-nse-india";
const nseIndia = new NseIndia()
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

    try {
        
        const resp = await nseIndia.getEquityDetails(symbol);
        return res.json(resp);
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




export const getGainersAndLoosers = async(limit) => {
    try{

    // let res = await fetch("https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050");
    const d = await fetch(`https://www.nseindia.com//api/equity-stockIndices?index=${encodeURIComponent("NIFTY 50".toUpperCase())}`).then((data)=>data.json())

        let indexData = d
        const gainers = [];
        const losers = [];
        console.log(indexData.data?.length)
        indexData?.data?.forEach((equityInfo) => {
            if (gainers.length < limit && equityInfo.pChange > 0)
                gainers.push(equityInfo)
            else if (losers.length < limit && equityInfo.pChange <= 0) {
                losers.push(equityInfo)
            } else {
                return true;
            }
        });

        const respData = {
            gainers: [...gainers].sort((a, b) => b.pChange - a.pChange),
            losers: [...losers].sort((a, b) => a.pChange - b.pChange)
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

        // const d = await nseIndia.getData("https://www.nseindia.com/api/marketStatus");
        // console.log(d);
        console.log("fetcing market status ...")
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