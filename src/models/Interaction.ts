import mongoose from "mongoose";
import { InteractionDocumentDTO } from "../types/interaction";

const InteractionModel = new mongoose.Schema<InteractionDocumentDTO>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    action: {
      type: String,
      enum: ["view", "purchase", "addCart"],
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
  },
  { timestamps: true }
);

const Interaction = mongoose.model<InteractionDocumentDTO>("Interaction", InteractionModel);
export default Interaction;
