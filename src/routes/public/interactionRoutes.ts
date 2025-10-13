import express from 'express';
import { withAuth } from '../../utils/heplers';
import { createInteraction } from '../../controllers/public/interactionController';


const router = express.Router();

router.post('/take-interaction',withAuth(true),createInteraction);    

export default router;