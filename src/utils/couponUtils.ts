import { OfferDocument } from "../types/offer";
import { CartItemIncomingDTO } from "../types/cart";

export const isCouponExpired = (coupon:OfferDocument):boolean =>{
    return !coupon.expiresAt || new Date(coupon.expiresAt).getTime() < Date.now();
};

export const isCouponActive = (coupon:OfferDocument):boolean =>{
    return coupon.active === true;
}

export const isMinOrderAmountSatisfied = (coupon:OfferDocument,cartTotal:number):boolean=>{
    return !coupon.minOrderAmount || cartTotal >=coupon.minOrderAmount
}

export const getCouponApplicableCategories = (coupon:OfferDocument):string[] =>{
    return (coupon.appliesToCategories || []).filter(Boolean);
}

    // handle both cases if coupon donot have any category or coupon have categories
export const getApplicableAndNotApplicableItems = (couponCategories:string[],items:CartItemIncomingDTO[])=>{
    const applicableItems:CartItemIncomingDTO[] = [];
    const nonApplicableItems:CartItemIncomingDTO[] = [];
    items.forEach((item)=>{
        if(couponCategories.length === 0 || couponCategories.includes(item.categoryOfProduct)){
            applicableItems.push(item);
        }else{
            nonApplicableItems.push(item)
        }
    });

    return {applicableItems,nonApplicableItems};

}

export const calculateItemPrice = (item:CartItemIncomingDTO):number=>{
const priceAfterDiscount = item.variant.priceAfterDiscount || item.variant.price
return priceAfterDiscount * item.quantity;
}

export const calculateDiscountAmount = (coupon:OfferDocument,
    applicableTotal:number
):{finalAmount:number;discountAmount:number}=>{
    if(coupon.discountType === 'flat'){
        const discountAmount = coupon.value;
        const finalAmount = applicableTotal - discountAmount;
        return { finalAmount,discountAmount}
    }
    if(coupon.discountType === 'percentage'){
        const discountAmount = (applicableTotal * coupon.value) / 100;
        const finalAmount = applicableTotal - discountAmount;
         return { finalAmount, discountAmount };
    }
     return { finalAmount: applicableTotal, discountAmount: 0 };
}
