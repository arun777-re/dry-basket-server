import express from 'express';
import { verifyAdminToken } from '../../middleware/verifyToken';
import { salesByMonth, stockAlert, topSellingProduct, totalCustomers, totalSales } from '../../controllers/admin/analyticController';


const router = express.Router();

router.get('/get-stock',verifyAdminToken,stockAlert);
router.get('/total-sale',verifyAdminToken,totalSales);
router.get('/top-selling',verifyAdminToken,topSellingProduct);
router.get('/total-users',verifyAdminToken,totalCustomers);
router.get('/salebymonth',verifyAdminToken,salesByMonth);

export default router;