import { Offer } from "../../models";
import { OfferDocument } from "../../types/offer";



export class OfferClass{
    async getOfferByCode({code}:{code:string}):Promise<OfferDocument>{
        const offer = await Offer.findOne({ code });
        return offer;
    }
}