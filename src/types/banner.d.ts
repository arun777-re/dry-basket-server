import { Document } from "mongoose";

export interface BannerIncomingDTO {
    bannerImage:string;
    title?:string;
    description?:string;
    couponValue?:string;
    _id?:string;
    createdAt?:Date;
}

export interface BannerSchemaDTO extends Document,BannerIncomingDTO{}


export type UpdateQueryDTO = Omit<BannerIncomingDTO,"bannerImage">