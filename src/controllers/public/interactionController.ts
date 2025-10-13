import {Response } from "express";
import { CustomReq } from "../../types/customreq";
import { validateId } from "../../utils/cartUtils";
import { createResponse, handleError } from "../../utils/heplers";
import { InteractionService } from "../../services/interaction/action.service";
 
const serviceclass = new InteractionService();

export const createInteraction = async (req: CustomReq, res: Response) => {
  const userId = req.user?._id as string;
  const { productId, action ,categoryId} = req.body;
  const safeProductId = (productId as string).trim();
  if(categoryId ){
  const safeCategoryId = (categoryId as string).trim();

  validateId(safeCategoryId as string);
  if(!validateId(safeCategoryId)){
       createResponse({
      status: 400,
      success: false,
      res,
      message: "Malformed categoryId",
    });
    return;
  }
  }
  const allowedActions = ["view","purchase","addCart","addToWishlist"]
  if (!action || !allowedActions.includes(action as string)) {
    createResponse({
      status: 400,
      success: false,
      res,
      message: "Provide action for which called",
    });
    return;
  }
  try {
    if (action === "purchase") {
      if (!Array.isArray(productId) || productId.length === 0) {
        return createResponse({
          status: 400,
          success: false,
          res,
          message: "productId must be an array for purchase action",
        });
      }

      // Validate all product IDs
      for (const id of productId) {
        if (!validateId(id)) {
          return createResponse({
            status: 400,
            success: false,
            res,
            message: `Malformed productId: ${id}`,
          });
        }
      }

      // Call service for multiple products
      await serviceclass.createInteraction({
        userId,
        productId, // array
        action,
        categoryId,
      });
    } else {
      if (!validateId(productId as string)) {
        return createResponse({
          status: 400,
          success: false,
          res,
          message: "Malformed productId",
        });
      }

      await serviceclass.createInteraction({
        userId,
        productId,
        action,
        categoryId,
      });
    }

    createResponse({
      status: 201,
      success: true,
      res,
      message: "Create Interaction successfull",
    });
    return;
  } catch (error) {
    console.error(
      "Error during create interaction",
      error instanceof Error ? error.message : error
    );
    handleError(error, res);
  }
};


