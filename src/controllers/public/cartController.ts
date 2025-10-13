import { Response } from "express";

import {
  createResponse,
  handleError,
  runWithRetryTransaction,
  sendError,
} from "../../utils/heplers";

import mongoose, { ClientSession } from "mongoose";
import {
  getOfferByCode,
  increaseUsageCountOfCoupon,
} from "../../services/couponService";
import {
  CartItemIncomingDTO,
  CartMongooseDocument,
  PopulatedCartDTO,
} from "../../types/cart";
import { CustomReq } from "../../types/customreq";
import { CartCRUDServices } from "../../services/cartServices/cartCRUD.services";
import { SimpleCartServices } from "../../services/cartServices/cart.services";
import { COUPONSERVICES } from "../../services/cartServices/cartCOUPON.services";
import { cacheServices } from "../../services/redis/cache";
import {
  updateCartBasedIncomingItems,
  validateId,
  verifyProductExistsInCartController,
} from "../../utils/cartUtils";

const simplecartservice = new SimpleCartServices();
const couponservice = new COUPONSERVICES();
const cartcrudservices = new CartCRUDServices();

export const createOrAddItemToCart = async (
  req: CustomReq,
  res: Response
): Promise<void> => {
  const userId = req?.user?._id!;
  
  // validate coming items data with yup
  const items: CartItemIncomingDTO[] =
    await simplecartservice.validateCartItems(req.body);

  // check whether coming productId exists or not
  let isProduct = await verifyProductExistsInCartController({
    items,
  
  });
  if (!isProduct.success) {
    createResponse({
      success: false,
      status: 400,
      message: isProduct.message!,
      res,
    });
    return;
  }

  try {
    const updatedCart = await runWithRetryTransaction(
      async (session: ClientSession) => {
        // check whether cart exists already
        let cart = await simplecartservice.getCartByUserId({
          userId: userId as string,
          session,
        });
        if (cart) {
          // check whether items are already in cart or deep check for the variants means same product with different variant counts as diff item in cart
          cart = await updateCartBasedIncomingItems({ cart, items });
        } else {
          cart = await cartcrudservices.createCartService({
            userId: userId as string,
            items: items,
            session,
          });
        }

        // if coupon exists then apply coupon
        await couponservice.applyCouponInside(
          cart as unknown as CartMongooseDocument,
          session
        );
        await cart.save({ session });
        const populatedcart = (await cart.populate(
          "items.productId",
          "images _id productName"
        )) as unknown as PopulatedCartDTO;
        return populatedcart;
      }
    );
    // update redis
    await cacheServices.set<PopulatedCartDTO>(
      `cart:${userId}`,
      updatedCart,
      60 * 5
    ),
      createResponse({
        status: 200,
        message: "Cart created successfully",
        success: true,
        res,
      });
    return;
  } catch (error: any) {
    if (!res.setHeader) {
      handleError(error instanceof Error ? error.message : error, res);
      return;
    }
  }
};

// controller to get cart
export const getCart = async (req: CustomReq, res: Response): Promise<void> => {
    const userId = req?.user?._id;
    if (!validateId(userId as string)) {
      await sendError({
        status: 400,
        message: `Provide appropriate userID:${userId}`,
        res,
      });
      return;
    }
  try {
    let cart: PopulatedCartDTO | null =
      await cacheServices.get<PopulatedCartDTO>(`cart:${userId}`);
    // getting cart using users id
    if (!cart) {
      cart = await simplecartservice.getPopulatedCartByUserId({
        userId: userId as string,
      });
      if (cart) {
        await cacheServices.set(`cart:${userId}`, cart, 60 * 5);
      }
    }

    if (!cart || cart?.items.length === 0 ) {
      createResponse({
        success:true ,
        status:200,
        message: "No Items in the cart",
        res,
      });
      return;
    }

    createResponse({
      success: true,
      status: 200,
      message: "Cart retrieved successfully",
      data: cart,
      res,
    });
    return;
  } catch (error) {
    if(!res.headersSent){
    handleError(error, res);
    }
    return;
  }
};

export const removeItemFromCart = async (req: CustomReq, res: Response) => {
 
    const userId = req?.user?._id;

    const { productId } = req.query;
    const safeProductId = (productId as string).trim();

    if (!validateId(userId as string) || !validateId(safeProductId)) {
      await sendError({
        status: 400,
        message: "Provide appropriate Product/User details",
        res,
      });
      return;
    }
 const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // find cart associated with userId
    const cart: any = await simplecartservice.getCartByUserId({
      userId: userId as string,
      session,
    });
    if (!cart) {
      await session.abortTransaction();
      createResponse({
        success: false,
        status: 400,
        message: "Cart not found associated with userId",
        res,
      });
      return;
    }

    // then check whether any product with productId exists in cart items array
    const productExists = cart.items.some(
      (item: CartItemIncomingDTO) =>
        item.productId.toString() === safeProductId.toString()
    );
    if (!productExists) {
      await session.abortTransaction();
      createResponse({
        success: false,
        status: 400,
        message: "No items exists in cart with productId",
        res,
      });
      return;
    }

    // remove product from cart items array
    const removeItemandupdate: PopulatedCartDTO | null =
      await cartcrudservices.removeItemFromCartService({
        cartId: cart._id,
        productId: productId as string,
        session,
      });
    if (!removeItemandupdate) {
      await session.abortTransaction();
      createResponse({
        success: false,
        status: 500,
        message: "Failed to update cart after removing item",
        res,
      });
      return;
    }

    // if coupon exists then apply coupon
      await couponservice.applyCouponInside(
        removeItemandupdate as unknown as CartMongooseDocument
      ),
    await session.commitTransaction();

      await cacheServices.set<PopulatedCartDTO>(
        `cart:${userId}`,
        removeItemandupdate,
        60 * 5
      ),
     cacheServices.get(`cart:${userId}`);
    createResponse({
      success: true,
      status: 200,
      message: "Product removed from Cart successfully",
      data: removeItemandupdate,
      res,
    });
    return;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    if (!res.setHeader) {
      handleError(error, res);
    }
    return;
  } finally {
    await session.endSession();
  }
};

// update item qty
export const adjustItemQty = async (
  req: CustomReq,
  res: Response
): Promise<void> => {
  const userId = req?.user?._id;
  const { delta, productId } = req.body;
  console.log("req,body",req.body);

  // Input validation
  if (!validateId(productId)) {
    await sendError({
      status: 400,
      message: `Provide valid userId/productId: ${userId}/${productId}`,
      res,
    });
    return;
  }

  if (typeof delta !== "number" || delta === 0) {
    await sendError({
      status: 400,
      message: `Invalid delta value`,
      res,
    });
    return;
  }

  try {
    // Run transaction with retries
    const updatedCart = await runWithRetryTransaction(
      async (session: ClientSession) => {
        // Find cart inside transaction
        const cart = await simplecartservice.getCartByUserId({
          userId: userId as string,
          session,
        });

        if (!cart) {
          throw new Error("Cart does not exist");
        }
        // Find product in cart
        const isProduct = cart.items.find(
          (item) =>
            typeof item.productId !== "string" &&
            (item.productId as mongoose.Types.ObjectId).toString() ===
              productId.toString() &&
            item.quantity + delta > 0
        );

        if (!isProduct) {
          throw new Error("Product does not exist in Cart");
        }

        // Update quantity
        isProduct.quantity += delta;

        // Save with optimistic concurrency control enabled
        await cart.save({ session });

        // Populate only needed fields
        await cart.populate({
          path: "items.productId",
          select: "images productName _id",
        });

        return cart.toObject();
      }
    );

    // Update cache after transaction commits
    await cacheServices.set<PopulatedCartDTO>(
      `cart:${userId}`,
      updatedCart,
      60 * 5
    );

    createResponse({
      success: true,
      message: "Quantity of Product Updated",
      status: 200,
      data: updatedCart,
      res,
    });
  } catch (error) {
    if (!res.headersSent) {
      handleError(error, res);
    }
    return;
  }

  console.timeEnd("fetch start");
};

// apply coupon to cart
export const applyCouponToCart = async (req: CustomReq, res: Response) => {
  const userId = req.user?.id;
    const { code } = req.query;
      const session: ClientSession = await mongoose.startSession();
  session.startTransaction(); 
  try {
  
    // basic validation
    if (!code || !validateId(userId)) {
      await sendError({
        status: 400,
        message: "Value of code/id not provided",
        res,
        session,
      });
      return;
    }

    const cart = await simplecartservice.getCartByUserId({
      userId: userId!,
      session,
    });
    if (!cart) {
      await sendError({
        status: 400,
        message: "Cart does not exists",
        res,
        session,
      });
      return;
    }

    // find that the coupon is exists or not
    const isCoupon = await getOfferByCode(code as string, session);
    if (!isCoupon || isCoupon.value <= 0) {
      await sendError({
        status: 400,
        message: "Coupon not found/value must be greater than 0",
        res,
        session,
      });
      return;
    }
    // check if a single coupon is not applied again
    const alreadyApplied = cart?.coupon?.some((c: any) => c.code === code);
    if (alreadyApplied) {
      await sendError({
        status: 400,
        message: "Coupon already applied to this cart",
        res,
        session,
      });
      return;
    }

    if (typeof cart!.total !== "number") {
      throw new Error("Cart total not available yet. Save the cart first.");
    }
    const result = await couponservice.applyCoupon(
      isCoupon,
      cart!.items,
      cart!.total
    );

    if (!result.success) {
      await sendError({
        status: 400,
        message: result.error,
        res,
        session,
      });
      return;
    }

    // update cart with final total and coupon info (occ) safe
    const updatedCart = await cartcrudservices.updateCartByUserId({
      userId: userId as string,
      expectedVersion: cart!.__v as number,
      data: {
        finalTotal: result.total,
        coupon: {
          code,
          discountAmount: result.discountAmount,
          percentage: isCoupon.value,
        },
      },
      session,
    });

    if (!updatedCart) {
      await sendError({
        session,
        message: "Concurrent changes detected. Retry again",
        status: 409,
        res,
      });
      return;
    }

    // increase usage count of coupon after successfully applied
    await increaseUsageCountOfCoupon(isCoupon._id.toString(), session);
    await session.commitTransaction();

    await cacheServices.set(`cart:${userId}`, updatedCart, 60 * 5);
    createResponse({
      success: true,
      status: 200,
      message: "Coupon applied successfully",
      data: updatedCart,
      res,
    });
  } catch (error) {
    if(session.inTransaction()){
    await session.abortTransaction();
    }
    if(!res.setHeader || !res.headersSent){
    handleError(error,res);
    }
  } finally {
    session.endSession();
  }
};

export const clearCart = async (req:CustomReq, res: Response) => {
  try {
    const userId  = req?.user?._id;
    if(!validateId){
      await sendError({
        status:400,
        message:`Invalid UserId:${userId}`,
        res
      });
      return;
    }

    const deleteCart = await cartcrudservices.deleteCartByUserId(userId as string);
    if (!deleteCart) {
      createResponse({
        success: false,
        status: 400,
        message: "Cart already deleted or not found",
        res,
      });
      return;
    }

    await cacheServices.del(`cart:${userId}`);
    createResponse({
      success: true,
      status: 200,
      message: "Cart cleared successfully",
      res,
      data:[]
    });
    return;
  } catch (error) {
    handleError( error, res);
    return;
  }
}; 

// // merge cart
// export const mergeCart = async (req: Request, res: Response) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const { userId } = req.params;
//     const items = await validateCartItems(req.body);

//     const guestItems: CartItem[] = items.map((item) => ({
//       ...item,
//       variant: {
//         ...item.variant,
//         discount:
//           item.variant.discount === null ? undefined : item.variant.discount,
//       },
//     }));
//     if (!items || !Array.isArray(items)) {
//       session.abortTransaction();
//       createResponse({
//         success: false,
//         status: 400,
//         message: "Provide appropriate cart data",
//         res,
//       });
//       return;
//     }
//     // check whether user have cart already
//     let userCart = await getCartByUserId(userId, session);
//     // if user have not cart already case
//     if (!userCart) {
//       userCart = await createCartService({
//         userId: userId as string,
//         items: guestItems,
//         session,
//       });
//     } else {
//       // if user have cart already then add new product to cart and increase quantity of cart
//       userCart.items = mergeCartItems(userCart.items, guestItems);
//       await updateCartByCartId({
//         cartId: userCart._id as string,
//         expectedVersion: userCart.__v as number,
//         session,
//         data: { items: userCart.items },
//       });
//     }

//     await session.commitTransaction();
//     createResponse({
//       status: 200,
//       success: true,
//       message: "Guest Cart merged successfully",
//       data: userCart,
//       res,
//     });
//     return;
//   } catch (error) {
//     await session.abortTransaction();
//     if (error instanceof Error) {
//       handleError(error, res);
//     }
//     handleError("Unknown error occured", res);
//     return;
//   } finally {
//     session.endSession();
//   }
// };

// export const removeCoupon = async (req: Request, res: Response) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const { cartId } = req.params;

//     if (!cartId || !mongoose.Types.ObjectId.isValid(cartId)) {
//       session.abortTransaction();
//       createResponse({
//         success: false,
//         message: "Provide cart Id or valid cart Id",
//         status: 400,
//         res,
//       });
//       return;
//     }

//     const existingCart = await getCartByCartId(cartId, session);
//     if (!existingCart) {
//       session.abortTransaction();
//       createResponse({
//         status: 404,
//         success: false,
//         message: "Cart does not exists",
//         res,
//       });
//       return;
//     }

//     const currentVersion = existingCart.__v as number;

//     const removeItem = await removeCouponFromCart({
//       cartId,
//       expectedVersion: currentVersion,
//       session,
//     });
//     if (!removeItem) {
//       session.abortTransaction();
//       createResponse({
//         status: 404,
//         success: false,
//         message: "Cart does not exists",
//         res,
//       });
//       return;
//     }
//     session.commitTransaction();
//     createResponse({
//       status: 200,
//       success: true,
//       message: "Coupon Removed successfully",
//       res,
//     });
//     return;
//   } catch (error) {
//     await session.abortTransaction();
//     if (error instanceof Error) {
//       handleError(error.message, res);
//       return;
//     }
//     handleError("Unknown error occured", res);
//     return;
//   } finally {
//     session.endSession();
//   }
// };
