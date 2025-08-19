import { PopulatedCartDTO, CartMongooseDocument, CartItemIncomingDTO, CartIncomingDTO } from "../../types/cart";
import { OfferDocument } from "../../types/offer";
import { Cart} from "../../models";
import { cartItemSchema } from "../../validations/cart.validation";
import mongoose, { ClientSession, Types} from "mongoose";
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

// first case if coupon is applied and second case we are handling in cart pre to calculate variant base discount and calculate subtotal
// if coupon is applied then find categories of products which match categories of coupon then calculate discount
// and also calculate total of products who are out of coupon scope then do it same as second case in first case

export class SimpleCartServices {
// services function to validate coming data into cart
async validateCartItems(cartItems:CartItemIncomingDTO[] | CartIncomingDTO) {
  try {
    const normalizedCartItems = Array.isArray(cartItems) ? cartItems : [cartItems]
    const validatedItems = await Promise.all(normalizedCartItems.map((item)=>(cartItemSchema.validate(item, {
      abortEarly: false,
      stripUnknown: true,
    }))));
    return validatedItems;
  } catch (error) {
    console.error("Error during validate cartItems", error);
    throw new Error("Error during validate cartItems");
  }
};
// check whether cart exists or not with userId
async getCartByUserId ({userId,session}:{
  userId: string,
  session?: ClientSession,
}
):Promise<CartMongooseDocument | null>{
  try {
     const cart = await Cart.findOne({userId}).session(session || null);
    return cart ? (cart as unknown as CartMongooseDocument) : null;
  } catch (error) {
    console.error(`Error finding cart by userId:${userId}`, error);
    throw new Error("Failed to fetch cart.");
  }
};
// check whether cart exists or not with userId and return populated cart
async getPopulatedCartByUserId ({userId,session}:{
  userId: string,
  session?: ClientSession,
}
):Promise<PopulatedCartDTO | null>{
  try {
    const baseQuery = Cart.findOne({userId}).session(session || null);
  const  populatedCart = await baseQuery
      .populate("items.productId", "productName images variant").lean();
    return populatedCart ? populatedCart as unknown as PopulatedCartDTO : null;
  } catch (error) {
    console.error(`Error finding cart by userId:${userId}`, error);
    throw new Error("Failed to fetch cart.");
  }
};

}

// // remove item from cart using cart id
// export const removeCouponFromCart = async ({
//   cartId,
//   expectedVersion,
//   session,
// }: {
//   cartId: string;
//   expectedVersion: number;
//   session: ClientSession;
// }) => {
//   try {
//     const removeCart = await Cart.findByIdAndUpdate(
//       { _id: cartId, __v: expectedVersion },
//       {
//         $unset: { coupon: "" },
//         $inc: { __v: 1 },
//       },
//       { new: true, session }
//     );
//     if (!removeCart) {
//       throw new Error(
//         "Concurrent modification detected. Retry your operation."
//       );
//     }
//     return removeCart;
//   } catch (error) {
//     console.error("Error updating cart:", error);
//     throw new Error("Failed to update cart/ remove coupon from cart.");
//   }
// };






