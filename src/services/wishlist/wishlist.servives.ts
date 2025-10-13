import Wishlist from "../../models/Wishlist";
import { PaginatedResult } from "../../types/product";
import { PaginationQuery } from "../../types/response";
import { WishlistIncomingDTO, WishlistOutgoingDTO } from "../../types/wishlist";
import { pagination } from "../../utils/heplers";



export class WishlistClass {
    // upsertt:true creates new doc if not exists already
    async toggleWishlist({productId,userId}:WishlistIncomingDTO):Promise<boolean>{
        try {
            await Wishlist.updateOne({
                productId,
                userId
            },{$setOnInsert:{productId,userId}},{
                upsert:true
            });
            return true;

        } catch (error:any) {
            if(error.code === 11000) return false;                                 
            console.error("Error during add item to wishlist",error);
            throw new Error("Error during add item to wishlist");
        }
    }
    async isItemInWishlist({productId,userId}:WishlistIncomingDTO):Promise<boolean>{
        try {
            const item = await Wishlist.findOne({userId,
                productId
            });
            return !!item;

        } catch (error) {
            console.error("Error during find a item from wishlist",error);
            throw new Error("Error during find a item from wishlist");
        }
    }
    async removeItemFromWishlist({productId,userId}:WishlistIncomingDTO):Promise<boolean>{
        try {
            const item = await Wishlist.deleteOne({userId,
                productId
            });
            return item.deletedCount > 0;

        } catch (error) {
            console.error("Error during remove item from wishlist",error);
            throw new Error("Error during remove item from wishlist");
        }
    }

    async removeallItemFromWishlist({userId}:{userId:string}):Promise<boolean>{
        try {
            const item = await Wishlist.deleteMany({userId,
            });
            return item.deletedCount > 0;

        } catch (error) {
            console.error("Error during remove item from wishlist",error);
            throw new Error("Error during remove item from wishlist");
        }
    }
    async getAllItemFromWishlist({userId,query}:{userId:string,query:PaginationQuery}):Promise<PaginatedResult<WishlistOutgoingDTO> | null>{
        try {
            const {limit,skip,currentPage,hasNextPage,hasPrevPage} = await pagination({query,model:Wishlist});
            const item = await Wishlist.find({
                userId
            }).sort({createdAt:-1}).limit(limit).skip(skip).populate("productId");
            if(!item) return null;
            return  {
                hasNextPage:hasNextPage,
                hasPrevPage:hasPrevPage,
                currentPage:currentPage,
                products:item.map((item)=> item.toJSON()) as unknown as WishlistOutgoingDTO[],
            };

        } catch (error) {
            console.error("Error during get item from wishlist",error);
            throw new Error("Error during get item from wishlist");
        }
    }
}