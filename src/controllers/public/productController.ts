import { Request, Response } from "express";
import { createResponse, handleError } from "../../utils/heplers";
import { SimpleProductService } from "../../services/productService";
import { SimpleCategoryServices } from "../../services/categoryServices";
import mongoose from "mongoose";
import { cacheServices } from "../../services/redis/cache";
import {
  PaginatedResult,
  PopulatedProduct,
  ProductOutgoingRequest,
} from "../../types/product";
import {
  cacheKeyToGetAllCategoryProducts,
  cacheKeyToGetFeaturedProducts,
  cacheKeyToGetRecommendedProducts,
  cacheKeyToGetRelatedProducts,
  cacheKeyToGetFilterProducts,
} from "../../utils/cacheKeyUtils";
import { validateId } from "../../utils/cartUtils";
import { CustomReq } from "../../types/customreq";
import { InteractionService } from "../../services/interaction/action.service";
import { PaginationQuery } from "../../types/response";
// class call
const ServiceClass = new SimpleProductService();

const CategoryService = new SimpleCategoryServices();

const interactservice = new InteractionService();

// get a product

export const getSingleProduct = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug?.trim();
    if (!slug) {
      createResponse({
        success: false,
        message: "Provide an appropriate product id",
        status: 400,
        res,
      });
      return;
    }

    let product = await cacheServices.get<PopulatedProduct>(`product:${slug}`);
    if (!product) {
      // find one product by slug from database
      product = await ServiceClass.getProductBySlug({ slug });
    }

    // if product is not found in db
    if (!product) {
      createResponse({
        success: false,
        message: `Product not found with slug:${slug}`,
        status: 404,
        res,
      });
      return;
    }

    // send success response
    createResponse({
      success: true,
      message: "Product found ",
      status: 200,
      data: product,
      res,
    });
    return;
  } catch (error) {
    handleError(error, res);
    return;
  }
};

// get all product means featured products by category name that we have to show at home page also provide here pagination

export const getAllFeaturedProduct = async (req: Request, res: Response) => {
  try {
    const catname = req.params.catname?.trim();
    const query = req.query;
    if (!catname) {
      createResponse({
        success: false,
        message: "Provide appropriate category name",
        status: 400,
        res,
      });
      return;
    }

    // first check whether this category exists or not
    const isExists = await CategoryService.getCategoryWithName({ catname });
    if (!isExists) {
      createResponse({
        success: false,
        message: "Category doest not exists with provided name",
        status: 404,
        res,
      });
      return;
    }
    // get all featured products by category
    const cachekey = cacheKeyToGetFeaturedProducts(query, isExists._id);
    let result = await cacheServices.get<PaginatedResult<PopulatedProduct>>(
      cachekey
    );
    if (!result) {
      result = await ServiceClass.getFeaturedOrAllProductByCategory({
        catId: isExists._id,
        query: query,
        featured: true,
      });
    }

    // if there is no featured product in db
    if (!result || !result.products?.length) {
      createResponse({
        success: false,
        message: "No Featured Product found yet",
        status: 200,
        res,
        data: [],
      });
      return;
    }

    await cacheServices.set<PaginatedResult<PopulatedProduct>>(
      `featuredProducts:${isExists._id}:${JSON.stringify(query)}`,
      result,
      60 * 30 // cache for 30mins
    );
    createResponse({
      success: true,
      message: "All featured Products are:",
      status: 200,
      data: result.products,
      res,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    });
    return;
  } catch (error) {
    handleError(error, res);
    return;
  }
};

// get all products based on search filter
export const getSearchProducts = async (req: Request, res: Response) => {
   const { category, price, productName,weight, page, limit } = req.query;
    const safePage = parseFloat(page as string);
    const safeLimit = parseFloat(limit as string);
    const safeWeight = parseFloat(weight as string);
    const safeCatId = (category as string).trim()
    // false if one is provided
    if (!category && !price && !productName && !safeWeight) {
      createResponse({
        success: false,
        message: "Provide atleast one product detail to search",
        status: 400,
        res,
      });
      return;
    }
  try {
   
    validateId(safeCatId)
    const cacheKey = cacheKeyToGetFilterProducts({
      category: category as string,
      price: price as string,
      limit:safeLimit,
      page:safeLimit,
      productName:productName as string,
      weight:weight as string
    });
    let result = await cacheServices.get<
      PaginatedResult<ProductOutgoingRequest>
    >(cacheKey);
    if (!result) {
      // get all products based on search query
      result = await ServiceClass.getProductsByFilterQuery({
        searchQueryIncoming: {
          category: category as string,
          price: parseFloat(price as string),
          productName: productName as string,
          page: safePage,
          limit: safeLimit,
        },
      });
    }

    if (!result || !result.products.length) {
      createResponse({
        success: false,
        message: "No items found related to your search",
        status: 404,
        res,
      });
      return;
    }

    await cacheServices.set<PaginatedResult<ProductOutgoingRequest>>(
      cacheKey,
      result,
      60 * 60 * 1
    );
    createResponse({
      success: true,
      message: "Searched Products are",
      status: 200,
      data: result.products,
      currentPage: result.currentPage,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
      res,
    });
    return;
  } catch (error) {
    handleError(error, res);
    return;
  }
};
// get all products based on search filter
export const getProductsNavSearch = async (req: Request, res: Response) => {
  try {
    const { searchValue, page, limit } = req.query;
    const safePage = parseFloat(page as string);
    const safeLimit = parseFloat(limit as string);
    // false if one is provided
    if (!searchValue) {
      createResponse({
        success: false,
        message: "Provide atleast one product detail to search",
        status: 400,
        res,
      });
      return;
    }
    const searchQuery = {
      searchValue: searchValue as string,
      page: safePage,
      limit: safeLimit,
    };
    const result = await ServiceClass.getProductsByNavbarSearch({
      searchQuery,
    });

    if (!result || !result.products.length) {
      createResponse({
        success:true,
        message: "No items found related to your search",
        status:200,
        res,
        data:[],
        hasPrevPage:result?.hasPrevPage,
        hasNextPage:result?.hasNextPage,
        currentPage:result?.currentPage,

      });
      return;
    }
    createResponse({
      success: true,
      message: "Searched Products are",
      status: 200,
      data: result.products,
      currentPage: result.currentPage,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
      res,
    });
    return;
  } catch (error) {
    handleError(error, res);
    return;
  }
};

// get all related products
export const getRelatedProducts = async (req: Request, res: Response) => {
  try {
    const { category, productName } = req.query;
    const query = req.query;
    if (!category && !productName) {
      createResponse({
        success: false,
        message: "Provide product data to fetch related products",
        status: 400,
        res,
      });
      return;
    }
    const cacheKey = cacheKeyToGetRelatedProducts({query,category:category as string,productName:productName as string})
    let result = await cacheServices.get<PaginatedResult<PopulatedProduct>>(
      cacheKey
    );
    // find related products excluding same productName
    if (!result) {
      result = await ServiceClass.getRelatedByQuery({
        paginationQuery: query as Record<string, any>,
        searchQueryIncoming: {
          category: category as string,
          productName: productName as string,
        },
      });
    }

    if (!result || result?.products.length === 0) {
      createResponse({
        success: false,
        message: "No related Products found",
        status: 404,
        res,
      });
      return;
    }

    await cacheServices.set<PaginatedResult<PopulatedProduct>>(
      cacheKey,
      result,
      60 * 60 * 1
    );
    // send success response
    createResponse({
      success: true,
      message: `${result?.products.length} Related  Products found`,
      status: 200,
      data: result?.products,
      currentPage: result?.currentPage,
      hasNextPage: result?.hasNextPage,
      hasPrevPage: result?.hasPrevPage,
      res,
    });
    return;
  } catch (error) {
    if (error instanceof Error) {
      handleError(error, res);
      return;
    }
    handleError("Unknown error occured", res);
    return;
  }
};

// get recommended featured products to increase sale by category id on product page
export const getRecommendedProducts = async (req: Request, res: Response) => {
      const { catId } = req.params;
    const query = req.query;
    if (
      !catId ||
      (typeof catId === "string" && !mongoose.Types.ObjectId.isValid(catId))
    ) {
      createResponse({
        message: "Provide appropriate category id",
        status: 400,
        success: false,
        res,
      });
      return;
    }
  try {
    const cacheKey = cacheKeyToGetRecommendedProducts({catId:catId as string,query})
    let allProducts = await cacheServices.get<
      PaginatedResult<ProductOutgoingRequest>
    >(cacheKey);
    if (!allProducts) {
      // get all featured products by category
      allProducts = await ServiceClass.getFeaturedOrAllProductByCategory({
        query: query as Record<string, any>,
        catId: catId as string,
        featured: true,
      });
    }

    if (!allProducts || allProducts?.products.length === 0) {
      createResponse({
        message: "No Items Found",
        status: 404,
        success: false,
        res,
      });
      return;
    }

    await cacheServices.set<PaginatedResult<ProductOutgoingRequest>>(
      cacheKey,
      allProducts,
      60 * 60 * 1
    );
    createResponse({
      message: "Fetched recommended products",
      status: 200,
      success: true,
      res,
      data: allProducts?.products,
      currentPage: allProducts?.currentPage,
      hasNextPage: allProducts?.hasNextPage,
      hasPrevPage: allProducts?.hasPrevPage,
    });
    return;
  } catch (error) {
    handleError(error, res);
    return;
  }
};

// get recommended products for a user after login based on interaction
export const getUserRecommendedProduc = async (req:CustomReq, res: Response) => {
  const userId = req.user?._id;
  const query = req.query;
  try {
    if(userId && await interactservice.lengthOfModel(userId as string) > 0){
        const allproducts = await ServiceClass.getRecommendedByQuery({userId:userId as string,query:query as unknown as  PaginationQuery});
        if(!allproducts?.products?.length){
           return getRecommendedProducts(req,res); 
        }
        createResponse({
          success:false,
          status:200,
          message:"fetched recommended products based on interact",
          res,
          data:allproducts?.products,
          hasNextPage:allproducts?.hasNextPage,
          hasPrevPage:allproducts?.hasPrevPage,
          currentPage:allproducts?.currentPage
        });
        return;

    }else{
    return getRecommendedProducts(req,res);
    }

  } catch (error) {
    handleError(error, res);
    return;
  }
};

// get all products related to a category
export const getAllCategoryProduct = async (req: Request, res: Response) => {
  try {
    const query = req.query;
    const catname = req.params.catname?.trim();

    if (!catname) {
      createResponse({
        message: "Category Id is required",
        status: 400,
        success: false,
        res,
      });
      return;
    }

    // first check is this category exists in db or not
    const isExists = await CategoryService.getCategoryWithName({ catname });
    if (!isExists) {
      createResponse({
        message: "No such category exists",
        status: 404,
        success: false,
        res,
      });
      return;
    }
    const cacheKey = cacheKeyToGetAllCategoryProducts({catId:isExists._id,query});
    // get all products related to a category
    let result = await cacheServices.get<
      PaginatedResult<ProductOutgoingRequest>
    >(cacheKey);
    if (!result) {
      result = await ServiceClass.getFeaturedOrAllProductByCategory({
        query: query as Record<string, any>,
        catId: isExists._id,
        featured: false,
      });
    }

    if (!result || result?.products.length === 0) {
      createResponse({
        message: "No Products found associated with this category",
        status: 404,
        success: false,
        res,
      });
      return;
    }

    await cacheServices.set<PaginatedResult<ProductOutgoingRequest>>(
      cacheKey,
      result,
      60 * 60 * 1
    );
    createResponse({
      message: `Products fetched successfully associated with category:${catname}`,
      status: 200,
      success: true,
      data: result?.products,
      currentPage: result?.currentPage,
      hasNextPage: result?.hasNextPage,
      hasPrevPage: result?.hasPrevPage,
      res,
    });
    return;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    handleError(error, res);
    return;
  }
};

// get all products weight assigned into product model using mongoose prisma method distinct
export const getDistinctweights = async(req:Request,res:Response)=>{
  try {
    const weights = await ServiceClass.getAllWeightsOfProducts();
    createResponse({
      success:true,
      message:"Weights used for products",
      status:200,
      data:weights,
      res
    });
    return;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    handleError(error, res);
    return;
  }
}

