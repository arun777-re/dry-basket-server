import express from 'express';
import { createCategory, deleteCategory, getAllCategory } from '../../controllers/admin/categoryController';
import { verifyAdminToken } from '../../middleware/verifyToken';

const router = express.Router();

router.post('/create',verifyAdminToken,createCategory);
router.delete('/delete/:catId',verifyAdminToken,deleteCategory);


router.get('/getall',verifyAdminToken,getAllCategory);



export default router;