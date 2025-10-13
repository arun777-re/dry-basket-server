import { Interaction, Product, Review } from "../models";
import mongoose, { ClientSession, Types } from "mongoose";
import {
  PaginatedResult,
  ProductIncomingRequest,
  ProductOutgoingRequest,
  SearchQuery,
  UpdateQuery
} from "../types/product";
import { escapeRegex, pagination } from "../utils/heplers";
import { SimpleCategoryServices } from "./categoryServices";
import { PaginationQuery } from "../types/response";
import { CategoryService } from "./category/categoryservice";



const categoryservice = new SimpleCategoryServices();
const categoriesservice = new CategoryService()

// services for simple use

export class SimpleProductService {
  // service to get product by slug field
  async getProductBySlug({
    slug,
  }: {
    slug: string;
  }): Promise<ProductOutgoingRequest | null> {
    try {
      const product = await Product.findOne({ slug });
      await product.toJSON();
      if (!product) return null;
      return product as unknown as ProductOutgoingRequest;
    } catch (error) {
      console.error("Error occurred while fetching product:", error);
      throw new Error("Error during finding product with slug");
    }
  }

  // get all featured products associated with a category
  async getFeaturedOrAllProductByCategory({
    query,
    catId,
    featured,
  }: {
    query: Record<string, any>;
    catId: string;
    featured: boolean;
  }): Promise<PaginatedResult<ProductOutgoingRequest> | null> {
    try {
      let filterQuery: Record<string, any> = { category: catId };
      if (featured) {
        filterQuery.isFeatured = true;
      }
      const { skip, limit, currentPage, hasNextPage, hasPrevPage } =
        await pagination({ query: query, model: Product,filter:filterQuery });
      
      // get all featured products related to a category
      const products = await Product.find(filterQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      if (!products) return null;
      return {
        products: products.map(item => item.toJSON()) as unknown as ProductOutgoingRequest[],
        currentPage,
        hasNextPage,
        hasPrevPage,
      };
    } catch (error) {
      console.error("Error occurred while fetching product:", {
        catId,
        featured,
        error,
      });
      throw new Error("Error during fetching products with category");
    }
  }

  //   get all products for search filter query
  async getProductsByFilterQuery({
    searchQueryIncoming,
  }: {
    searchQueryIncoming: SearchQuery;
  }): Promise<PaginatedResult<ProductOutgoingRequest> | null> {
    try {
       const { category = "", price, productName = "" ,weight = ""} = searchQueryIncoming;

      // build dynamic searchParams
      let searchQuery: Record<string, any> = {};

      if (category && typeof category === "string") {
        const categoryData = await categoriesservice.GET_LEAF_CATEGORIES(category);
        if (categoryData) {
          searchQuery.category = {$in:categoryData};
        }
      }

   if (price || weight) {
  let elemMatch: Record<string, any> = {};
  if (price && !isNaN(price)) {
    elemMatch.price = { $lte: Number(price) };
  }
  if (weight && !isNaN(weight)) {
    elemMatch.weight = Number(weight);
  }
  searchQuery["variants"] = { $elemMatch: elemMatch };
}

      if (typeof productName === "string" && productName?.trim()) {
        const safeProductName = escapeRegex(productName || "");
        searchQuery.productName = { $regex: safeProductName, $options: "i" };
      }
      const paginationQuery = {
        page: searchQueryIncoming.page,
        limit: searchQueryIncoming.limit,
      };
      const { skip, limit, currentPage, hasNextPage, hasPrevPage } =
        await pagination({ query: paginationQuery, model: Product ,filter:searchQuery});

      // search product based on the query
      const searchProducts = await Product.find(searchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        ;
      if (!searchProducts.length) return null;

      return {
        products: searchProducts.map((item)=> item.toJSON()) as unknown as ProductOutgoingRequest[],
        hasNextPage,
        hasPrevPage,
        currentPage,
      };
    } catch (error) {
      console.error("Error occured during get products by search query", error);
      throw new Error("Error during get products using search query");
    }
  }

  // get all products based on navbar search 
  async getProductsByNavbarSearch({searchQuery}:{searchQuery:{searchValue:string} & PaginationQuery})
  :Promise<PaginatedResult<ProductOutgoingRequest> | null>{
    try{
      
      const safeProductName = escapeRegex(searchQuery.searchValue || "");
      let categoryId:Types.ObjectId | string = "";
        const categoryData = await categoryservice.getCategoryWithName({
          catname:safeProductName});
        if (categoryData?._id) {
          categoryId = new mongoose.Types.ObjectId(categoryData._id);
        }
      const searchQueryFilter = { $or:[
        {productName:{$regex:safeProductName,$options:"i"}},
        {category:categoryId }
      ]
    };
      const query = {
        page:searchQuery.page,
        limit:searchQuery.limit
      }
         const { skip, limit, currentPage, hasNextPage, hasPrevPage } =
        await pagination({ query, model: Product,filter:searchQueryFilter });
    const searchProducts = await Product.find(searchQueryFilter).sort({createdAt:-1}).
    skip(skip).limit(limit);
    if(!searchProducts.length) {
     return {
        products:[],
        hasNextPage,
        hasPrevPage,
        currentPage,
      };
    };
    return {
        products: searchProducts.map((item)=> item.toJSON()) as unknown as ProductOutgoingRequest[],
        hasNextPage,
        hasPrevPage,
        currentPage,
      };

    }catch(error){
         console.error("Error occured during get products by navbar search query", error);
      throw new Error("Error during get products using navbar search query");
    }
  }
  //   get related products service
  async getRelatedByQuery({
    paginationQuery,
    searchQueryIncoming,
  }: {
    paginationQuery: Record<string, any>;
    searchQueryIncoming: SearchQuery;
  }): Promise<PaginatedResult<ProductOutgoingRequest> | null> {
    try {
       const { category = "", price, productName = "" } = searchQueryIncoming;

      // build dynamic searchParams
      let searchQuery: Record<string, any> = {};

      if (typeof category === "string") {
        if (!Types.ObjectId.isValid(category)) {
          throw new Error("category must be a objectId");
        } else {
          searchQuery.category = category;
        }
      }

      if (typeof productName === "string") {
        searchQuery.productName = { $ne: productName };
      }
      const { skip, limit, currentPage, hasNextPage, hasPrevPage } =
        await pagination({ query: paginationQuery, model: Product,filter:searchQuery });

     

      // search product based on the query
      const searchProducts = await Product.find(searchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)

      if (!searchProducts.length) return null;

      return {
        products: searchProducts.map((item)=> item.toJSON()) as unknown as ProductOutgoingRequest[],
        hasNextPage,
        hasPrevPage,
        currentPage,
      };
    } catch (error) {
      console.error("Error occured during get products by search query", error);
      throw new Error("Error during get products using search query");
    }
  }
  // get recommended products for user based on interactions 
  async getRecommendedByQuery ({userId,query}:{userId:string,query:PaginationQuery}){
    try {
      const userProductScores = await Interaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
    $group: {
      _id: "$productId",
      totalWeight: { $sum: "$weight" },
       },
      },
      { $sort: { totalWeight: -1 } },
  { $limit: 10 },
  {
    $lookup: {
      from: "products",
      localField: "_id",
      foreignField: "_id",
      as: "product",
    },
  },
  { $unwind: "$product" },
]);
const categoryIds = userProductScores.map(p => p.product.categoryId);
const filter = {categoryId:{$in:categoryIds}}
const {hasNextPage,hasPrevPage,currentPage,skip,limit} = await pagination({query,model:Product,filter})

const recommended = await Product.find({
  categoryId: { $in: categoryIds },
}).limit(limit).skip(skip);
console.log("hello loda",recommended)
return {
  hasNextPage:hasNextPage,
  hasPrevPage:hasPrevPage,
  currentPage:currentPage,
  products:recommended.map((i) => i.toJSON())
};
    } catch (error) {
      console.error("Error during find recommended products",error)
      throw new Error("Error during find recommended products")
    }
  }

  // by mongodb prisma query
  async getAllWeightsOfProducts (){
    try {
      const weight = await Product.distinct("variants.weight");
      return weight.sort((a,b)=>a-b);
    } catch (error) {
         console.error("Error during get weights of all products", error);
      throw new Error("Error during get weights of all products");
    }
  }

  async getProductsForLessStock({query}:{query:PaginationQuery}){
    try {
    const threshHold = 60;
    const filter = {
      "variants.stock":{$lt:Number(threshHold)}
    }
    const {currentPage,hasNextPage,hasPrevPage,skip,limit} = await pagination({query,model:Product,filter});
    const lowStockProducts = await Product.aggregate([
      {$unwind:"$variants"},
      {$match:{"variants.stock":{$lt:threshHold}}},
      {
        $project:{
          productName:1,
          category:1,
          featured:1,
          tags:1,
          createdAt:1,
          slug:1,
          "variants.stock":1,
          "variants.weight":1,
          images:1,
        }
      },
      {$sort:{createdAt:-1}},
      {$skip:skip},
      {$limit:limit},
    ]);
         return {
          hasNextPage:hasNextPage,
          hasPrevPage:hasPrevPage,
          currentPage:currentPage,
          products:lowStockProducts
         }
    } catch (error:any) {
      console.error("Error during get low stock products",error);
      throw new Error(`Error during get low stock products:${error.message}`);
    }
  }

  async getProductWithName(productName:string):Promise<ProductOutgoingRequest | null>{
    try {
      const safeProductName = escapeRegex(productName.trim())
      const product = await Product.findOne({productName:{$regex:safeProductName,$options:"i"}}).populate('category');
      if(!product) return null;
      return product.toJSON()
    } catch (error:any) {
      console.error("Error during find product by name",error);
      throw new Error(`Error during find pr  oduct by name:${error.message}`);
    }
  }
}

// class to crud operation service
export class ProductService {
  async createProductService({ data }: { data: ProductIncomingRequest }) {
    try {
      const newProduct = await Product.create(data);
      return { message: `${newProduct.productName} created successfully` };
    } catch (error) {
      console.error("ProductService Error:", {
        data,
        error: error instanceof Error ? error.message : error,
      });
      throw new Error("Error during create product");
    }
  }

  async deleteProductService({
    slug,
    session,
  }: {
    slug: string;
    session: ClientSession;
  }): Promise<{ message: string } | null> {
    try {
      const removeAction = await Product.findOneAndDelete({ slug });
      if (!removeAction) return null;
      await Review.deleteMany({ productId: removeAction._id }, { session });
      return { message: `${removeAction.productName} deleted successfully` };
    } catch (error) {
      console.error("ProductService Error:", {
        slug,
        error: error instanceof Error ? error.message : error,
      });
      throw new Error("Error during delete product");
    }
  }

  // update product
  async updateProductService({
    query,
    slug,
    session,
  }: {
    query: UpdateQuery;
    slug: string;
    session: ClientSession;
  }): Promise<{ message: string } | null> {
    try {
      const updatedQuery: Record<string, any> = {};

      if (query.isFeatured !== undefined) {
        updatedQuery.isFeatured = query.isFeatured;
      }

      if (query.tags) {
        updatedQuery.tags = query.tags;
      }

      if (query.variants) {
        updatedQuery.variants = query.variants;
      }

      // update product based on query coming
      const updateProduct = await Product.findOneAndUpdate(
        { slug },
        { $set: updatedQuery },
        {
          new: true,
          session,
        }
      );

      if (!updateProduct) return null;
      return { message: `${updateProduct.productName} is updated successfull` };
    } catch (error) {
      console.error(`[ProductService][Update][${slug}] Error:`, error);

      throw new Error("Error during delete product");
    }
  }

  async getAllProducts({
    query,
  }: {
    query: Record<string, any>;
  }): Promise<any | null> {
    try {
      const { limit, skip, currentPage, hasPrevPage, hasNextPage } =
        await pagination({ query, model: Product });
      // find all products
      const products = await Product.find()
        .populate({
          path: "category",
          select: "name -_id",
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        ;

      if (!products) return null;
      return { products: products.map((i)=> i.toJSON()) as unknown as ProductOutgoingRequest[], currentPage, hasPrevPage, hasNextPage };
    } catch (error) {
      console.error(`[ProductService][Get All] Error:`, error);
      throw new Error("Error during fetching products");
    }
  }
}

// services for business logic like updates in db
export class ProductBusinessService {
  // service to check whether product exists with productId
  async getProductById({productId,session}:{productId: string, session?: ClientSession}) {
    try {
      const product = await Product.findById(productId).session(
        session || null
      );
      return product;
    } catch (error) {
      console.error("Error occurred while fetching product:", error);
      throw new Error("Error during finding product");
    }
  }
}
