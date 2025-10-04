import { dbConnect } from "../../db";
dbConnect();
import { Request, Response } from "express";

import { createResponse, handleError } from "../../utils/heplers";
import slugify from "slugify";
import { v4 as uuid } from "uuid";
import mongoose, { Types } from "mongoose";
import { CategoryService } from "../../services/category/categoryservice";
import { PaginationQuery } from "../../types/response";

const catservices = new CategoryService();

export const createCategory = async (req: Request, res: Response) => {
  // getting body as json from frontend
  const { name, parent } = req.body;

  if (!name || typeof name !== "string") {
    createResponse({
      success: false,
      status: 400,
      message: "Category Name is required",
      res,
    });
    return;
  }
  try {
    // Resolve parentId if parent name is provided
    let parentId: string | Types.ObjectId | undefined;
    if (parent && parent !== "") {
      const parentcat = await catservices.FINDPARENT_CATEGORY(parent);
      if (!parentcat) {
        createResponse({
          success: false,
          status: 400,
          message: "Parent category not found",
          res,
        });
        return;
      }
      parentId = parentcat._id;
    }

    // Check for existing category with same name and resolved parentId
    const exists = await catservices.IS_CATEGORY_Exists(name, parentId);
    if (exists) {
      createResponse({
        success: false,
        status: 400,
        message: "Category already exists under the same parent",
        res,
      });
      return;
    }

    // generate slug for each category
    const slug = slugify(`${name}-${uuid().slice(0, 4)}`, {
      lower: true,
      strict: true,
    });

    // create category
    const category = await catservices.CREATE_CATEGORY({
      name,
      parent: parentId,
      slug,
    });
    if (!category) {
      createResponse({
        success: false,
        status: 500,
        message: "Category creation failed",
        res,
      });
      return;
    }

    createResponse({
      success: true,
      status: 201,
      message: `Category created with name: ${name}`,
      data: category,
      res,
    });
    return;
  } catch (error: any) {
    if (error.name === "ValidationError" && error.errors) {
      const messages = Object.values(error.errors).map(
        (val: any) => val.message
      );
      handleError(messages.join(", "), res);
      return;
    }
    if (error.name === "CastError" && error.path === "parent") {
      return handleError("Invalid parent category ID", res);
    }

    if (error instanceof Error) {
      handleError(error, res);
      return;
    }
    handleError("Unknown error occured", res);
    return;
  }
};

// delete the main parent category
export const deleteCategory = async (req: Request, res: Response) => {
  const { catId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(catId)) {
    createResponse({
      success: false,
      message: "Invalid category ID",
      status: 400,
      res,
    });
    return;
  }
  try {
    const result = await catservices.FIND_CATEGORY_AGGREGATION(catId);
    if (!result.length) {
      createResponse({
        success: false,
        message: "Category not found",
        status: 404,
        res,
      });
      return;
    }

    const allIdsToDelete = result[0].allIds;

    const deleteOperation = await catservices.DELETE_CATEGORY(allIdsToDelete);
    if (!deleteOperation) {
      createResponse({
        success:false,
        message: `Something wrong during delete category`,
        status:404,
        res,
      });
      return;
    }

    createResponse({
      success: true,
      message: `Deleted category and its ${
        allIdsToDelete.length - 1
      } subcategories.`,
      status: 200,
      res,
    });
    return;
  } catch (error) {
    if (error instanceof Error) {
      handleError(error, res);
    } else {
      handleError("Unknown error occurred", res);
    }
  }
};

// get all category using aggregate method and recursive method $graphLookup to get all category in a flat array.
export const getAllCategory = async (req: Request, res: Response) => {
  try {
    const query = req.query as unknown as PaginationQuery;
    const allCategories = await catservices.FIND_ALL_CATEGORY(query);
    if (!allCategories) {
      createResponse({
        success: true,
        message: "No category to show add new ",
        status: 200,
        res,
      });
      return;
    }
    createResponse({
      success: true,
      message: "Fetched categories are",
      status: 200,
      data: allCategories.products,
      hasNextPage: allCategories.hasNextPage,
      hasPrevPage: allCategories.hasPrevPage,
      currentPage: allCategories.currentPage,
      res,
    });
    return;
  } catch (error) {
    if (error instanceof Error) {
      handleError(error, res);
      return;
    }
    handleError("Unknown error occurred", res);
    return;
  }
};
