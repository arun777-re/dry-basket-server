import mongoose from "mongoose";
import { InteractionDocumentDTO } from "../types/interaction";

const InteractionModel = new mongoose.Schema<InteractionDocumentDTO>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    action: {
      type: String,
      enum: ["view","purchase", "addCart","addToWishlist"],
      required: true,
    },
    productId: [{
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    }],
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      required:false,
      ref: "Category",
    },
    weight:{
      type:Number,
      required:true,
      index:true,
    }
  },
  { timestamps: true }
);

const Interaction = mongoose.model<InteractionDocumentDTO>("Interaction", InteractionModel);
export default Interaction;
