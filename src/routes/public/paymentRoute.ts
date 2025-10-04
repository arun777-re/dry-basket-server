import express from 'express';
import { createOrder,verifyPayment } from '../../controllers/public/paymentController';
import { withAuth } from '../../utils/heplers';


const router = express.Router();

// create order route
router.post('/create-order',withAuth(true),createOrder);


// verify payment route
router.post('/verify-payment',withAuth(true),verifyPayment);


export default router;