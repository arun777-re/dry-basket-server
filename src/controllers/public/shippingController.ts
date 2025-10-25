import { Request, Response } from "express";
import {
  createResponse,
  handleError,
  validateFields,
} from "../../utils/heplers";
import {
  checkPincodeForShipping,
  shippingRateService,
} from "../../utils/shipmozoClient";
import { cacheServices } from "../../services/redis/cache";
import { ShippingRateResponseDTO } from "../../types/shipping";
import { bestRateCalculator } from "../../utils/shippingUtils";
import { validateId } from "../../utils/cartUtils";
import { orderQueue } from "../../queues/orderQueqe";
import {
  cacheKeyToGetCourierId,
  checkPincodeForShippingCacheKey,
  getShippingRateCacheKey,
} from "../../utils/cacheKeyUtils";
import { CustomReq } from "../../types/customreq";

export const getShippingRate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { weight, pincode, amount } = req.body;
    validateFields({ weight, pincode, amount }, res);

    // cache keys
    // first check whether is pincode exists in redis
    const cacheKey = getShippingRateCacheKey(pincode, weight);
    const pincodeCacheKey = checkPincodeForShippingCacheKey(
      parseFloat(pincode)
    );
    // convert rupees into paisa
    const amountInPaisa = amount * 100;

    // try cache first
    const shippingRates = await cacheServices.get<ShippingRateResponseDTO>(
      cacheKey
    );
    if (shippingRates ) {
      if (amountInPaisa > 400000) {
        createResponse({
          success: true,
          message: "No shipping charges greater than order Rs 4000",
          res,
          status: 200,
          data: 0,
        });
        return;
      }
      createResponse({
        success: true,
        message: "Shipping rate fetched from cache",
        data: shippingRates.total_charges,
        res,
        status: 200,
      });
      return;
    }

    // first of all check whether order fullfills amount min req and delivevery available to pincode or not
    let isShippingAvailable = await cacheServices.get(pincodeCacheKey);

    if (isShippingAvailable === null) {
      isShippingAvailable = await checkPincodeForShipping({
        pickup_pincode: 131001,
        delivery_pincode: pincode,
      });
      if (!isShippingAvailable) {
        createResponse({
          success: false,
          message: "No shipping available to this destination",
          res,
          status: 404,
          data: 0,
        });
        return;
      }
      await cacheServices.set(
        pincodeCacheKey,
        isShippingAvailable,
        60 * 60 * 24
      );
    }

    // avoid multiple api hits (concurrency lock);
    const lockKey = `${cacheKey}:lock`;
    const gotLock = await cacheServices.setIfNotExists(lockKey, "1", 40);
    if (!gotLock) {
      // If lock already taken, short-circuit
      createResponse({
        success: false,
        message: "Shipping rate is being calculated, please retry shortly",
        res,
        status: 429,
      });
      return;
    }
    // Here you would typically call a shipping service API to get the rate
    const ClientshippingRates = await shippingRateService({ pincode, weight });
    //  send response for fallback
    if (
      ClientshippingRates.message !== "Success" ||
      !ClientshippingRates.data ||
      ClientshippingRates.data.length === 0
    ) {
      await cacheServices.del(lockKey);
      createResponse({
        success: false,
        message:
          ClientshippingRates?.message || "Failed to fetch shipping rate",
        res,
        status: 400,
      });
      return;
    }
    const bestRate = bestRateCalculator(ClientshippingRates.data);
    if (!bestRate) {
      await cacheServices.del(lockKey);
      createResponse({
        success: false,
        message: "No shipping rate found",
        res,
        status: 404,
      });
      return;
    }
    await Promise.all([
      cacheServices.set<ShippingRateResponseDTO>(
        cacheKey,
        bestRate,
        60 * 60 * 24
      ),
      cacheServices.del(lockKey),
    ]);
    if (isShippingAvailable && amountInPaisa > 400000) {
      createResponse({
        success: true,
        message: "No shipping charges greater than order 4000",
        res,
        status: 200,
        data: 0,
      });
      return;
    }
    createResponse({
      success: true,
      message: "Shipping rate fetched successfully",
      data: bestRate?.total_charges,
      res,
      status: 200,
    });
    return;
  } catch (error: any) {
    handleError(
      error instanceof Error
        ? error
        : new Error("An unexpected error occurred"),
      res
    );
    return;
  }
};

export const placeOrderAndAssignCourierForShipping = async (
  req:CustomReq,
  res: Response
) => {
  try {
    const firstName = req.user?.firstName;
    const email = req.user?.email;
    const { orderId } = req.query;
    const safeOrderId = (orderId as string).trim();
    const cacheKey = cacheKeyToGetCourierId(safeOrderId);
    if (!validateId(safeOrderId)) {
      createResponse({
        success: false,
        message: "Order and Courier Id missing",
        res,
        status: 400,
      });
      return;
    }
    const courierId = await cacheServices.get(cacheKey);
    if (!courierId) {
      createResponse({
        success: false,
        message: "Courier Id missing",
        res,
        status: 400,
      });
      return;
    }

    // setup bullmq queue for place , assign order to shipping company and change status and also send notification
    try {
      await orderQueue.add(
        "processOrder",
        { safeOrderId, courierId ,userName:firstName,userEmail:email},
        {
          jobId: `order:${safeOrderId}`,
          attempts: 5,
          backoff: { type: "exponential", delay: 10000 },
          removeOnComplete: { age: 3600 },
          removeOnFail: { age: 86400 },
        }
      );
    } catch (error) {
      console.error("orderQueue.add failed", error);
      return createResponse({
        success: false,
        message: "failed to queue order",
        res,
        status: 500,
      });
    }
    await cacheServices.del(cacheKey);

    createResponse({
      success: true,
      message: "Order queued for courier assignment",
      res,
      status: 200,
    });
    return;
  } catch (error) {
    handleError(
      error instanceof Error
        ? error.message
        : new Error("unknown error occured"),
      res
    );
    return;
  }
};
