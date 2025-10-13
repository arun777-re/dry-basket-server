import express from 'express';
import { withAuth } from '../../utils/heplers';
import { clearWishlist, createWishlist, getUserWishlist, removeItemFromWishlist } from '../../controllers/public/wishlistControllers';


const router = express.Router();

router.post('/toggle',withAuth(true),createWishlist);    
router.patch('/remove',withAuth(true),removeItemFromWishlist);
router.delete('/clear',withAuth(true),clearWishlist);
router.get('/get-all',withAuth(true),getUserWishlist);

export default router;