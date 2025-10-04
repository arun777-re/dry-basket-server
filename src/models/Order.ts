import mongoose from "mongoose";
import { OrderSchemaDTO } from "../types/order";

const orderSchema = new mongoose.Schema<OrderSchemaDTO>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: true,
    },
   cartItems: [
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    categoryOfProduct: { type: String, required: true },
    quantity: { type: Number, required: true },
    variant: { type: mongoose.Schema.Types.Mixed }, // or a sub-schema
    addedAtPrice: { type: Number, required: true },
    subtotal: { type: Number },
  },
],
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
      phone:{
        type:String,
        required:true,
      }
    },
    orderStatus: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"],
      default: "PENDING",
    },
    paymentStatus:{
      type:String,
      enum:["PENDING","COMPLETED","FAILED"],
      default:"PENDING"
    },
    blogsAgree:{type:Boolean,required:false},
    amount:{type:Number,required:true},
    shippingCharges:{type:Number,required:true,default:0},
    currency:{type:String,required:true},
    receipt:{type:String,required:false},
    notes:[{type:String,required:false}],
    razorpayOrderId:{type:String,required:true},
    paymentId:{type:String,required:false},
    paymentType:{type:String,default:"PREPAID",
      enum:["PREPAID","COD"]  
    },
     // fields for shipmozo integration for shipping 
    courierInfo:{
    courierName:{type:String,default:null},
    courierTrackingId:{type:String,default:null},
    awbNumber:{type:String,index:true,default:null},
    estimatedDeliveryDate:{type:Date,default:null},
    shipmentOrderId:{type:String,default:null}
  },
  trackingHistory:[{
    status:{type:String,required:true},
    location:{type:String,required:true},
    timeStamp:{type:Date,default:Date.now},
  }]
  },
 
  { timestamps: true,optimisticConcurrency:true }
);

orderSchema.index({ userId: 1, status: 1 });

const Order =
  mongoose.models.Order || mongoose.model<OrderSchemaDTO>("Order", orderSchema);

export default Order;
