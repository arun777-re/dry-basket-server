import { Types, Document } from "mongoose";

// --- Shared / Core Types ---

export interface CommonVariantDTO {
  weight: number;
  price: number;
  priceAfterDiscount?:number;
}

export interface CouponInfoDTO {
  code: string;
  discountAmount: number;
  percentage: number;
}

// --- Incoming (write) DTOs ---

export interface CartItemIncomingDTO {
  productId: string; // string from client
  categoryOfProduct: string;
  quantity: number;
  variant: CommonVariantDTO;
  addedAtPrice: number;
  subtotal?: number; // could be computed
}

export interface CartIncomingDTO {
  userId: string;
  items: CartItemIncomingDTO[];
  total?: number; // optional, service can compute
  coupon?: CouponInfoDTO[];
  finalTotal?: number; // optional, computed
}

// --- Document / Persistence shapes ---

export interface CartItemOutgoingDTO {
  productId: Types.ObjectId;
  categoryOfProduct: string | Types.ObjectId;
  quantity: number;
  variant:CommonVariantDTO;
  addedAtPrice: number;
  subtotal: number;
}

export interface CartOutoingDTO {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  items: CartItemOutoingDTO[];
  total: number;
  coupon?: CouponInfoDTO[]; // allow multiple if needed
  finalTotal: number;
  totalWeight:number;
  createdAt?: Date;
  updatedAt?: Date;
  __v?: number;
}

export interface CartMongooseDocument extends Document, CartOutoingDTO {}

// --- Outgoing / Populated DTOs ---



export interface PopulatedProductInfo {
  _id: string;
  images: string[];
  productName: string;
}

export interface PopulatedCartItemDTO {
  productId: PopulatedProductInfo; // populated
  categoryOfProduct: string;
  quantity: number;
  variant:CommonVariantDTO;
  addedAtPrice: number;
  subtotal: number;
}

export interface PopulatedCartDTO {
  _id: string;
  userId:string;
  items: PopulatedCartItemDTO[];
  total: number;
  variant:CommonVariantDTO;
  coupon?: CouponInfoDTO[];
  finalTotal: number;
  totalWeight:number;
  createdAt?: Date;
  updatedAt?:Date;
  __v?:number;
}
