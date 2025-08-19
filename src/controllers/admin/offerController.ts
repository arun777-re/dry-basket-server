import { dbConnect } from "../../db";
dbConnect();
import { Request,Response } from "express";
import {createResponse,handleError,validateFields} from '../../utils/heplers'
import Offer from "../../models/PromoCode";

export const createOffer = async(req:Request,res:Response)=> {
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
    } =req.body;
    // handle basic validation required fields
   validateFields({
      code,
      description,
      discountType,
      value,
      expiresAt,
      usageLimit,
    },res);
  
    // check whether offer code already exists in db
    const existingOffer = await Offer.findOne({ code });
if (existingOffer) {
   createResponse({
    success: false,
    message: "Offer code already exists",
    status: 400,
    res
  });
  return;
}

    const offer = await Offer.create({
      code,
      description,
      discountType,
      value,
      minOrderAmount,
      appliesToCategories,
      expiresAt,
      usageLimit,
    });

    createResponse({
      success: true,
      status: 201,
      data: offer,
      message: "Offer created successfully",
      res
    });
    return;
  } catch (error: any) {
  
    if (error.name === "ValidationError") {
      createResponse({
        success: false,
        status: 400,
        message: error.message,
        res
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
      res
    });
    return;
  }
}

export const deleteOffer = async(req:Request,res:Response)=>{
  try {
    // get offerId from the params/url
    const offerId = req.query.offerId as string;

    if (!offerId) {
      createResponse({
        success: false,
        status: 400,
        message: "Provide an appropriate offer Id",
    res  
    });
    return;
    }

    // find offer with id and delete

    const deleteoffer = await Offer.findByIdAndDelete(offerId);

    if (!deleteoffer) {
      createResponse({
        success: false,
        status: 400,
        message: "Offer not found or already deleted",
    res  
    });
    return
    }

    createResponse({
      success: true,
      status: 200,
      message: "Offer deleted successfully",
    res
    });
    return
  } catch (error: any) {
    if (process.env.NODE_ENV !== "production") {
      console.error(error.message);
    }
handleError(error,res);
return;
   
  }
}

// get all offer
export const getAllOffer = async(req:Request,res:Response)=>{
     try {
 
    const alloffers = await Offer.find().sort({createdAt:-1}).lean();
    if (alloffers.length === 0) {
      createResponse({
        success: false,
        status: 200,
        message: "No offers available to show",
        data: [],
        res
      });
      return;
    }
    createResponse({
      success:true,
      status: 200,
      message: `Available offers are`,
      data: alloffers,
      res
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== "production") {
      console.error(error.message);
    }
    if(error instanceof Error){
      handleError(error,res);
      return
    }
  }
}

// update offer
export const updateOffer = async(req:Request,res:Response)=>{
    try {
      const {offerId} = req.query;
    if (!offerId) {
      createResponse({
        success: false,
        status: 404,
        message: "Provide offer Id",
        res
      });
      return;
    }

    const offer = await Offer.findById(offerId);
    if (!offer) {
       createResponse({
        success: false,
        status: 400,
        message: "Offer not exists",
        res
      });
      return;
    }

    const { expiresAt, appliesToCategories, usageLimit, value } = req.body;
    let query: Record<string, any> = {};

    if (typeof expiresAt !== 'undefined') query.expiresAt = expiresAt;
    if (typeof value !== 'undefined') query.value = value;
    if (typeof appliesToCategories !== 'undefined') query.appliesToCategories = appliesToCategories;
    if (typeof usageLimit !=='undefined') query.usageLimit = usageLimit;
    const updateOffer = await Offer.findByIdAndUpdate(
      offerId,
      {
        $set:query,
      },
      { new: true }
    );

     createResponse({
      success: true,
      status: 200,
      message: "Offer updated successfully",
      data: updateOffer,
      res
    });
    return;
  } catch (error: any) {
    if (process.env.NODE_ENV !== "production") {
      console.error(error.message);
    }
 if(error instanceof Error){
  handleError(error,res)
return;
}
handleError('Unknown Error occured',res);
return;
  }
}