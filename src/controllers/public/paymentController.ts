import { Request, Response } from "express";
import {
  createResponse,
  handleError,
  validateFields,
} from "../../utils/heplers";
import { CustomReq } from "../../types/customreq";
import { validateId } from "../../utils/cartUtils";
import {
  ORDERCRUDSERVICES,
  SIMPLE_ORDER_SERVICES,
} from "../../services/order/order.services";
import { RAZORPAY_SERVICES } from "../../services/order/razorpay.services";
import { cacheServices } from "../../services/redis/cache";
import { ShippingRateResponseDTO } from "../../types/shipping";
import {
  ORDERAPICACHERESDTO,
  OrderIncomingReqDTO,
  PopulatedOrderWithCartDTO,
} from "../../types/order";
import {
  cacheKeyToGetCourierId,
  checkPincodeForShippingCacheKey,
  getAllOrdersCacheKey,
  getShippingRateCacheKey,
} from "../../utils/cacheKeyUtils";
import { trackOrderFromShipping } from "../../utils/shipmozoClient";
import { BUSINESS_ORDER_SERVICE } from "../../services/order/order.business";
import { PaginatedResult } from "../../types/product";
import { UniformResponseFormat } from "../../types/response";
import { orderTrackingQueue } from "../../queues/orderTrackingQueue";
import { orderCancelQueue } from "../../queues/cancelOrderQueue";

const orderserviceclass = new ORDERCRUDSERVICES();
const razorpayclass = new RAZORPAY_SERVICES();
const simpleorderclass = new SIMPLE_ORDER_SERVICES();
const orderbusinessclass = new BUSINESS_ORDER_SERVICE();

// route to handle order creation
export const createOrder = async (
  req: CustomReq,
  res: Response
): Promise<void> => {
     const userId = req?.user?._id;
    const { cartId, weight } = req.query;
    if (!validateId(cartId as string) || !validateId(userId as string)) {
      createResponse({
        success: false,
        status: 400,
        message: "Product Credentials are wrong",
        res,
      });
      return;
    }
  try {
 
    const { amount, notes, shippingDetails, blogsAgree, shippingCharges,cartItems } =
      req.body;
    const cacheKey = getShippingRateCacheKey(
      shippingDetails.pinCode,
      parseFloat(weight as string)
    );

    const isServiceablePincodeCacheKey = checkPincodeForShippingCacheKey(
      parseFloat(shippingDetails.pinCode)
    );

    // at first check is our shipping service is available for order if not then block further process
    const isAvailable = await cacheServices.get(isServiceablePincodeCacheKey);
    if (!isAvailable) {
      createResponse({
        success: false,
        message: "No services available to this pincode",
        res,
        status: 400,
      });
      return;
    }
    const amountNum = Number(amount) || 0;
    const shippingNum = Number(shippingCharges) || 0;
    const totalAmount = Math.round((amountNum + shippingNum) * 100);
    if (totalAmount < 100) {
      createResponse({
        success: false,
        status: 400,
        message: "Order amount must be at least ₹1",
        res,
      });
      return;
    }
    // currently  we are harcoding currency in future extend this for international currency
    const options = {
      amount: totalAmount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        cartId,
        weight,
      },
    };
    const order = await razorpayclass.createOrder(options);
    // create order
    const newOrder = await orderserviceclass.createOrderService({
      payload: {
        amount: totalAmount,
        notes,
        shippingDetails,
        blogsAgree,
        userId: userId as string,
        cartId: cartId as string,
        shippingCharges,
        cartItems
      },
      order,
    });

    if (!newOrder) {
      createResponse({
        success: false,
        status: 400,
        message: "Failed to create order",
        res,
      });
      return;
    }

    const courierCacheKey = cacheKeyToGetCourierId(newOrder._id as string);
    const bestRate = await cacheServices.get<ShippingRateResponseDTO>(cacheKey);
    if (bestRate) {
      await cacheServices.set(
        courierCacheKey,
        String(bestRate.courierId),
        2000
      );
    }

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

export const verifyPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    validateFields(
      { razorpay_order_id, razorpay_payment_id, razorpay_signature },
      res
    );
    // validate signature for the webhook
    const isValidSign = razorpayclass.verifySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
    if (isValidSign) {
      // call here shipmozo api for create order and assign courier to shipmozo

      // update order with payment details
      const updated = await orderserviceclass.findOrderAndChangeStatus({
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      });
      if (updated === false) {
        createResponse({
          success: false,
          res,
          message: "Error during verifying signature",
          status: 404,
        });
        return;
      }
      createResponse({
        res,
        message: "Payment verified",
        status: 200,
        success: true,
      });
    } else {
      createResponse({
        res,
        message: "Invalid Signature",
        status: 400,
        success: false,
      });
    }
  } catch (error) {
    handleError(error, res);
    return;
  }
};

export const getLatestOrder = async (req: CustomReq, res: Response) => {
  try {
    const userId = req.user?._id;

    const latestOrder = await simpleorderclass.geLatestOrderByUserId(
      userId as string
    );
    if (!latestOrder) {
      createResponse({
        res,
        message: "Order not found",
        status: 404,
        success: false,
      });
      return;
    }
    if (!latestOrder.courierInfo?.awbNumber) {
      createResponse({
        res,
        message: "Order placed , courier assignment in progress",
        status:202,
        success:true,
        data:latestOrder
      });
      return;
    }
console.log("latest order...",latestOrder)
    createResponse({
      res,
      message: "Latest Order placed by user",
      status: 200,
      success: true,
      data: latestOrder,
    });
    return;
  } catch (error) {
    console.error("Error during get latest order", error);
    handleError(
      error instanceof Error
        ? error.message
        : "unknown error occured during get latest order",
      res
    );
    return;
  }
};

// all orders created by a user
export const getAllOrdersForAuser = async (req: CustomReq, res: Response) => {
  try {
    const userId = req.user?._id;
    const safeUserId = userId as string;
    const query = req.query;
    if (!validateId(safeUserId)) {
      createResponse({
        success: false,
        message: "Invalid/Null User Id",
        status: 400,
        res,
      });
      return;
    }

    const allOrders = await simpleorderclass.findAllOrdersForAUser({
      userId: safeUserId,
      query,
    });
    if (!allOrders || !allOrders.products) {
      createResponse({
        success: false,
        message: "Error during get all orders/ No order placed yet",
        status: 404,
        res,
      });
      return;
    }
    if (allOrders.products.length === 0) {
      createResponse({
        success:true,
        message: "No order placed yet",
        status:200,
        res,
        data:[]
      });
      return;
    }

    createResponse({
      success: true,
      message: `All Orders placed by user:${req.user?.firstName}`,
      status: 200,
      res,
      data: allOrders.products,
      hasNextPage: allOrders.hasNextPage,
      hasPrevPage: allOrders.hasPrevPage,
      currentPage: allOrders.currentPage,
    });
    return;
  } catch (error) {
    handleError(
      error instanceof Error
        ? error.message
        : `Unknown error occured during get all orders associated with user:${req.user?.firstName}`,
      res
    );
    return;
  }
};

// fetch single order based on delievered and not delievered
export const getSingleOrderForAuser = async (req: Request, res: Response) => {
  const { orderId } = req.query;
  const safeOrderId = (orderId as string).trim();
  if (!validateId(safeOrderId)) {
    createResponse({
      success: false,
      message: "Invalid/Null Order Id",
      status: 400,
      res,
    });
    return;
  }
  try {
    const order = await simpleorderclass.getPopulatedOrderById(safeOrderId);
    if (!order) {
      createResponse({
        success: false,
        res,
        status: 404,
        message: "Order not found",
      });
      return;
    }
    createResponse({
      success: true,
      res,
      status: 200,
      message: "Order fetched successfully",
      data: order,
    });
    return;
  } catch (error) {
    handleError(
      error instanceof Error
        ? error.message
        : `Unknown error occured during get single Order:${safeOrderId}`,
      res
    );
    return;
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  const { orderId } = req.query;
  if (!validateId(orderId as string)) {
    createResponse({
      res,
      success: false,
      status: 400,
      message: "Invalid / Empty order ID",
    });
    return;
  }
  try {
    const order = await simpleorderclass.getPopulatedOrderById(orderId as string);
    if (!order) {
      createResponse({
        res,
        success: false,
        status: 404,
        message: "Order Not found / deleted already",
      });
      return;
    }
    if(order.orderStatus === "CANCELLED"){
           createResponse({
        res,
        success:true,
        status:200,
        message: "Order cancelled already",
      });
      return;
    }
    //  here cancel order from delievery partner using worker in bullmq by sending orderId and awbno
    await orderCancelQueue.add("cancel-order", {
      shipmentOrderId: order.courierInfo?.shipmentOrderId,
      awbno: Number(order.courierInfo?.awbNumber),
      order
    });

    // remove repeat tracking job
    const repeatableJobs = await orderTrackingQueue.getJobScheduler(
      `orderId:${orderId}`
    );
    console.log("repeatableJobs",repeatableJobs)
    // this will remove the job scheduler for the particular job
    await orderTrackingQueue.removeJobScheduler(`orderId:${orderId}`);

    //  not delete only update orderStatus in db
    const response = await orderserviceclass.cancelOrderByID(orderId as string);
    if (!response) {
      createResponse({
        res,
        success: false,
        status: 404,
        message: "Order Not found / deleted already",
      });
      return;
    }
    createResponse({
      res,
      success: true,
      status: 200,
      message: "Order deleted",
    });
    return;
  } catch (error) {
    handleError(
      error instanceof Error
        ? error.message
        : `Unknown error occured during get all orders associated with user`,
      res
    );
    return;
  }
};

// export const returnOrder = async(req:Request,res:Response)=>{
//   try {

//   } catch (error) {
//     handleError(error instanceof Error ? error.message : `Unknown error occured during get all orders associated with user:${}`,res);
//     return;
//   }
// }
