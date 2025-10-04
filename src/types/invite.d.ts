import { Document, Types } from "mongoose";

export type InviteIncomingDTo = {
  code: string;
  isUsed: boolean;
  createdAt: Date;
  usedAt?: Date;
}


export interface InviteSchemaDTO extends Document,InviteIncomingDTo{};

export interface InviteOutgoingDTO extends InviteIncomingDTo {
    _id:string | Types.ObjectId;
}