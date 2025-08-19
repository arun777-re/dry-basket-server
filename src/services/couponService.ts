import { ClientSession } from "mongoose";
import { Offer } from "../models";


export const getOfferByCode = async(code:string,session?:ClientSession)=>{
    try {
        const safecode = code.trim();
        const couponInfo = await Offer.findOne({code:safecode},{session});
        return couponInfo;
    } catch (error) {
        console.error('Error during fetch offer by code',error);
        throw new Error('Error during fetch offer by code');
    }
}

// update times of use of coupon after successfully applied on cart
export const increaseUsageCountOfCoupon = async(couponId:string,session?:ClientSession) =>{
    try {
        const updateCoupon =  await Offer.findByIdAndUpdate(couponId, {
              $inc: {
                timesUsed: 1,
              }
            },{session});
            return updateCoupon;
    } catch (error) {
          console.error('Error during increment offer usage ',error);
        throw new Error('Error during increment offer usage');
    }
}