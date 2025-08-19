import { Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { createResponse, handleError } from "../../utils/heplers";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils";
import Order from "../../models/Order";
import { CustomReq } from "../../types/customreq";
import mongoose from "mongoose";

const razorpay = new Razorpay({
  key_id: process.env.PAYMENT_KEY,
  key_secret: process.env.PAYMENT_SECRET,
});

// route to handle order creation
export const createOrder = async (
  req: CustomReq,
  res: Response
): Promise<void> => {
  try {
    const userId = req?.user?._id;
    const { cartId } = req.query;
    if (!cartId || !mongoose.Types.ObjectId.isValid(cartId as string)) {
      createResponse({
        success: false,
        status: 400,
        message: "Product Credentials are wrong",
        res,
      });
    }
    const { amount, notes, shippingDetails } = req.body;
    console.log("body", { userId, cartId });
    const options = {
      amount: amount * 100,
      currency: "INR",
      notes: notes || {},
    };

    const order = await razorpay.orders.create(options);

    // create order
    const newOrder = await Order.create({
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: "CONFIRMED",
      cartId,
      userId,
      shippingDetails,
      razorpayOrderId: order.id,
    });

    // send response
    createResponse({
      success: true,
      message: "Order created successfully",
      status: 201,
      data: {
        order: newOrder,
        razorpayOrderId: order.id,
        razorpayKey: process.env.PAYMENT_KEY,
      },
      res,
    });
    return;
  } catch (error) {
    handleError(error, res);
    return;
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;
  const secret = process.env.PAYMENT_SECRET!;
  const body = razorpay_order_id + "|" + razorpay_payment_id;

  try {
    const expectedSignature = crypto
      .createHmac("sha256", process.env.PAYMENT_SECRET!)
      .update(body.toString())
      .digest("hex");
    const isValidSign = validateWebhookSignature(
      body,
      razorpay_signature,
      secret
    );
    if (isValidSign) {
      // update order with payment details
      const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
      if (order) {
        order.status = "paid";
        order.paymentId = razorpay_payment_id;
        await order.save();
      }
      res.status(200).json({ status: "ok" });
      console.log("Payment verified");
    } else {
      res.status(400).json({ status: "verification failed" });
    }
  } catch (error) {
    handleError(error, res);
    return;
  }
};
