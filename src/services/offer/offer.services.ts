import { ClientSession } from "mongoose";
import { Offer } from "../../models";
import { OfferDocument, OfferIncomingDTO, OfferSchemaDTO } from "../../types/offer";

export class OfferCRUDService {
    async createOffer({data}:{data:OfferIncomingDTO}):Promise<OfferSchemaDTO | null>{
        try {
            const newOffer = await Offer.create({
                ...data
            });

            if(!newOffer) {
                throw new Error("Failed to create offer");
            }
            return newOffer;
        } catch (error) {
            console.error("Error creating offer:", error);
            throw error;
            
        }
    }
    async deleteOfferById({offerId,session}:{offerId:string,session?:ClientSession}):Promise<boolean>{
        try {
            const result = await Offer.findByIdAndDelete(offerId, { session });
            if (!result) {
                throw new Error("Offer not found or already deleted");
            }
            return true;
        } catch (error) {
            console.error("Error deleting offer:", error);
            throw new Error("Failed to delete offer");
            
        }
    }

    async getAllOffer():Promise<OfferDocument[] | null>{
    try {
        const allOffers = await Offer.find().sort({createdAt:-1}).lean();
        if(allOffers.length === 0) return null;
        return allOffers.length > 0 ? allOffers as unknown as OfferDocument[] : null;
    }catch(error){
        console.error("Error fetching all offers:", error);
        throw new Error("Failed to fetch offers");
    }
    }
    async updateOfferById({offerId,query,version}:{offerId:string,query:Partial<OfferIncomingDTO>,version:number}):Promise<OfferDocument | null>{
        try {
            const updatedOffer = await Offer.findByIdAndUpdate({_id:offerId,__v:version}, {$set:query,$inc:{__v:1}}, {
                new: true}).lean();
            if (!updatedOffer) {
                throw new Error("Offer not found or already deleted");
            }
            return updatedOffer ? updatedOffer as unknown as OfferDocument : null;
        } catch (error) {
            console.error("Error updating offer:", error);
            throw new Error("Failed to update offer");
        }

    }
}

export class OfferClass{
    async getOfferByCode({code,session}:{code:string,session?:ClientSession}):Promise<{message:string,success:boolean}>{
        try{
         const offer = await Offer.findOne({code}).session(session || null);
            if (!offer) {
                return {message:"Offer not found",success:false};
            }
        return {message:"Offer found",success:true};
        }catch(error){
            console.error("Error fetching offer by code:", error);
            throw new Error("Failed to fetch offer");
        }
        
    }
}