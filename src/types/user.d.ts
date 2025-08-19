import { Document } from "mongoose";

// for incoming data
export interface UserProps{
    _id?:string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isActive?: boolean;
  phone: number;
  comparePassword?(candidatePassword: string): Promise<boolean>;
  __v?:number;
}

export interface UserDocument extends Document,UserProps{
    comparePassword(candidatePassword:string):Promise<boolean>;
}
