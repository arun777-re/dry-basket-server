import express from 'express';
import { verifyAdminToken } from '../../middleware/verifyToken';
import { createBanner, deleteBanner, getAllBanner, getSingleBanner, updateBanner } from '../../controllers/admin/bannerController';

const router = express.Router();

router.post('/create',verifyAdminToken,createBanner);
router.delete('/delete',verifyAdminToken,deleteBanner);
router.patch('/update',verifyAdminToken,updateBanner);
router.get('/get-single',verifyAdminToken,getSingleBanner);
router.get('/getall',verifyAdminToken,getAllBanner);

export default router;