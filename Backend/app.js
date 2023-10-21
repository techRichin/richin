import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cors from 'cors';
import connectDB from './config/connectdb.js'
import userRoutes from './routes/user.js'
import watchlistRoutes from './routes/watchlist.js'
import assetRoutes from './routes/assets.js'
import transactionRoutes from './routes/transactions.js'
import stockRoutes from './routes/stock.js'
import http from 'http';
import {handleSocket} from './socket/socketHandler.js'
import checkUserAuth from './middlewares/auth-middleware.js';
import GoalController from './controllers/goalController.js';
import { GetStockDetails } from './controllers/stockController.js';
import fs from 'fs'
import https from 'https'
// constants
const PORT = process.env.PORT
const DATABASE_URL = process.env.DATABASE_URL
const app = express();


const IS_HTTPS = false;

//middlewares
app.use(cors())
app.use(express.json());

app.get('/',async (req,res)=>{
    return res.send("RitchIn server ready");
});

//Routes
app.use("/api/user", userRoutes);
app.use("/api/watchlist",checkUserAuth,watchlistRoutes)
app.use("/api/assets",checkUserAuth,assetRoutes);
app.use("/api/transactions",checkUserAuth,transactionRoutes);
app.post("/api/goal/create",checkUserAuth,(req,res) => GoalController.createGoal(req,res))
app.get("/api/goals",checkUserAuth,(req,res)=>GoalController.getGoals(req,res));
app.get("/api/getStockDetails/:symbol",checkUserAuth,(req,res)=>GetStockDetails(req,res));
app.get("/api/goal/getGoalDetails/:id",checkUserAuth,(req,res)=>GoalController.getGoalDetails(req,res));
app.get("/api/goal/getGoalDetails",checkUserAuth,(req,res) => GoalController.getGoalDetails(req,res));
// app.use("/api/stock",stockRoutes);

let server;

if(IS_HTTPS){
  server = https.createServer({key:fs.readFileSync('./ssl/key.pem','utf8'),
  cert:fs.readFileSync('./ssl/server.crt','utf8'),},app);
}else{
  server = http.createServer(app); // Add this
}

server.listen(PORT, () => {
  console.log(`Server listening at ${process.env.BACKEND_URL}:${PORT}`)
  handleSocket(server);
  connectDB(DATABASE_URL);
  // processDataChange();
});

