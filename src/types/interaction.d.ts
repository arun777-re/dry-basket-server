import { Document, Types } from "mongoose";

export interface IncomingOrOutgoingInteractionDTO {
  user: Types.ObjectId | string;
  product: Types.ObjectId | string;
  action: "view" | "purchase" | "addCart";
}

export interface InteractionDocumentDTO
  extends IncomingOrOutgoingInteractionDTO,
    Document {}
