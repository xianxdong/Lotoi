const mongoose = require("mongoose");
require("dotenv").config();


let isConnected = false;

async function connectMongoose(){

    if (isConnected){
        return mongoose;
    }
        
    const uri = process.env.MONGODB_URI;
    const dbName = `${process.env.MONGODB_NAME}_${process.env.DEPLOYMODE_MODE}`;

    if (!uri){
        throw new Error("MONGO_URI is not set");
    };

    await mongoose.connect(uri, { dbName });
    isConnected = true;
    console.log(`[Mongo] Connected via Mongoose to ${dbName}`);
    return mongoose;

};

async function closeMongoose(){

    if (!isConnected){
        return;
    }

    await mongoose.connection.close();
    isConnected = false;
    console.log("[Mongo] Connection closed");

};


module.exports = { connectMongoose, closeMongoose };