import { Response } from "express";
import { createResponse, handleError } from "../../utils/heplers";
import { CustomReq } from "../../types/customreq";
import { validateId } from "../../utils/cartUtils";
import { WishlistClass } from "../../services/wishlist/wishlist.servives";
import { PaginationQuery } from "../../types/response";

const wishClass = new WishlistClass();

// if user have
export const createWishlist = async (req: CustomReq, res: Response) => {
  const userId = req.user?._id as string;
  const { productId } = req.query;
  const safeProductId = (productId as string).trim();
  validateId(safeProductId);
  if (!productId || !validateId(safeProductId)) {
    createResponse({
      success: false,
      message: "Provide appropriate product ID",
      status: 400,
      res,
    });
    return;
  }
  try {
    const addOrCreateWishlist = await wishClass.toggleWishlist({
      productId: safeProductId,
      userId,
    });
    if (!addOrCreateWishlist) {
      createResponse({
        success: false,
        message: "Error during create wishlist/ add item to wishlist",
        status: 404,
        res,
      });
      return;
    }

    createResponse({
      success: true,
      message: "Create/ add item to wishlist successfull",
      status: 201,
      res,
    });
    return;
  } catch (error) { 
    handleError(error, res);
  }
};

export const removeItemFromWishlist = async (req: CustomReq, res: Response) => {
      const userId = req.user?._id as string;
  const { productId } = req.query;
  const safeProductId = (productId as string).trim();
  validateId(safeProductId);
  if (!productId || !validateId(safeProductId)) {
    createResponse({
      success: false,
      message: "Provide appropriate product ID",
      status: 400,
      res,
    });
    return;
  }
  try {
    const isExists = await wishClass.isItemInWishlist({productId:safeProductId,userId});
    if(!isExists){
         createResponse({
      success: false,
      message: "Item not found",
      status: 404,
      res,
    });
    return;
    }
const removeItem = await wishClass.removeItemFromWishlist({productId:safeProductId,userId});
if(!removeItem){
    createResponse({
      success: false,
      message: "Error during remove Item from wishlist",
      status: 404,
      res,
    });
    return;
}
  createResponse({
      success:true,
      message: "Item removed from wishlist successfull",
      status:200,
      res,
    });
    return;
  } catch (error) {
    handleError(error, res);
  }
};

export const clearWishlist = async (req: CustomReq, res: Response) => {
    const userId = req.user?._id as string;

  try {
    const clear = await wishClass.removeallItemFromWishlist({userId});
   if(!clear){
    createResponse({
      success: false,
      message: "Error during remove all Items from wishlist",
      status: 404,
      res,
    });
    return;
}
  createResponse({
      success:true,
      message: "Items removed from wishlist successfull",
      status:200,
      res,
    });
    return;
  } catch (error) {
    handleError(error, res);
  }
};

export const getUserWishlist = async (req: CustomReq, res: Response) => {
    const userId = req.user?._id as string;
    const query = req.query as unknown as PaginationQuery;
  try {
    const allItems = await wishClass.getAllItemFromWishlist({userId,query});
    if(!allItems){
    createResponse({
      success: false,
      message: "Error during get all Items from wishlist",
      status: 404,
      res,
    });
    return;
    }
    createResponse({
      success: true,
      message: "Successfully get all items from wishlist",
      status:200,
      res,
      data:allItems.products,
       hasNextPage:allItems.hasNextPage,
        hasPrevPage:allItems.hasPrevPage,
        currentPage:allItems.currentPage,
    });
    return;
  } catch (error) {
    handleError(error, res);
  }
};
