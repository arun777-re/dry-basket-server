// business logic/layer for offer management

import { Request, Response } from "express";
import {
  createResponse,
  handleError,
  validateFields,
} from "../../utils/heplers";
import Offer from "../../models/PromoCode";
import {
  OfferClass,
  OfferCRUDService,
} from "../../services/offer/offer.services";
import { validateId } from "../../utils/cartUtils";
import { OfferDocument, OfferIncomingDTO } from "../../types/offer";
import { makeQueryForOffer } from "../../utils/couponUtils";
import { cacheServices } from "../../services/redis/cache";
import { normalizeCreateOfferPayload } from "../../mapper/offer.mapper";

const offerClass = new OfferClass();
const OFFER_CRUD_SERVICE = new OfferCRUDService();

// create offer
export const createOffer = async (req: Request, res: Response) => {
  try {
    const {
      code,
      description,
      discountType,
      value,
      minOrderAmount,
      appliesToCategories,
      expiresAt,
      usageLimit,
    } = req.body;
    // handle basic validation required fields
    validateFields(
      {
        code,
        description,
        discountType,
        value,
        expiresAt,
        usageLimit,
      },
      res
    );
const payload = normalizeCreateOfferPayload(req.body);
    const offer = await OFFER_CRUD_SERVICE.createOffer({ data:payload });
    // if offer is not created, return error response
    if (!offer) {
      createResponse({
        success: false,
        status: 400,
        message: "Failed to create offer",
        res,
      });
      return;
    }

    await cacheServices.del(`all-offers`);
    // if offer is created successfully, return the response
    createResponse({
      success: true,
      status: 201,
      data: offer,
      message: "Offer created successfully",
      res,
    });
    return;
  } catch (error: any) {
    if (error.name === "MongoServerError" && error.code === 11000) {
      createResponse({
        success: false,
        status: 400,
        message: "Offer code already exists",
        res,
      });
      return;
    }
    if (error.name === "ValidationError") {
      createResponse({
        success: false,
        status: 400,
        message: error.message,
        res,
      });
      return;
    }
    if (process.env.NODE_ENV !== "production") {
      return console.error(error.message);
    }
    createResponse({
      success: false,
      status: 500,
      message: error.message,
      res,
    });
    return;
  }
};

export const deleteOffer = async (req: Request, res: Response) => {
  try {
    // get offerId from the params/url
    const offerId = req.query.offerId as string;

    if (!validateId(offerId)) {
      createResponse({
        success: false,
        status: 400,
        message: "Provide an appropriate offer Id",
        res,
      });
      return;
    }

    // find offer with id and delete

    const isOfferDeleted = await OFFER_CRUD_SERVICE.deleteOfferById({
      offerId,
    });

    if (!isOfferDeleted) {
      createResponse({
        success: false,
        status: 404,
        message: "Offer not found or already deleted",
        res,
      });
      return;
    }
    await cacheServices.del(`all-offers`);
    createResponse({
      success: true,
      status: 200,
      message: "Offer deleted successfully",
      res,
    });
    return;
  } catch (error: any) {
    if (process.env.NODE_ENV !== "production") {
      console.error(error.message);
    }
    handleError(error, res);
    return;
  }
};

// get all offer
export const getAllOffer = async (req: Request, res: Response) => {
  try {
    // check first in cache if available
    let allOffers = await cacheServices.get<OfferDocument[]>(`all-offers`);
    if (!allOffers || allOffers.length === 0) {
      allOffers = await OFFER_CRUD_SERVICE.getAllOffer();
      if (!allOffers || allOffers.length === 0) {
        createResponse({
          success: false,
          status: 200,
          message: "No offers available to show",
          data: [],
          res,
        });
        return;
      }
      // set cache for 2 hour
      await cacheServices.set(`all-offers`, allOffers, 2 * 60 * 60);
    }

    createResponse({
      success: true,
      status: 200,
      message: `Available offers are`,
      data: allOffers,
      res,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== "production") {
      console.error(error.message);
    }
    if (error instanceof Error) {
      handleError(error, res);
      return;
    }
  }
};

// update offer
export const updateOffer = async (req: Request, res: Response) => {
  try {
    const offerId = req.query.offerId as string;
    const { expiresAt, appliesToCategories, usageLimit, value, __v } = req.body;

    if (!validateId(offerId)) {
      createResponse({
        success: false,
        status: 404,
        message: "Provide offer Id",
        res,
      });
      return;
    }

    const query = makeQueryForOffer({ data: req.body });

    const updateOffer = await OFFER_CRUD_SERVICE.updateOfferById({
      offerId,
      query,
      version: __v,
    });

    if (!updateOffer) {
      createResponse({
        success: false,
        status: 404,
        message: "Offer not found or already deleted",
        res,
      });
      return;
    }
    await cacheServices.del(`all-offers`);
    createResponse({
      success: true,
      status: 200,
      message: "Offer updated successfully",
      data: updateOffer,
      res,
    });
    return;
  } catch (error: any) {
    if (error?.status === 409) {
      createResponse({
        success: false,
        status: 409,
        message: error.message,
        res,
      });
      return;
    }
    if (process.env.NODE_ENV !== "production") {
      console.error(error.message);
    }
    handleError(
      error instanceof Error ? error.message : "Unknown error occured",
      res
    );
    return;
  }
};
