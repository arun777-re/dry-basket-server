import { OfferSchemaDTO } from '../types/offer';
import mongoose from 'mongoose';


const offerSchema = new mongoose.Schema<OfferSchemaDTO>({
    code:{
        type:String,
        required:true,
        uppercase:true,
        trim:true,
        minlength:6,
        maxlength:12,
    },
    description:String,
    discountType:{
        type:String,
        enum:['percentage','flat'],
        default:'percentage',
        required:true
    },
    value:{
        type:Number,
        required:true,
       
    },
    minOrderAmount:{
        type:Number,
        default:0
    },
    appliesToCategories:[String],
    expiresAt:{
        type:Date,
        default:null
    },
    usageLimit:{
        type:Number,
        default:0,
        required:false,
    },
    timesUsed:{
        type:Number,
        default:0
    },
    active:{
        type:Boolean,
        required:false,
        default:true,
    }
},{timestamps:true,optimisticConcurrency:true});


//adding index to code field This will help in faster lookups and ensure that no two offers can have the same code
offerSchema.index({code:1},{unique:true});
offerSchema.index({expiresAt:1},{expireAfterSeconds:0}); // This will automatically remove offers that have expired
offerSchema.index({active:1});
offerSchema.index({appliesToCategories:1});
const Offer = mongoose.models.Offer || mongoose.model('Offer',offerSchema);

export default Offer;