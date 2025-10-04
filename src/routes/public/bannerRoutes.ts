import express from 'express';
import { withAuth } from '../../utils/heplers';
import { getAllBanner, getSingleBanner } from '../../controllers/admin/bannerController';


const router = express.Router();
router.get('/getall',withAuth(false),getAllBanner);
router.get('/get-single',withAuth(false),getSingleBanner);

export default router;