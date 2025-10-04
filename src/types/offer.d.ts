// types/offer.d.ts

type DiscountType = 'percentage' | 'flat'; 

export interface OfferDocument {
  _id?:string,
  code: string;
  description?: string;
  discountType:DiscountType;
  value: number;
  minOrderAmount?: number;
  appliesToCategories?:string[];
  expiresAt?: Date;
  usageLimit:number; 
  timesUsed?: number;
  active?:boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type OfferMongooseDocument = Omit<OfferDocument,'createdAt' | 'updatedAt' > ;
export interface OfferSchemaDTO extends Document, OfferMongooseDocument {}

// type for incoming offer data transfer document used when creating or updating offers
export interface OfferIncomingDTO{
  code:string,
  description?:string,
  discountType:DiscountType,
  value:number,
  minOrderAmount?:number,
  appliesToCategories?:string[],
  expiresAt?:Date | null,
  usageLimit:number,
  __v?:number
}