import express from 'express';
import { forgotPass, getAdmin, loginAdmin, registerAdmin, resetPassword } from '../../controllers/admin/authController';
import { verifyAdminToken } from '../../middleware/verifyToken';



const router = express.Router();

router.post('/register',registerAdmin);
router.post('/login',loginAdmin);
router.post('/forgotpass',forgotPass);
router.post('/resetpass/:token',resetPassword);
router.get('/get',verifyAdminToken,getAdmin);

export default router;