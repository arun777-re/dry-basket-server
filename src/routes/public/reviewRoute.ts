import express from 'express';
import { withAuth } from '../../utils/heplers';
import { createReview, getAllReviews } from '../../controllers/public/reviewController';


const router = express.Router();

router.post('/create',withAuth(true),createReview);
router.get('/getall',withAuth(false),getAllReviews);



export default router;