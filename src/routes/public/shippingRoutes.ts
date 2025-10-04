import express from 'express';
import { withAuth } from '../../utils/heplers';
import { getShippingRate, placeOrderAndAssignCourierForShipping } from '../../controllers/public/shippingController';

const router  = express.Router();

router.post('/rate-calculator',withAuth(false),getShippingRate);
router.post('/create-assign-order',withAuth(true),placeOrderAndAssignCourierForShipping);

export default router;

