import dotenv from "dotenv";
dotenv.config({ path: require("path").resolve(__dirname, "../../.env") });

import { dbConnect } from "../db";

dbConnect();
import { Worker } from "bullmq";
import {
  assignCourierToShipmozo,
  pushOrderToShipmozo,
} from "../utils/shipmozoClient";
import {
  SHIPMOZOASSIGNCOURIERDTO,
  SHIPMOZOCREATEORDERDTO,
} from "../types/shipping";
import { SIMPLE_ORDER_SERVICES } from "../services/order/order.services";
import {
  calculateDimensionsForShipping,
  withRetry,
} from "../utils/shippingUtils";
import { BUSINESS_ORDER_SERVICE } from "../services/order/order.business";
import mongoose from "mongoose";
import { cacheServices } from "../services/redis/cache";
import { bullWorkerConnection } from "../config/redis";

const orderserviceclass = new SIMPLE_ORDER_SERVICES();
const orderbusinessclass = new BUSINESS_ORDER_SERVICE();
const simpleorderclass = new SIMPLE_ORDER_SERVICES();

export const orderWorker = new Worker(
  "orderQueue",
  async (job) => {
    const {
      safeOrderId,
      courierId,
    }: { safeOrderId: string; courierId: string } = job.data;

    if (safeOrderId == null || safeOrderId === undefined || courierId == null) {
      await job.log("missing courier/order ID");
      throw new Error(
        `Courier and Order ID are must courier:${courierId} order:${safeOrderId}`
      );
    }
    // add a redis lock key per-order to prevent duplicate process in rare cases
    const lockKey = `lock:order:${safeOrderId}`;
    const lock = await cacheServices.setIfNotExists(lockKey, "1", 60_000);
    if (!lock) {
      await job.log("Order already processing by another worker");
      throw new Error("Order already processing");
    }
    try {
      const order = await orderserviceclass
        .getPopulatedOrderById(safeOrderId)
        .catch((err) => {
          throw Error(err.message);
        });

      // calculate dimensions for the box size
      const dimensions = calculateDimensionsForShipping(
        order.cartId.totalWeight
      );
      const body1: SHIPMOZOCREATEORDERDTO = {
        order_id: order._id as string,
        order_date: new Date(order.createdAt!).toISOString().split("T")[0],
        consignee_name: order.shippingDetails.firstName,
        consignee_phone: order.shippingDetails.phone,
        consignee_address_line_one: order.shippingDetails.address,
        consignee_address_line_two: order.shippingDetails.appartment,
        consignee_pin_code: order.shippingDetails.pinCode,
        consignee_city: order.shippingDetails.city,
        consignee_state: order.shippingDetails.state,
        product_detail: order.cartId.items.map((item) => ({
          name: item.productId.productName,
          quantity: item.quantity,
          unit_price: item.variant.priceAfterDiscount,
          product_category: item.categoryOfProduct,
          discount: 0,
        })),
        payment_type: order.paymentType!,
        weight: order.cartId.totalWeight,
        length: dimensions.length,
        width: dimensions.width,
        height: dimensions.height,
        warehouse_id: process.env.WAREHOUSE_ID_2 as string,
      };

      const resforShippingOrder = await withRetry(
        () => pushOrderToShipmozo(body1),
        2,
        1000
      ).catch((err) => {
        const errorMessage = err.response?.data || err.message;
        console.error("pushOrderToShipmozo failed", errorMessage);
        throw new Error(
          `pushOrderToShipmozo failed: ${JSON.stringify(errorMessage)}`
        );
      });
      let safeOrderIdFromShipping: string = "";
      if (resforShippingOrder.result == "1") {
        safeOrderIdFromShipping = resforShippingOrder.data.order_id;
      } else {
        throw new Error("Shipmozo did not return order_id");
      }

      const body2: SHIPMOZOASSIGNCOURIERDTO = {
        order_id: safeOrderIdFromShipping,
        courier_id: parseFloat(courierId),
      };

      const res = await withRetry(
        () => assignCourierToShipmozo(body2),
        2,
        1000
      ).catch((err) => {
        console.error(
          "assignCourierToShipmozo failed",
          err.response?.data || err.message
        );
        throw err;
      });

      if (res.result == "1" && res.data.awb_number) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
          const payloadForTracking = {
            orderId: safeOrderId,
            awbno: res.data.awb_number,
            expectedVersion: order.__v ?? 0,
          };
          // schedule tracking job if awbno exists
          if (payloadForTracking.awbno) {
            await simpleorderclass.scheduleTrackingJob(payloadForTracking);
          }
          await orderbusinessclass.updateCourierInfo({
            orderId: safeOrderId,
            courier: res.data.courier,
            awbNumber: res.data.awb_number,
            shippingOrderId: safeOrderIdFromShipping,
            session,
          });

          // update stock
          await orderbusinessclass.updateStockAfterSuccessfullOrder({
            order,
            session,
          });
          await session.commitTransaction();
        } catch (error) {
          await session.abortTransaction();
          throw error;
        } finally {
          await session.endSession();
        }
      } else {
        throw Error("Shipmozo does not return awb_number");
      }
    } finally {
      await cacheServices.del(lockKey);
    }
  },

  { connection: bullWorkerConnection, concurrency: 5 }
);

orderWorker.on("completed", (job) => {
  console.log(`${job.id} has completed!`);
});
orderWorker.on("failed", (job, err) => {
  console.log(`${job!.id} has failed with ${err.message}`);
});
