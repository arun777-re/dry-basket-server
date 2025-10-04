
import express from 'express';
import { withAuth } from '../../utils/heplers';
import { getAllCategory } from '../../controllers/admin/categoryController';

const router = express.Router();

router.get('/get-all',withAuth(false),getAllCategory);



export default router;
