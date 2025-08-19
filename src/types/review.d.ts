import { Document, Types } from "mongoose";

export interface ReviewIncomingRequestDTO {
  rating: number;
  reviewText: string;
  userId: Types.ObjectId | string;
  productId: Types.ObjectId | string;
  avgRating?: number;
}

export interface ReviewDocument extends ReviewIncomingRequestDTO, Document {}

export type OutgoingReviewDTO = {
  _id: Types.ObjectId | string;
  rating: number;
  reviewText: string;
  userId: {
    firstName: string;
  };
  createdAt: Date | null;
};
