import express from 'express';
import { withAuth } from '../../utils/heplers';
import { cancelOrder, getAllOrdersForAuser, getLatestOrder, getSingleOrderForAuser } from '../../controllers/public/paymentController';

const router = express.Router();


router.get('/latest-order',withAuth(true),getLatestOrder);
router.get('/getall-orders',withAuth(true),getAllOrdersForAuser)

router.get('/get-single-track',withAuth(true),getSingleOrderForAuser);

router.delete('/cancel-order',withAuth(true),cancelOrder)





export default router;