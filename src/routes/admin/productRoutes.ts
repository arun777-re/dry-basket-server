import express from 'express';
import { verifyAdminToken } from '../../middleware/verifyToken';
import { createProduct, deleteProduct, updateProduct,getAllProducts } from '../../controllers/admin/productController';
import multer from 'multer';

const upload = multer();

const router = express.Router();

router.post('/create',verifyAdminToken,upload.none(),createProduct);
router.delete('/delete/:slug',verifyAdminToken,deleteProduct);
router.patch('/update/:slug',verifyAdminToken,upload.none(),updateProduct);
router.get('/getall',verifyAdminToken,getAllProducts);



export default router;
