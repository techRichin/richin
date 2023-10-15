import mongoose from "mongoose";

// Defining Schema
const chatSchema = new mongoose.Schema({
  id:{type:Number},
  totalChats: { type: Number},
  limit:{type:Number},
  date:{
    type: String }
});

// Model
const ChatsModel = mongoose.model("chats", chatSchema)
export default ChatsModel

