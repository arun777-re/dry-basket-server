
import mongoose from 'mongoose';
import {BannerSchemaDTO } from '../types/banner';


const bannerSchema = new mongoose.Schema<BannerSchemaDTO>({
title:{type:String,required:false},
description:{type:String,required:false},
couponValue:{type:String,required:false},
bannerImage:{type:String,required:true},
});


const Banner = mongoose.model('Banner',bannerSchema);

export default Banner;