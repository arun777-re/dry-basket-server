import { OfferDocument } from '../types/offer';
import mongoose from 'mongoose';


const offerSchema = new mongoose.Schema<OfferDocument>({
    code:{
        type:String,
        required:true,
        unique:true,
        uppercase:true,
        trim:true,
        minlength:6,
        maxlength:12,
        index:true
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
},{timestamps:true});


const Offer = mongoose.models.Offer || mongoose.model('Offer',offerSchema);

export default Offer;