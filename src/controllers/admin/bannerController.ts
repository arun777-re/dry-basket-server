import { Request, Response } from "express";
import { BannerIncomingDTO, UpdateQueryDTO } from "../../types/banner";
import { createResponse, handleError } from "../../utils/heplers";
import Banner from "../../models/Banner";
import { validateId } from "../../utils/cartUtils";
import { BannerServiceClass } from "../../services/banner/banner.services";
import { PaginationQuery } from "../../types/response";

const bannerserviceclass = new BannerServiceClass();

export const createBanner = async (req: Request, res: Response) => {
  try {
    const { title, description, bannerImage, couponValue } =
      req.body as BannerIncomingDTO;
    if (!bannerImage) {
      createResponse({
        res,
        success: false,
        status: 400,
        message: "Provide a banner Image",
      });
      return;
    }

    const newBanner = await bannerserviceclass.CREATE_BANNER(req.body);
    if (!newBanner) {
      createResponse({
        res,
        success: false,
        status: 404,
        message: "Provide a banner Image",
      });
      return;
    }
    createResponse({
      res,
      success: true,
      status: 201,
      message: "Banner created Successfully",
    });
    return;
  } catch (error) {
    console.error("Error during create Banner Operation:", error);
    handleError(
      error instanceof Error
        ? error.message
        : "Unknown error occured during create banner operation",
      res
    );
    return;
  }
};
export const deleteBanner = async (req: Request, res: Response) => {
  try {
    const { bannerId } = req.query;
    if (!validateId(bannerId as string)) {
      createResponse({
        res,
        success: false,
        status: 400,
        message: "Invalid / Missing banner Id",
      });
      return;
    }

    const isBanner = await bannerserviceclass.FIND_BANNER_NORMAL(bannerId as string);
    if (!isBanner) {
      createResponse({
        res,
        status: 404,
        success: false,
        message: "Banner not found with ID:${bannerId}",
      });
    }
    const deleteOperation = await bannerserviceclass.DELETE_BANNER(bannerId as string)
    if (!deleteOperation) {
      createResponse({
        res,
        success: false,
        status: 404,
        message: "Not found or deleted already ",
      });
      return;
    }
    createResponse({
      res,
      success: true,
      status: 200,
      message: "Banner deleted Successfully",
    });
    return;
  } catch (error) {
    console.error("Error during delete Banner Operation:", error);
    handleError(
      error instanceof Error
        ? error.message
        : "Unknown error occured during create delete operation",
      res
    );
    return;
  }
};

export const updateBanner = async (req: Request, res: Response) => {
  try {
    const { bannerId } = req.query;
    const { title, couponValue, description } = req.body as UpdateQueryDTO;
    const safeBannerId = (bannerId as string).trim();

    if (
      !validateId(safeBannerId) &&
      (!title &&
      !couponValue &&
      !description)
    ) {
      createResponse({
        res,
        success: false,
        status: 400,
        message: "Invalid / Missing banner Id or missing update fields",
      });
      return;
    }

    const isBanner = await bannerserviceclass.FIND_BANNER_NORMAL(safeBannerId);
    if (!isBanner) {
      createResponse({
        res,
        status: 404,
        success: false,
        message: "Banner not found with ID:${bannerId}",
      });
    }
    const updateOperation = await bannerserviceclass.UPDATE_BANNER({bannerId:safeBannerId,body:req.body});
    if (!updateOperation) {
      createResponse({
        res,
        success: false,
        status: 404,
        message: "Error during update Banner",
      });
      return;
    }
    createResponse({
      res,
      success: true,
      status: 200,
      message: "Banner updated",
    });
    return;
  } catch (error) {
    console.error("Error during update Banner Operation:", error);
    handleError(
      error instanceof Error
        ? error.message
        : "Unknown error occured during  update operation",
      res
    );
    return;
  }
};

export const getSingleBanner = async (req: Request, res: Response) => {
  try {
    const { bannerId } = req.query;
    if (!validateId(bannerId as string)) {
      createResponse({
        res,
        success: false,
        status: 400,
        message: "Invalid / Missing banner Id ",
      });
      return;
    }
    const banner = await Banner.findById(bannerId).lean();
    if (!banner) {
      createResponse({
        res,
        status: 404,
        success: false,
        message: "Banner not found with ID:${bannerId}",
      });
    }

    createResponse({
      res,
      status: 200,
      success: true,
      message: "Banner fetched",
      data: banner,
    });
    return;
  } catch (error) {
    console.error("Error during get single Banner Operation:", error);
    handleError(
      error instanceof Error
        ? error.message
        : "Unknown error occured during get single operation",
      res
    );
    return;
  }
};
export const getAllBanner = async (req: Request, res: Response) => {
  const query = req.query;
  try {
    const { products, hasNextPage, hasPrevPage, currentPage } =
      await bannerserviceclass.GET_ALL_BANNER(
        query as unknown as PaginationQuery
      );
    if (products.length === 0) {
      createResponse({
        res,
        status: 200,
        success: true,
        message: "No banner created yet",
        data: [],
      });
      return;
    }

    const responseObj = {
      status: 200,
      success: true,
      message: "Banner fetched",
      data: products,
      currentPage,
      hasNextPage,
      hasPrevPage,
    };
    createResponse({
      res,
      ...responseObj,
    });
    return;
  } catch (error) {
    console.error("Error during getall Banner Operation:", error);
    handleError(
      error instanceof Error
        ? error.message
        : "Unknown error occured during getall operation",
      res
    );
    return;
  }
};
