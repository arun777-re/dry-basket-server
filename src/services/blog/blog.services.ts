import Blog from "../../models/Blog";
import { BlogIncomingReqDTO, BlogOutgoingDTO } from "../../types/blog";
import { PaginatedResult } from "../../types/product";
import { pagination } from "../../utils/heplers";


export class BlogServiceClass { 
   async createBlog(body:BlogIncomingReqDTO,slug:string):Promise<boolean>{
      try{
  const newBlog = await Blog.create({...body,slug:slug});
  if(!newBlog) return false;
  return true;
      }catch(error){
         console.error("Error during create Blog",error);
         throw new Error("Error during create Blog");
      }
   }
    async deleteBlog(slug:string):Promise<boolean>{
     try {
        const dlt = await Blog.findOneAndDelete({slug:slug});
        if(!dlt) return false;
        return true;
     } catch (error) {
        console.error("Error during delete Blog",error);
        throw new Error("Error during delete Blog");
     }
    }
    async getBlogBySlug(slug:string):Promise<BlogOutgoingDTO>{
     try {
        const findBlog = await Blog.findOne({slug:slug}).lean();
        return findBlog as unknown as BlogOutgoingDTO;
     } catch (error) {
        console.error("Error during delete Blog",error);
        throw new Error("Error during delete Blog");
     }
    }
    async getAllBlogs({query}:{query:Record<string,any>}):Promise<PaginatedResult<BlogOutgoingDTO>>{
     try {
        const { skip,currentPage,hasNextPage,hasPrevPage,limit} = await pagination({query,model:Blog})
        const findBlogs = await Blog.find().sort({createdAt:-1})
        .skip(skip).limit(limit).lean();
        return {
            currentPage,
            hasNextPage,
            hasPrevPage,
            products:findBlogs
        } as unknown as PaginatedResult<BlogOutgoingDTO>;
     } catch (error) {
        console.error("Error during delete Blog",error);
        throw new Error("Error during delete Blog");
     }
    }
    async updateBlog(slug:string,body:Partial<BlogIncomingReqDTO>):Promise<BlogOutgoingDTO | null>{
    try {
      const updateBody:Partial<BlogIncomingReqDTO> = {};
      if(body.tags) updateBody.tags = body.tags;
      if(body.heading) updateBody.heading = body.heading;
      if(Object.keys(updateBody).length === 0){
         return null;
      }
      const updateBlogOperation = await Blog.findOneAndUpdate({slug:slug},{
         $set:updateBody
      },{new:true});
      return updateBlogOperation
    } catch (error) {
        console.error("Error during update Blog",error);
        throw new Error("Error during update Blog");
    }
    }
}