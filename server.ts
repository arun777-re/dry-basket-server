import dotenv from 'dotenv';
dotenv.config();

import express, { Application, Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import { dbConnect } from './src/db';
import {connectRedis} from './src/config/redis';

// Routes
import adminRoutes from './src/routes/admin/authRoutes';
import adminProductRoutes from './src/routes/admin/productRoutes';
import categoryRoutes from './src/routes/admin/categoryRoute';
import offerRoutes from './src/routes/admin/offerRoute';
import paymentRoutes from './src/routes/public/paymentRoute';
import publicProductRoutes from './src/routes/public/productRoutes';
import publicCartRoutes from './src/routes/public/cartRoutes';
import userAuthRoutes from './src/routes/public/authRoute';
import reviewRoutes from './src/routes/public/reviewRoute';

const app: Application = express();

// Connect to the database
dbConnect();

// connect to redis 
connectRedis()

// Middlewares
app.use(helmet());
app.use(cors({ origin: [ process.env.CLIENT_URL|| "http://localhost:3000",
  process.env.CRM_URL || "http://localhost:3001",], credentials: true }));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended:true}));





// Rate limiter middleware (for public routes only)
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // max requests per IP
  message: 'Too many requests from this IP, please try again later.'
});

// --------- Admin Routes (without limiter) ----------
app.use('/v1/admin/product', adminProductRoutes);
app.use('/v1/admin', adminRoutes);
app.use('/v1/admin/category', categoryRoutes);
app.use('/v1/admin/offer', offerRoutes);

// --------- Public Routes (with limiter) ------------
const publicRouter = express.Router();
publicRouter.use(publicLimiter);
publicRouter.use('/product', publicProductRoutes);
publicRouter.use('/cart',publicCartRoutes);
publicRouter.use('/auth',userAuthRoutes);
publicRouter.use('/review',reviewRoutes)
app.use('/v1/public', publicRouter);

// --------- Payment Routes (with limiter) ------------
app.use('/v1/public/payment', publicLimiter, paymentRoutes);

// Global Error Handler
const errorHandler:ErrorRequestHandler =(err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
}
app.use(errorHandler);

// Start server
app.listen(process.env.PORT || 8000, async () => {
  console.log(`✅ Server is running on port ${process.env.PORT || 8000}`);
});
