import { Types,Document } from "mongoose";



// incoming/update data structures
export interface IncomingCategoryDTO {
    name:string;
    parent?:Types.ObjectId | string;
}

export interface OutgoingCategoryDTO extends IncomingCategoryDTO {
    slug:string;
    _id:string;
}

// model data shape
export interface CategoryDocument extends OutgoingCategoryDTO , Document{}
