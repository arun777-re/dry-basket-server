import Order from "../../models/Order";
import {
  OrderIncomingReqDTO,
  OrderSchemaDTO,
  PopulatedOrderWithCartDTO,
} from "../../types/order";
import { validateId } from "../../utils/cartUtils";
import { ClientSession } from "mongoose";
import { trackOrderFromShipping } from "../../utils/shipmozoClient";
import { TRACKORDERSHIPPINGRESDTO } from "../../types/shipping";
import { pagination } from "../../utils/heplers";
import { PaginatedResult } from "../../types/product";
import { orderTrackingQueue } from "../../queues/orderTrackingQueue";

export class ORDERCRUDSERVICES {
  async createOrderService({
    payload,
    order,
  }: {
    payload: Partial<OrderIncomingReqDTO>;
    order: Record<string, any>;
  }): Promise<OrderSchemaDTO | null> {
    try {
      if(!payload.cartId) throw new Error('No cartId when creating order')
      const newOrder = await Order.create({
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        paymentStatus: "PENDING",
        orderStatus: "PENDING",
        cartId: payload.cartId,
        userId: payload.userId,
        shippingDetails: payload.shippingDetails,
        razorpayOrderId: order.id,
        blogsAgree: payload.blogsAgree,
        cartItems:payload.cartItems,
      });

      if (!newOrder) return null;
      return newOrder;
    } catch (error: any) {
      console.error(error.message);
      throw new Error("Error during create order");
    }
  }
  // this is to change payment status
  async findOrderAndChangeStatus({
    razorpayOrderId,
    razorpayPaymentId,
  }: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
  }): Promise<boolean> {
    try {
      const order = await Order.findOneAndUpdate(
        { razorpayOrderId, paymentStatus: { $ne: "COMPLETED" } },
        {
          $set: {
            paymentStatus: "COMPLETED",
            orderStatus: "CONFIRMED",
            paymentId: razorpayPaymentId,
          },
        }
      );
      if (!order) return false;
      return true;
    } catch (error) {
      console.error(
        `Error during find order by razorpayorderId:${razorpayOrderId}`
      );
      throw new Error(
        `Error during find order by razorpayorderId:${razorpayOrderId}`
      );
    }
  }
  // cancel order
  async cancelOrderByID(orderId: string): Promise<boolean> {
    try {
      const cancelation = await Order.findByIdAndUpdate(orderId,{
        $set:{orderStatus:"CANCELLED",trackingHistory:[]}
      },{new:true});
      console.log("cancel order",cancelation)
      if (!cancelation) return false;
      return true;
    } catch (error) {
      console.log(`error during cancel order with ID:${orderId}`);
      throw new Error(`error during cancel order with ID:${orderId}`);
    }
  }
}

export class SIMPLE_ORDER_SERVICES {
  async findAllOrdersForAUser({
    userId,
    query,
  }: {
    userId: string;
    query: Record<string, any>;
  }): Promise<PaginatedResult<PopulatedOrderWithCartDTO>> {
    try {
      const { limit, skip, currentPage, hasNextPage, hasPrevPage } =
        await pagination({ query, model: Order });

      const allOrders = await Order.find({ userId })
        .select("-userId")
        .sort({ createdAt: -1 })
        .populate({
          path: "cartId",
          populate: {
            path: "items.productId",
            select: "productName categoryOfProduct",
          },
        })
        .skip(skip)
        .limit(limit)
        .lean();
      return {
        hasNextPage,
        hasPrevPage,
        currentPage,
        products: allOrders as unknown as PopulatedOrderWithCartDTO[],
      };
    } catch (error) {
      console.error("Error during find all orders for user");
      throw new Error("Error during find all orders for user");
    }
  }

  async getSingleOrderById(orderId: string): Promise<OrderSchemaDTO> {
    try {
      const order = await Order.findOne({ _id: orderId });
      return order;
    } catch (error) {
      console.error("Error during find single order");
      throw new Error("Error during find single order for user");
    }
  }
  
  async getPopulatedOrderById(
    orderId: string
  ): Promise<PopulatedOrderWithCartDTO> {
    try {
      if (!validateId(orderId)) {
        throw new Error("order Id is not compatible");
      }

      const order = await Order.findOne({ _id: orderId }).populate({
        path: "cartId",
        populate: {
          path: "items.productId",
          select: "productName categoryOfProduct",
        },
      });
      return order.toJSON();
    } catch (error) {
      console.error("Error during find single order");
      throw new Error("Error during find single order for user");
    }
  }
  async geLatestOrderByUserId(
    userId: string
  ): Promise<PopulatedOrderWithCartDTO | null> {
    try {
      if (!userId) {
        throw new Error("user Id is not available");
      }
      const latestOrder = await Order.findOne({ userId })
        .sort({ createdAt: -1 }).populate({
          path:"userId",
          select:"email"
        }).populate({
          path:"cartItems",
          populate:{
            path:"productId",
            select:"productName"
          }

        })
      if (!latestOrder) return null;
      return latestOrder.toJSON() as unknown as PopulatedOrderWithCartDTO;
    } catch (error) {
      console.error(
        "Error during find latest success order",
        error instanceof Error ? error.message : error
      );
      throw new Error("Error during find latest success order");
    }
  }
  async scheduleTrackingJob({awbno,orderId,expectedVersion}:{awbno:string,orderId:string,expectedVersion?:number}){
     await orderTrackingQueue.add("track-order",{orderId,awbno,expectedVersion},{
      repeat:{every: 60 * 60 * 5},
      removeOnComplete:true,
      removeOnFail:true,
              jobId: `orderId:${orderId}`,
              attempts: 5,
              backoff: { type: "exponential", delay: 10000 },
     })
  }
}
