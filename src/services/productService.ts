import { Product, Review } from "../models";
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



const categoryservice = new SimpleCategoryServices();

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
      const { skip, limit, currentPage, hasNextPage, hasPrevPage } =
        await pagination({ query: query, model: Product });
      let filterQuery: Record<string, any> = { category: catId };
      if (featured) {
        filterQuery.isFeatured = true;
      }
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

  //   get all products for search query
  async getProductsBySearchQuery({
    searchQueryIncoming,
  }: {
    searchQueryIncoming: SearchQuery;
  }): Promise<PaginatedResult<ProductOutgoingRequest> | null> {
    try {
      const paginationQuery = {
        page: searchQueryIncoming.page,
        limit: searchQueryIncoming.limit,
      };
      const { skip, limit, currentPage, hasNextPage, hasPrevPage } =
        await pagination({ query: paginationQuery, model: Product });

      const { category = "", price, productName = "" } = searchQueryIncoming;

      // build dynamic searchParams
      let searchQuery: Record<string, any> = {};

      if (typeof category === "string") {
        const categoryData = await categoryservice.getCategoryWithName({
          catname: category,
        });
        if (categoryData?._id) {
          searchQuery.category = new mongoose.Types.ObjectId(categoryData._id);
        }
      }

      if (price && !isNaN(price)) {
        searchQuery["variants"] = {
          $elemMatch: {
            price: { $lte: Number(price) },
          },
        };
      }

      if (typeof productName === "string") {
        const safeProductName = escapeRegex(productName || "");
        searchQuery.productName = { $regex: safeProductName, $options: "i" };
      }

      // search product based on the query
      const searchProducts = await Product.find(searchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      if (!searchProducts.length) return null;

      return {
        products: searchProducts as unknown as ProductOutgoingRequest[],
        hasNextPage,
        hasPrevPage,
        currentPage,
      };
    } catch (error) {
      console.error("Error occured during get products by search query", error);
      throw new Error("Error during get products using search query");
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
      const { skip, limit, currentPage, hasNextPage, hasPrevPage } =
        await pagination({ query: paginationQuery, model: Product });

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

      // search product based on the query
      const searchProducts = await Product.find(searchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      if (!searchProducts.length) return null;

      return {
        products: searchProducts as unknown as ProductOutgoingRequest[],
        hasNextPage,
        hasPrevPage,
        currentPage,
      };
    } catch (error) {
      console.error("Error occured during get products by search query", error);
      throw new Error("Error during get products using search query");
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
        .lean();

      if (!products) return null;
      return { products: products, currentPage, hasPrevPage, hasNextPage };
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
