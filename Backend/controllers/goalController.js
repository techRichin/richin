import UserModel from '../models/User.js';
import axios from 'axios';
import mongoose from 'mongoose';
import Goal from "../models/GoalTable.js"
import GoalAssets from "../models/GoalAssestTable.js"
import AssetModel from '../models/PurchasedAssets.js';

    class GoalController{

    static createGoal = async (req, res) => {
       const {goalAssets , goalDetails} = req.body;

       if(!req.user?._id){
        return res.json({status:400,message:"User id not provided"})
       }

       const goal = {
        userId: req.user?._id,
        ...goalDetails
       }

       const newGoal = new Goal(goal);
       const result = await newGoal.save();

       const transformedAssets = [];
       let totalGoalAmount = 0;
       goalAssets?.forEach((asset)=>{
        totalGoalAmount += asset?.purchase * asset?.quantity;
        transformedAssets.push({
            ...asset,
            goalId:result
        })
       });

       console.log("total goal amt : ",totalGoalAmount)
       const user = await UserModel.findById(goal?.userId)
       user.availableTokens = 50000
       
       if(!user){
        return res.json({status:400,message:"Something went wrong"})
       }
       if(user.availableTokens - totalGoalAmount <= 0){
        return res.json({status:400,message:"Insufficient balance"})
       }

       user.availableTokens -= totalGoalAmount;
       user.save();


       await GoalAssets.insertMany(transformedAssets)

       return res.json({status:200,message:"Goal created successfully"})
    }

    static getGoals = async (req,res)=>{

        if(!req.user?._id){
            return res.json({status:400,message:"User id not provided"})
        }
        const result = await Goal.find().where('_userId').in([req.user._id]).exec();
        return res.json({goals:result})
    }

    static  getGoalDetails = async (req,res)=>{
        console.log(req.params)
        const goalId = req.params.id;
        const goal = await Goal.findById(goalId);
        const assets = await GoalAssets.find().where('goalId').in([goalId]).exec();

        if(goal && assets){
            return res.json({
                goalDetails:{
                    ...goal?._doc,
                    name:req.user?.name
                },
                goalAssets:assets
            })
        }else return res.json({status:400,message:"Error occured"})
        

    }
}
        
export default GoalController;
