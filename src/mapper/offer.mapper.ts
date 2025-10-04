import { OfferIncomingDTO } from "../types/offer";

export function normalizeCreateOfferPayload(payload:OfferIncomingDTO){
    return {
        ...payload,
          expiresAt:payload.expiresAt ? new Date(payload.expiresAt) : null,
          appliesToCategories:Array.isArray(payload.appliesToCategories) ? 
          payload.appliesToCategories : payload.appliesToCategories ? [String(payload.appliesToCategories)] : [],
    }
}