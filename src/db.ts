import mongoose from "mongoose";
const uri = process.env.MONGO_URI || '';

export const dbConnect = async ()=>{
    try {
        if(mongoose.connection.readyState > 1){
            console.log("Already connected to the database");
            return;
        }else if(mongoose.connection.readyState === 1){
            console.log("Reusing existing database connection");
            return;
        }else if(mongoose.connection.readyState === 0){
            console.log("Connecting to the database...");
            await mongoose.connect(uri)
        }
    } catch (error) {
        console.error("Database connection error:", error);
        throw error;
        
    }
}