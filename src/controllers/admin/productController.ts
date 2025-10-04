import { Response, Request } from "express";
import {
  createResponse,
  validateFields,
  getValidLeafCategory,
  handleError,
} from "../../utils/heplers";
import slugify from "slugify";
import { v4 as uuid } from "uuid";
import { ProductService } from "../../services/productService";
import mongoose from "mongoose";

const ServiceClass = new ProductService();

// createProduct
export const createProduct = async (req: Request, res: Response) => {
  try {
    // step 1 getting data from the form
    const {
      productName,
      description,
      status,
      category,
      isFeatured,
      tags,
      variants,
      images,
    } = req.body;
    // Basic validation using function
    validateFields(
      {
        productName,
        description,
        status,
        category,
        tags,
        variants,
        images,
        isFeatured,
      },
      res
    );

    // after using multer for multipart/formdata then sends images not as [string] either only single string therefore we have to parse them
    let parsedImages;
    let parsedVariants;
    let parsedTags;
    try {
      parsedImages = JSON.parse(images);
      parsedVariants = JSON.parse(variants);
      parsedTags = JSON.parse(tags);
    } catch (error) {
      createResponse({
        res,
        success: false,
        status: 400,
        message: "Invalid images data/variants/tags",
      });
      return;
    }

    // checking whether images atleast 2 and not large than 5
    if (!Array.isArray(parsedImages) || parsedImages.length < 2 || parsedImages.length > 5) {
      createResponse({
        success: false,
        message: "Provide atleast 2 to 5 images for the product",
        status: 400,
        res,
      });
      return;
    }

    // check whether any category exits with same name and it is not a parent category means it is the leaf category
    const catId = await getValidLeafCategory(category);

    // generate a unique slug
    const slug = slugify(`${category}-${productName}-${uuid().slice(0, 6)}`, {
      lower: true,
      strict: true,
    });

    // sending data to service
    const data = {
              productName,
              category: catId,
              status,
              description,
              tags:parsedTags,
              variants:parsedVariants,
              images:parsedImages,
              isFeatured,
              slug,
            }
    const product = await ServiceClass.createProductService({data:data})

    createResponse({
      success: true,
      status: 201,
      message: "Product created successfully",
      data: product,
      res,
    });
    return;
  } catch (error: any) {
    handleError(error,res);
    return;
  }
};

// delete product
export const deleteProduct = async(req:Request,res:Response)=>{
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
      const slug = req.params.slug?.trim();
      if(!slug){
       await session.abortTransaction();
         session.endSession()
        createResponse({
          success:false,
          message:"Provide proper data of slug to delete",
          status:400,
          res
        });
        return;
      }

      const result = await ServiceClass.deleteProductService({slug,session:session});

      if(!result){
       await session.abortTransaction();
        session.endSession()
           createResponse({
          success:false,
          message:"Product deletion operation failed",
          status:404,
          res
        });
        return;
      }
     await session.commitTransaction();
       createResponse({
          success:true,
          message:result.message,
          status:200,
          res
        });
        return;
  } catch (error) {
    await session.abortTransaction();
    handleError(error,res);
  }finally{
    session.endSession();
  }
}

//update product
export const updateProduct = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const slug = req.params.slug.trim();
    let { isFeatured, tags, variants} = req.body;

    if(typeof isFeatured === 'string'){
      isFeatured = isFeatured === 'true';
    }
    // parse the nested data coming from request
    if(typeof tags === 'string'){
tags = JSON.parse(tags)
    }
    if(typeof variants === 'string'){
variants = JSON.parse(variants)
    }

    if (isFeatured === undefined && !tags && !variants) {
      session.abortTransaction();
      createResponse({
        success: false,
        status: 400,
        message: "Provide atleast one field to update product",
        res,
      });
      return;
    }

   const result = await ServiceClass.updateProductService({slug,query:{isFeatured:isFeatured,
    tags:tags,
    variants:variants,
    
   },session});

    if (!result) {
      await session.abortTransaction();
      session.endSession()
      createResponse({
        success: false,
        status: 404,
        message: "Product not updated",
        res,
      });
      return;
    }
await session.commitTransaction();

    createResponse({
      success: true,
      status: 200,
      message: result.message,
      res,
    });
    return;
  } catch (error) {
    session.abortTransaction();
    if (error instanceof Error) {
      handleError(error, res);
      return;
    }
    handleError("Unknown error occured", res);
    return;
  }finally{
    session.endSession();
  }
};

// get all products
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const query = req.query;

   if(!query){
    createResponse({
      success:false,
      message:"Provide pagination details for pagination",
      status:400,
      res
    });
    return;
   }

const allProducts = await ServiceClass.getAllProducts({query:query});
    if (allProducts?.products.length === 0) {
      createResponse({
        success: false,
        message: "No Products created yet.",
        status:200,
        res,
        data:[]
      });
      return;
    }
    createResponse({
      success: true,
      message: "Products fetched successfully.",
      status: 200,
      res,
      data:allProducts.products,
      currentPage:allProducts.currentPage,
      hasPrevPage:allProducts.hasPrevPage,
      hasNextPage:allProducts.hasPrevPage,
    });
    return;
  } catch (error) {
      handleError(error, res);
      return;
  }
};