

import { CartMongooseDocument, CartItemIncomingDTO } from "../../types/cart";
import { OfferDocument } from "../../types/offer";
import { ClientSession, Types} from "mongoose";
import {
  calculateDiscountAmount,
  calculateItemPrice,
  getApplicableAndNotApplicableItems,
  getCouponApplicableCategories,
  isCouponActive,
  isCouponExpired,
  isMinOrderAmountSatisfied,
} from "../../utils/couponUtils";
import { getOfferByCode } from "./../couponService";

type ApplyCouponResult =
  | { success: true; total: number; discountAmount: number }
  | { success: false; error: string };
  
export class COUPONSERVICES {
async applyCoupon (
  coupon: OfferDocument,
  items: CartItemIncomingDTO[],
  cartTotal: number
): Promise<ApplyCouponResult> {
  try {

    if (isCouponExpired(coupon)) {
      return { success: false, error: "Coupon has expired" };
    }
    if (!isCouponActive(coupon)) {
      return { success: false, error: "Coupon is inactive" };
    }

    // Check minimum order amount if specified
    if (!isMinOrderAmountSatisfied(coupon, cartTotal)) {
      return {
        success: false,
        error: "Cart total does not meet minimum order amount for coupon",
      };
    }

    // clean up applies to categories by removing empty or null entries
    const couponValidCategories = getCouponApplicableCategories(coupon);

    //  get applicable and not applicable items
    const { applicableItems, nonApplicableItems } =
      getApplicableAndNotApplicableItems(couponValidCategories, items);
    if (applicableItems.length === 0) {
      return { success: false, error: "Coupon not valid for these items" };
    }

    let applicableTotal = 0;
    applicableItems.forEach((item) => {
      applicableTotal += calculateItemPrice(item);
    });

    let nonApplicableTotal = 0;
    nonApplicableItems.forEach((item) => {
      nonApplicableTotal += calculateItemPrice(item);
    });

    // apply discount base on percentage and flat
    const { finalAmount, discountAmount } = calculateDiscountAmount(
      coupon,
      applicableTotal
    );

    const total = finalAmount + nonApplicableTotal;
    return { success: true, total, discountAmount };
  } catch (err: any) {
    return { success: false, error: err.message || "unknown error" };
  }
};




// this utils function is used to apply coupon when is there is any update in cart


async applyCouponInside  (
  cart:CartMongooseDocument,
  session?: ClientSession
) {
  try {
    if (!cart.coupon?.length) {
      cart.finalTotal = cart.total;
      return cart;
    }

    // check in parallel manner whether coupons present in cart available or not in db
    const validCoupons = await Promise.all(
      cart.coupon.map((c) => getOfferByCode(c.code, session))
    );

    let total = cart.total;
    let appliedCoupons = [];

    for (let i = 0; i < validCoupons.length; i++) {
      const coupon = validCoupons[i];
      if (!coupon || !coupon.active || coupon.expiresAt < new Date()) continue;
      const result = await this.applyCoupon(coupon, cart.items as CartItemIncomingDTO[], total as number);
      if (result.success) {
        total = result.total;
        appliedCoupons.push({
          code: coupon.code,
          discountAmount: result.discountAmount,
          percentage: coupon.value,
        });
      }
    }
    cart.finalTotal = total;
    cart.coupon = appliedCoupons;
    return cart;
  } catch (error) {
    console.error("Error applying coupon inside:", error);
    throw error;
  }
};
}