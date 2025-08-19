import { PopulatedCartDTO, CartMongooseDocument, CartItemIncomingDTO} from "../../types/cart";
import { Cart} from "../../models";
import mongoose, { ClientSession, Types} from "mongoose";

import { SimpleCartServices } from "./cart.services";

const simplecartservices = new SimpleCartServices();


export class CartCRUDServices{
// create Cart
async createCartService ({
  userId,
  items,
  session,
}: {
  userId: string;
  items: CartItemIncomingDTO[];
  session: ClientSession;
}): Promise<CartMongooseDocument>{
  try {
    const isCartExists = await simplecartservices.getCartByUserId({userId,session});
    if (isCartExists) {
      throw new Error("Cart already exists for this user");
    }
    const newCart = new Cart(
      {
        userId,
        items:items,
        __v:0
      },
    );
    await newCart.save({session});
    return newCart;
  } catch (error) {
    console.error("Error creating cart:", error);
    throw new Error("Failed to create cart.");
  }
};
// update item qty in cart
async updateItemQty({cartId,productId,delta,session}:{cartId:string,productId:string,delta:number,
  session:ClientSession
}):Promise<PopulatedCartDTO | null>{
  try {
    const updateQty =  await Cart.findOneAndUpdate(
          { _id:cartId, "items.productId": productId },
          { $inc: { "items.$.quantity": delta } },
          {session,new:true}
        ).populate('items.productId','images variant productName');
        return updateQty as unknown as PopulatedCartDTO;
  } catch (error) {
      console.error("Failed to update Qty", error);
     throw new Error(error instanceof Error ? error.message : "Unknown error occurred while updating quantity");
  }
}

// remove item from cart using cartId
async removeItemFromCartService({
  cartId,
  productId,
  session,
}: {
  cartId: string;
  productId: string;
  session: ClientSession;
}):Promise<PopulatedCartDTO | null>{
  try {
    const removeItem = await Cart.findOneAndUpdate(
      { _id: cartId },
      { $pull: { items: { productId:new mongoose.Types.ObjectId(productId) } } },
      {session ,new:true}
    ).select('-userId');

    if (!removeItem) {
      throw new Error(
        "Cart not found or item already removed."  
      );
    }

    await removeItem.populate('items.productId','images productName');
    (await removeItem.save({session})).toObject();
    return removeItem as unknown as PopulatedCartDTO;
  } catch (error) {
    console.error("Error updating cart:", error);
    throw new Error("Failed to update cart/ remove item from cart.");
    
  }
};

// update cart with cartId OCC safe with version (Optimistic Concurrency Control)
async updateCartByUserId({
  userId,
  data,
  expectedVersion,
  session,
}: {
  userId: string;
  expectedVersion: number;
  session: ClientSession;
  data?:Record<string,any>;
}): Promise<PopulatedCartDTO | null>{
  try {
   const updateQuery:any = {
    $inc:{__v:1},
   }
if(data && Object.keys(data).length > 0 ) {
  updateQuery.$set = data;
}
    const updatedCart = await Cart.findOneAndUpdate(
      { userId:userId, __v: expectedVersion },
      updateQuery
     ,
      { new: true, session }
    ).populate('items.productId','images _id productName').lean();
    if (!updatedCart) {
      throw new Error(
        "Concurrent modification detected. Retry your operation."
      );
    }
    return updatedCart as unknown as PopulatedCartDTO;
  } catch (error) {
    console.error("Error updating cart:", error);
    throw new Error("Failed to update cart.");
  }
};

// delete cart by userdId
async deleteCartByUserId(userId: string):Promise<boolean> {
  try {
    const deletedCart = await Cart.findOneAndDelete({ userId });
    if(!deletedCart) return false;
    return true;
  } catch (error) {
    console.error("Error deleting cart by userId:", error);
    throw new Error("Failed to delete cart.");
  }
};
}