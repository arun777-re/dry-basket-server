import mongoose from "mongoose";
import InviteCode from "../../models/InviteCode";
import { InviteSchemaDTO } from "../../types/invite";


export class InviteCodeClass{
    async checkWhetherCodeIsUsed(code:string,session:mongoose.ClientSession):Promise<InviteSchemaDTO | null>{
      try {
            const isExists = await InviteCode.findOne({code}).session(session);
            if(!isExists || isExists.isUsed) return null;
            return isExists as unknown as  InviteSchemaDTO;
            
        } catch (error) {
            console.error("Error during check whether code is used or not",error);
            throw new Error("Error during check whether code is used or not");
        }
    }
}