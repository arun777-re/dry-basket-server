import { Category } from "../models";
import { OutgoingCategoryDTO } from "../types/category";


// simple services 

export class SimpleCategoryServices {

    // find category with name
    async getCategoryWithName ({catname}:{catname:string}):Promise<OutgoingCategoryDTO  | null>{
     try {
        const category = await Category.findOne({name:{$regex:catname,$options:"i"}}).lean();
        if(category === undefined) return null;

        return category as unknown as OutgoingCategoryDTO;
     } catch (error) {
        console.error("Error during get category",error);
        throw new Error("Error during fetch category by name")
     }
    }
}