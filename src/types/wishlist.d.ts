import { Document, Types } from "mongoose";
import { ProductOutgoingRequest } from "./product";

export interface WishlistIncomingDTO {
    productId:Types.ObjectId | string;
    userId:Types.ObjectId | string;
}

export interface WishListSchemaDTO extends WishlistIncomingDTO , Document {

}

export interface WishlistOutgoingDTO extends WishlistIncomingDTO {
    productId:ProductOutgoingRequest
}