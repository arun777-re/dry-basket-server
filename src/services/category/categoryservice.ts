import mongoose, { Types } from "mongoose";
import { Category } from "../../models";
import { IncomingCategoryDTO, OutgoingCategoryDTO } from "../../types/category";
import { buildTree, pagination } from "../../utils/heplers";
import { PaginationQuery } from "../../types/response";
import { PaginatedResult } from "../../types/product";



export class CategoryService {
    async CREATE_CATEGORY(body:IncomingCategoryDTO):Promise<boolean>{
        try {
            const category = await Category.create(body);
            if(!category) return false;
            return true;
        } catch (error) {
            console.error("Error during create category",error);
            throw new Error("Error during create category");
        }
    }

    async FINDPARENT_CATEGORY(parent:string):Promise<{_id:string} | null>{
        try {
            const parentCategory = await Category.findOne({name:parent});
            if(!parent) return null;
            return {_id:parentCategory._id.toString()};
        } catch (error) {
            console.error("Error during find parent category",error);
            throw new Error("Error during find parent category");
        }
    }

    async IS_CATEGORY_Exists(name:string,parentId?:string | Types.ObjectId):Promise<boolean>{
        try {
            const parent = await Category.findOne({
                  name: { $regex: new RegExp(`^${name}$`, "i") },
                  parent: parentId,
                });
            if(!parent) return false;
            return true;
        } catch (error) {
            console.error("Error during find is category exits",error);
            throw new Error("Error during find is category exits");
        }
    }

    // delete parent and all its nested childs
    async DELETE_CATEGORY(allIdsToDelete:string){
        try {
            const deleteCategory = await  Category.deleteMany({ _id: { $in: allIdsToDelete } });
            return deleteCategory;
        } catch (error) {
            console.error("Error during delete category",error);
            throw new Error("Error during delete category");
        }
    }

    // find all categories with parents and nested childs
    async FIND_ALL_CATEGORY(query:PaginationQuery):Promise<PaginatedResult<OutgoingCategoryDTO> | null>{
        try {
            const {limit,skip,hasNextPage,hasPrevPage,currentPage} = await pagination({query,model:Category});
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
              },
              { $skip: skip },
              { $limit: limit }
            ]);

            if(!allCategories || allCategories.length === 0) return null;
            const nestedCategories = allCategories.map(cat =>{
                  return {
                    _id:cat._id,
                    name:cat.name,
                    parent:cat.parent,
                    children:buildTree(cat._id,cat.children),
                    slug:cat.slug
                  }
                });
                return {
                    currentPage,
                    hasNextPage,
                    hasPrevPage,
                    products:nestedCategories};
        } catch (error) {
            console.error("Error during delete category",error);
            throw new Error("Error during delete category");
        }
    }
    // this is to get a full category parent with all its nested childs
    async FIND_CATEGORY_AGGREGATION(catId:string){
        try {
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
            return result;
        } catch (error) {
            console.error("Error during find parent category",error);
            throw new Error("Error during find parent category");
        }
    }

async GET_LEAF_CATEGORIES(catId: string | string[]): Promise<string[]> {
  try {
    // normalize to array
    const idsArray: string[] = Array.isArray(catId)
      ? catId
      : catId.split(",").map((id) => id.trim());

    // filter valid ObjectId only
    const validIds = idsArray.filter((id) => /^[0-9a-fA-F]{24}$/.test(id));
    if (validIds.length === 0) return [];

    const result = await Category.aggregate([
      { $match: { _id: { $in: validIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
      {
        $graphLookup: {
          from: "categories",
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "parent",
          as: "descendants",
        },
      },
      {
        $project: {
          allCategories: {
            $concatArrays: [
              ["$_id"],
              { $map: { input: "$descendants", as: "d", in: "$$d._id" } },
            ],
          },
          descendants: 1,
        },
      },
    ]);

    if (!result || result.length === 0) return [];

    // combine all results from multiple categories
    const allIdsSet = new Set<string>();
    result.forEach((r) => {
      const allIds: mongoose.Types.ObjectId[] = r.allCategories;
      const descendants = r.descendants;
      const parentIds = new Set(descendants.map((d: any) => d.parent?.toString()).filter(Boolean));

      allIds.forEach((id) => {
        const strId = id.toString();
        if (!parentIds.has(strId)) allIdsSet.add(strId);
      });
    });

    return Array.from(allIdsSet);
  } catch (error) {
    console.error("Error in GET_LEAF_CATEGORIES:", error);
    throw new Error("Error fetching leaf categories");
  }
}

}