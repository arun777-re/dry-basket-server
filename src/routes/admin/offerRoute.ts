import express from 'express';
import { verifyAdminToken } from '../../middleware/verifyToken';
import { createOffer, deleteOffer, getAllOffer, updateOffer } from '../../controllers/admin/offerController';


const router = express.Router();

router.post('/create',verifyAdminToken,createOffer);
router.delete('/delete',verifyAdminToken,deleteOffer);
router.get('/getAll',verifyAdminToken,getAllOffer);
router.patch('/update',verifyAdminToken,updateOffer);


export default router;