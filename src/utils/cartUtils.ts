import { ClientSession, Types } from "mongoose";
import {CartItemIncomingDTO, CartMongooseDocument, PopulatedCartItemDTO} from "../types/cart";
import { ProductBusinessService } from "../services/productService";

const productserviceclass = new ProductBusinessService();
// utility to merge items
export const mergeCartItems = (userItems:CartItemIncomingDTO[],guestItems:CartItemIncomingDTO[]) =>{
    guestItems.forEach((guestItem)=>{
        const existing = userItems.find(item => item.productId === guestItem.productId);
        if(existing){
            existing.quantity += guestItem.quantity;
        }else{
            userItems.push(guestItem);
        }
    });
    return userItems;
}

export const validateId = (id:string)=>{
 if(!id || !Types.ObjectId.isValid(id)){
  return false;
 }
 return true;
}


// verify product utils if exits or not
export const verifyProductExistsInCartController = async({items}:{
items:CartItemIncomingDTO[],
}):Promise<{success:boolean;message?:string}>=>{
  const isProduct = await Promise.all(
        items.map(item=>productserviceclass.getProductById({
        productId: item.productId as string,
      })));

      const missingIndex = isProduct.findIndex(p=>!p);
      if(missingIndex !== -1){
        return {success:false,message:`Product does not exists:
          ${items[missingIndex].productId}`
        }
      }
        return {success:true}

}


// utils to  update cart based on incoming items
export const updateCartBasedIncomingItems = async({
  cart,items
}:{cart:CartMongooseDocument,items:CartItemIncomingDTO[]})=>{
for(const incomingItem of items){
      const isExists = cart.items.find(
        (item: any) =>
          item.productId.equals(incomingItem.productId) &&
          item.variant.weight === incomingItem.variant.weight &&
          item.variant.price === incomingItem.variant.price &&
          item.variant.priceAfterDiscount === incomingItem.variant.priceAfterDiscount
      );
      if (isExists) {
        // increase qty of Product
        isExists.quantity += incomingItem.quantity;
      } else {
        // add item to cart
        // Ensure discount is number or undefined, not null
       

        cart.items.push(incomingItem);
      }
      }
      return cart;
}