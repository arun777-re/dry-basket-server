import { Request } from "express";
import { UserDocument } from "./user";
import { AdminProps } from "./admin";
export interface CustomReq extends Request{
  user?:UserDocument;
  admin?:AdminProps;
}