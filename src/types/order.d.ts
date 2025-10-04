import { Document, Types } from "mongoose";
import { CartItemIncomingDTO, PopulatedCartDTO, PopulatedCartItemDTO } from "./cart";

export interface ShippingDetailsDTO {
    country:string;
    firstName:string;
    lastName:string;
    address:string;
    appartment:string;
    city:string;
    state:string;
    pinCode:string;
    phone:number;
}

export interface CourierInfoDTO {
  courierName:string,
    courierTrackingId:string,
    awbNumber:string,
    estimatedDelieveryDate:Date,
    shipmentOrderId:string;
}

export type TrackingHistory = {
  status:string;
  location:string;
  timeStamp:Date;
}

export interface OrderIncomingReqDTO {
  _id?:string | Types.ObjectId;
   userId:string | Types.ObjectId;
   cartId:string | Types.ObjectId;
   cartItems:PopulatedCartItemDTO[];
   shippingDetails:ShippingDetails;
   orderStatus:string;
   amount:number;
   currency:string;
   receipt?:string;
   notes?:string[];
   shippingCharges:number;
   razorpayOrderId:string;
   paymentStatus?:string;
   paymentId?:string;
   paymentType?:string;
   courierInfo?:CourierInfoDTO;
    trackingHistory?:TrackingHistory[];
    blogsAgree:boolean;
    createdAt?:Date | string;
    updatedAt?:Date | string;
    __v:number;
}


export interface PopulatedOrderWithCartDTO extends OrderIncomingReqDTO{
     cartId:PopulatedCartDTO;
     userId:{
      email:string;
     }
}

export type ORDERAPICACHERESDTO = {
  orderId:string;
  courierId:string;
}
export interface OrderSchemaDTO extends Document,OrderIncomingReqDTO{} 