import { dbConnect } from "../../db";
dbConnect();
import { Request, Response } from "express";

import { buildTree, createResponse, handleError } from "../../utils/heplers";
import { Category } from "../../models";
import slugify from "slugify";
import { v4 as uuid } from "uuid";
import mongoose from "mongoose";

export const createCategory = async (req: Request, res: Response) => {
  try {
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

    // Resolve parentId if parent name is provided
    let parentId = null;
    if (parent) {
      const parentcat = await Category.findOne({ name: parent });
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
    const exists = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      parent: parentId,
    });
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
    const category = await Category.create({
      name,
      parent: parentId,
      slug,
    });

    createResponse({
      success: true,
      status: 201,
      message: `Category created with name: ${name}`,
      data: category,
      res,
    });
    return;
  } catch (error: any) {
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
  try {
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

    const result = await Category.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(catId) }
      },
      {
        $graphLookup: {
          from: "categories",
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "parent",
          as: "descendants"
        }
      },
      {
        $project: {
          allIds: {
            $concatArrays: [
              ["$_id"],
              {
                $map: {
                  input: "$descendants",
                  as: "desc",
                  in: "$$desc._id"
                }
              }
            ]
          }
        }
      }
    ]);

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

    await Category.deleteMany({ _id: { $in: allIdsToDelete } });

     createResponse({
      success: true,
      message: `Deleted category and its ${allIdsToDelete.length - 1} subcategories.`,
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

    const allCategories = await Category.aggregate([
  { $match: { parent: null } },
  {
    $graphLookup: {
      from: "categories",
      startWith: "$_id",
      connectFromField: "_id",
      connectToField: "parent",
      as: "children"
    }
  }
])

    if (allCategories.length === 0) {
      createResponse({
        success: true,
        message: "No category to show add new ",
        status: 200,
        res,
      });
      return;
    }

    const nestedCategories = allCategories.map(cat =>{
      return {
        _id:cat._id,
        name:cat.name,
        parent:cat.parent,
        children:buildTree(cat._id,cat.children)
      }
    })
    createResponse({
      success: true,
      message: "Fetched categories are",
      status: 200,
      data:nestedCategories,
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


