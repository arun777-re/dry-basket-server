import { Document, Types } from "mongoose";

export interface IncomingOrOutgoingInteractionDTO {
  userId: Types.ObjectId | string;
  productId: Types.ObjectId[] | string[];
  action: "view" | "purchase" | "addCart" | "addToWishlist";
  categoryId?:Types.ObjectId | string;
  weight:number;
}

export interface InteractionDocumentDTO
  extends IncomingOrOutgoingInteractionDTO,
    Document {}
