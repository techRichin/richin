import { Server } from "socket.io";
import { StockDataHandler } from "./socketController.js";
import { getGainersAndLoosers, isMarketOpen } from "../controllers/stockController.js";
import stocksocket from "stocksocket"
import { getTopCryptos } from "./crypto.js";

const createSocketServer = (server) => {
    const io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });
    return io;
}
let io;
export const handleSocket = (server) => {
    io = createSocketServer(server);
    console.log("Socket connection established")
    listenSocketEvents(io);
}

var userToCroptosMap = {};


// 1) when the client needs a particular stock price He well join the particular socket room
// 2) if market is open then for all the room names (stock symbols) we will listen to the price change else we will return the last price of the stock
// 3) when the price changes we will emit the new stock data to that room
// 4) when the client does not want the stock data just leave the room


function sleep(millis){
 
    var date = new Date();
    var curDate = null;
    do { curDate = new Date(); }
    while(curDate-date < millis);
}

let temptickers = []


// setInterval(()=>{
//     temptickers = [];
// },20000);

const filter= (string)=>{
    for(let i = 0;i<string?.length;i++){
        if(/\d/.test(string[i])){
            return false
        }
    }
    return string;
}

setInterval(async () => {
    const tickers = io.of("/").adapter.rooms;
    const marketStatus = await isMarketOpen();
    if(!marketStatus){
        console.log("market is closed")
        return;
    }

    for (let [key, value] of tickers) {
        const filteredData = filter(key)
        if(filteredData && !temptickers.includes(filteredData+".NS")){
            temptickers.push(filteredData?.toUpperCase() + ".NS");
        }
    }

    console.log("temp tickers :",temptickers)
    if (temptickers.length > 0 && marketStatus) {
        stocksocket.removeAllTickers();
        sleep(2000);
        stocksocket.addTickers(temptickers, (newPrice) => {
            console.log("Price changed for : ", newPrice);
            io.to(newPrice.id?.split(".")[0]).emit("PRICE_CHANGED", newPrice);
        });
    }else{
        // console.log("market is close")
    }
}, 10000)



const listenSocketEvents = (io) => {

    try {

        io.on("connection", async (socket) => {
            console.log(socket.id)
            const handler = new StockDataHandler(socket);
            // listening to events 
            console.log("00000")
            socket.on("GET_STOCK_DATA", (payload, cb) => {
                handler.GetStockDataStream(payload, cb)
            });

            // socket.on("SUBSCRIBE_CRYPTOS", (payload, cb) => addValueToKey(payload.UID, payload.cryptos))
            // socket.on("UNSUBSCRIBE_CRYPTOS", (payload, cb) => delete userToCroptosMap[payload.UID]);
            socket.on('disconnect', () => {
                console.log('socket disconnected');
            });
        });


        // Getting the list of trending stocks
        setInterval(async() => {
            console.log("broadcasting....")
            const gainerLoosers = await getGainersAndLoosers(7);
            if(gainerLoosers.gainers.length > 0){
                console.log("broadcast stocks")
                io.sockets?.emit("TRENDING_STOCKS",gainerLoosers);
            }
            io.sockets?.emit("TRENDING_CRYPTOS", await getTopCryptos(6));
        }, 10000);

        

        io.on("disconnect", () => {
            console.log('client disconnected');
        });
    } catch (err) {
        console.log("Error while socket client connection")
    }
}

