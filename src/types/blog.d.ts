export interface BlogIncomingReqDTO {
    title:string;
    blogImage:string;
    authorName:string;
    description:string;
    heading:string;
    tags:[string];
}


export interface BlogsSchemaDTO extends Document,BlogIncomingReqDTO{
    slug:string;
    createdAt:Date;
    updatedAt:Date;
    __v:number;
    _id:string;
}

export type BlogOutgoingDTO = Omit<BlogsSchemaDTO, "__v" | "_id">
    