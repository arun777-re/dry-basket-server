import express from 'express';
import { verifyAdminToken } from '../../middleware/verifyToken';
import { createBlog, deleteBlog, getAllBlog, getBlog, updateBlog } from '../../controllers/admin/blogController';


const router = express.Router();

router.post('/create',verifyAdminToken,createBlog);
router.get('/get',verifyAdminToken,getBlog);
router.get('/getall',verifyAdminToken,getAllBlog);
router.patch('/update',verifyAdminToken,updateBlog);
router.delete('/delete',verifyAdminToken,deleteBlog);


export default router;