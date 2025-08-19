import express from 'express';
import { withAuth } from '../../utils/heplers';
import { logout, resetPassRequest, resetPassWord, signin, signupUser, updatePassWord } from '../../controllers/public/authController';


const router = express.Router();

router.post('/signup',withAuth(false),signupUser);
router.post('/signin',withAuth(false),signin);
router.post('/logout',withAuth(true),logout);
router.post('/reset-request',withAuth(false),resetPassRequest);
router.post('/reset-password',withAuth(true),resetPassWord);



export default router;