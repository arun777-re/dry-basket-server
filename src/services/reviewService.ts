import mongoose, { ClientSession } from "mongoose";
import { Product, Review } from "../models";
import { OutgoingReviewDTO, ReviewIncomingRequestDTO } from "../types/review";

export class ReviewServiceClass {
  async createReviewService({
    query,
    session,
  }: {
    query: ReviewIncomingRequestDTO;
    session: ClientSession;
  }): Promise<{ message: string } | null> {
    try {
      const review = new Review({
        ...query,
      });

      if (!review) return null;

      await review.save({ session });
      return { message: "Revied added to product" };
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      throw new Error("Error during add review to product");
    }
  }

  async updateProductAvgRating({
    productId,
    session,
  }: {
    productId: string;
    session?: ClientSession;
  }) {
    try {
      const result = await Review.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(productId) } },
        {
          $group: {
            _id: "$productId",
            avgRating: { $avg: "$rating" },
          },
        },
      ]);
      const avgRating = result[0]?.avgRating || 0;

      await Product.findByIdAndUpdate(productId, {$set:{avgRating:avgRating }}, { session });
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      throw new Error("Error during update product");
    }
  }

  async getAllReviewOfProduct({
    productId,
  }: {
    productId: string;
  }): Promise<OutgoingReviewDTO[] | null> {
    try {
      const getReview = await Review.find({ productId })
        .select("-productId")
        .populate("userId");
      if (!getReview) return null;
      return getReview;
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      throw new Error("Error during add review to product");
    }
  }
}
