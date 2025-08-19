import mongoose, { Types } from "mongoose";
import { OrderSchemaDTO } from "../types/order";

const orderSchema = new mongoose.Schema<OrderSchemaDTO>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: true,
    },
    shippingDetails: {
      country: {
        type: String,
        required: true,
      },
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      appartment: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      pinCode: {
        type: String,
        required: true,
      },
    },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"],
      default: "PENDING",
    },
    amount:{type:Number,required:true},
    currency:{type:String,required:true},
    receipt:{type:String,required:false},
    notes:[{type:String,required:false}],
    razorpayOrderId:{type:String,required:true}
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, status: 1 });

const Order =
  mongoose.models.Order || mongoose.model<OrderSchemaDTO>("Order", orderSchema);

export default Order;
