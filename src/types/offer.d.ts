// types/offer.d.ts

type DiscountType = 'percentage' | 'flat'; 

export interface OfferDocument {
  _id:string,
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

type Offer = OfferDocument & {
  // Additional methods or properties can be added here
};
// version of form input fields for frontend

export interface OfferFormValues {
  code:string,
  description?:string,
  discountType:DiscountType,
  value:number,
  minOrderAmount?:number,
  appliesToCategories?:string,
  expiresAt:string;
  usageLimit:number,
}