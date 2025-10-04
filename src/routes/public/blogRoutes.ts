import express from 'express';
import { withAuth } from '../../utils/heplers';
import { getAllBlog, getBlog } from '../../controllers/admin/blogController';


const router = express.Router();
router.get('/getall',withAuth(false),getAllBlog);
router.get('/get-single',withAuth(false),getBlog);

export default router;