import Banner from "../../models/Banner";
import { BannerIncomingDTO, BannerSchemaDTO, UpdateQueryDTO } from "../../types/banner";
import { PaginatedResult } from "../../types/product";
import { PaginationQuery } from "../../types/response";
import { pagination } from "../../utils/heplers";



export class BannerServiceClass {
    async CREATE_BANNER(data:BannerIncomingDTO):Promise<boolean>{
        try {
             const newBanner = await Banner.create(data);
              if(!newBanner) return false;
              return true;
        } catch (error) {
            console.error("Error during create Banner",error);
            throw new Error("Error during create new Banner")
        }
    }
    async FIND_BANNER_NORMAL(bannerId:string):Promise<boolean>{
        try {
            const isBanner = await Banner.findById(bannerId);
            if(!isBanner) return false;
              return true;
        } catch (error) {
            console.error("Error during create Banner",error);
            throw new Error("Error during create new Banner")
        }
    }
    async DELETE_BANNER(bannerId:string):Promise<boolean>{
        try {
            const deleteBanner = await Banner.findByIdAndDelete(bannerId);
            if(!deleteBanner) return false;
              return true;
        } catch (error) {
            console.error("Error during create Banner",error);
            throw new Error("Error during create new Banner")
        }
    }
    async UPDATE_BANNER({bannerId,body}:{bannerId:string,body:Partial<UpdateQueryDTO>}):Promise<boolean>{
        try {
             const updateQuery: Partial<UpdateQueryDTO> = {};
                if (body.description) updateQuery.description = body.description;
                if (body.couponValue) updateQuery.couponValue = body.couponValue;
                if (body.title) updateQuery.title = body.title;
                const updateOperation = Banner.findByIdAndUpdate(
                  bannerId,
                  { $set: updateQuery },
                  { new: true }
                );
            if(!updateOperation) return false;
              return true;
        } catch (error) {
            console.error("Error during create Banner",error);
            throw new Error("Error during create new Banner")
        }
    }
    async GET_ALL_BANNER(query:PaginationQuery):Promise<PaginatedResult<BannerIncomingDTO>>{
        try {
            const {limit,currentPage,skip,hasNextPage,hasPrevPage} = await pagination({query,model:Banner});
             const allBanner = await Banner.find().sort({createdAt:-1})
             .skip(skip)
             .limit(limit)
             .lean();
              if(!allBanner) throw new Error("Either not found / no banner yet");
              return {
                currentPage,
                hasNextPage,
                hasPrevPage,
                products:allBanner as unknown as BannerIncomingDTO[]
              }
        } catch (error) {
            console.error("Error during create Banner",error);
            throw new Error("Error during create new Banner")
        }
    }
}