import { Types } from "mongoose";

export interface ShippingDetailsDTO {
    country:string;
    firstName:string;
    lastName:string;
    address:string;
    appartment:string;
    city:string;
    state:string;
    pinCode:string;
}

export interface OrderIncomingReqDTO {
   userId:string | Types.ObjectId;
   cartId:string | Types.ObjectId;
   shippingDetails:ShippingDetails;
   status:string;
   amount:number;
   currency:string;
   receipt?:string;
   notes?:string[];
   razorpayOrderId:string;
}

export interface OrderSchemaDTO extends Document,OrderIncomingReqDTO{} 