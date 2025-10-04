import { Document, Types } from "mongoose";

export interface AdminProps {
    firstName:string;
    lastName:string;
    email:string;
    password:string;
    inviteCode?:string | Types.ObjectId;
    isMainAdmin?:boolean;
}


export interface AdminSchemaDTO extends Document,AdminProps{}