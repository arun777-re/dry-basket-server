import { Document,Types } from "mongoose";
import { ReviewDocument } from "./review";


// here we use four types one is for db and one is for incoming req and one is for outgoing full req and last is for outgoing partial req

// variant schema
export interface ProductVariant {
    weight:number;
    price:number;
    stock:number;
    sold?:number;
    discount?:number;
    discountExpiry?:Date | null;
    priceAfterDiscount?:number;
}

// Outgoing (for GET, PUT, PATCH)
export interface ProductOutgoingRequest {
    _id:string;
    slug:string;
    productName:string;
    category:Types.ObjectId | string;
    status:'available' | 'unavailable';
    description:string;
    images:string[];
    isFeatured:boolean;
    avgRating?:number,
    tags:string[];
    variants:ProductVariant[];
    createdAt:Date;
    updatedAt:Date;
}

// Incoming for POST req
export type ProductIncomingRequest =  Omit<ProductOutgoingRequest ,  "_id" | "createdAt" | "updatedAt" | 'priceAfterDiscount'>


// for single product page
export interface PopulatedProduct extends ProductOutgoingRequest {
}

export interface ProductDocument extends PopulatedProduct, Document{};


export interface PaginatedResult<T> {
  products: T[];
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface SearchQuery {
  category?: string;
  price?: number;
  productName?: string;
  page?: number;
  limit?: number;
  weight?:number;
}

export interface UpdateQuery {
  tags?: string[];
  variants?: ProductVariant[];
  isFeatured?: boolean;
}