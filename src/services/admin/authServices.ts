import mongoose from "mongoose";
import Agent, { AgentDocument } from "../../models/AgentSchema";
import { AdminProps, AdminSchemaDTO} from "../../types/admin";
import { cacheKeyToGetAdmin } from "../../utils/cacheKeyUtils";
import { cacheServices } from "../redis/cache";



export class AdminAuthClaa {
   async checkWhetherIsFirstAdmin():Promise<boolean>{
try {
    const documentcount = await Agent.countDocuments();
    if(documentcount === 0) return true;
    return false;
} catch (error) {
       console.error("Error during count Agent docs",error);
            throw new Error("Error during count Agent docs");
}
   }

    async createAdminIfFirst(body:AdminProps){
        try {
           const newAdmin = await new Agent({
                  firstName:body.firstName,
                  lastName:body.lastName,
                  email:body.email,
                  password:body.password,
                  isMainAdmin: true,
                });

                await newAdmin.save();
                return {
                    _id:newAdmin._id
                }
        } catch (error) {
            console.error("Error during create Admin acc",error);
            throw new Error("Error during register admin");
        }
    }
    async createAdminIfNotFirst(body:AdminProps,session?:mongoose.ClientSession){
        try {
           const newAdmin = await new Agent({
                  firstName:body.firstName,
                  lastName:body.lastName,
                  email:body.email,
                  password:body.password,
                  isMainAdmin:false,
                  inviteCode:body.inviteCode
                });

                await newAdmin.save({session});
                return {
                    _id:newAdmin._id
                }
        } catch (error) {
            console.error("Error during create Admin acc",error);
            throw new Error("Error during register admin");
        }
    }
    async findAdmin(email:string,session?:mongoose.ClientSession):Promise<AgentDocument | null>{
        try {
            const isExists = await Agent.findOne({email}).session(session ? session : null);
            if(!isExists) return null;
            return isExists as AgentDocument;
        } catch (error) {
            console.error("Error during create Admin acc",error);
            throw new Error("Error during register admin");
        }
    }
    async findAdminById(adminId:string):Promise<AdminProps | null>{
         try {
            const cacheKey = cacheKeyToGetAdmin(adminId);
            const cachedResponse = await cacheServices.get<AdminProps>(cacheKey)
            if(cachedResponse) return cachedResponse as AdminProps;
            const isExists = await Agent.findById(adminId).select("-password").lean<AdminProps>();
            if(!isExists) return null;
            await cacheServices.set<AdminProps>(cacheKey,isExists,60 * 5)
            return isExists as unknown as AdminProps;
        } catch (error) {
            console.error("Error during create Admin acc",error);
            throw new Error("Error during register admin");
        }
    }
    async findAdminByIdForDbOperation(adminId:string):Promise<AdminSchemaDTO | null>{
         try {
            const isExists = await Agent.findById(adminId).select("-password");
            if(!isExists) return null;
            return isExists as unknown as AdminSchemaDTO;
        } catch (error) {
            console.error("Error during create Admin acc",error);
            throw new Error("Error during register admin");
        }
    }
}