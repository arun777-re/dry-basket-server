import { Request, Response } from "express";
import {
  createResponse,
  handleError,
  runWithRetryTransaction,
} from "../../utils/heplers";
import mongoose, { ClientSession } from "mongoose";
import { ProductBusinessService } from "../../services/productService";
import { ReviewServiceClass } from "../../services/reviewService";
import { CustomReq } from "../../types/customreq";
import { cacheServices } from "../../services/redis/cache";
import { OutgoingReviewDTO } from "../../types/review";
const productservice = new ProductBusinessService();
const reviewService = new ReviewServiceClass();

export const createReview = async (req: CustomReq, res: Response) => {
  try {
    const { productId } = req.query;
    const userId = req?.user?._id!;
    const { rating, reviewText } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId as string)) {
      createResponse({
        success: false,
        message: "Provide appropriate product data to review",
        status: 400,
        res,
      });
      return;
    }

    const userReview = await runWithRetryTransaction(
      async (session: ClientSession) => {
        // first check whether product exists or not
        const isExists = await productservice.getProductById({
          productId: productId as string,
          session,
        });
        if (!isExists) {
          await session.abortTransaction();
          createResponse({
            success: false,
            status: 404,
            message: "Product not found with given ID",
            res,
          });
          return;
        }

        const query = {
          userId: userId as string,
          productId: productId as string,
          rating: rating,
          reviewText: reviewText,
        };
        // call service to create review
        const result = await reviewService.createReviewService({
          query,
          session,
        });

        if (!result) {
          await session.abortTransaction();
          createResponse({
            success: false,
            status: 404,
            message: "Review does not added to product",
            res,
          });
          return;
        }

        // update avgRating on every review created
        await reviewService.updateProductAvgRating({
          productId: productId as string,
          session,
        });
        return { message: "Review added successfully" };
      }
    );

    await cacheServices.del(`productReviews:${productId}`), // Clear cache for product reviews
      createResponse({
        success: true,
        status: 200,
        message: userReview!.message || "Review added successfully",
        res,
      });
    return;
  } catch (error) {
    if (error instanceof Error) {
      handleError(error, res);
      return;
    }
    handleError(new Error("Unknown Error occured"), res);
    return;
  }
};

// get all reviews associated with a product
export const getAllReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.query;

    // check whether provided id id a valid mongoose id
    if (!productId || !mongoose.Types.ObjectId.isValid(productId as string)) {
      createResponse({
        success: false,
        message: "Provide appropriate product data to review",
        status: 400,
        res,
      });
      return;
    }

    // check whether product exists or not for provided id
    const isExits = await productservice.getProductById({
      productId: productId as string,
    });
    if (!isExits) {
      createResponse({
        success: false,
        message: "Provide appropriate product data to review",
        status: 404,
        res,
      });
      return;
    }

    const cacheKey = `productReviews:${productId}`;
    // Check if reviews are cached
    let result = await cacheServices.get<OutgoingReviewDTO[]>(cacheKey);
    if (!result) {
      // get all review from db
      result = await reviewService.getAllReviewOfProduct({
        productId: productId as string,
      });
    }

    if (!result || result.length === 0) {
      createResponse({
        success: false,
        message: "No reviews found yet",
        status: 404,
        res,
      });
      return;
    }

    await cacheServices.set<OutgoingReviewDTO[]>(
      cacheKey,
      result,
      60 * 60 * 24 // Cache for 24 hours
    ); 
    createResponse({
      success: true,
      status: 200,
      message: "All Review fetched ",
      data: result,
      res,
    });
    return;
  } catch (error) {
    if (error instanceof Error) {
      handleError(error, res);
      return;
    }
    handleError(new Error("Unknown Error occured"), res);
    return;
  }
};
