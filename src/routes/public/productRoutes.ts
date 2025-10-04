import express from "express";
import {
  getAllCategoryProduct,
  getAllFeaturedProduct,
  getDistinctweights,
  getProductsNavSearch,
  getRecommendedProducts,
  getRelatedProducts,
  getSearchProducts,
  getSingleProduct,
} from "../../controllers/public/productController";
import { withAuth } from "../../utils/heplers";

const router = express.Router();

router.get("/getsingle/:slug", withAuth(false), getSingleProduct);
router.get("/getfeatured/:catname", withAuth(false), getAllFeaturedProduct);
router.get("/getfilter", withAuth(false), getSearchProducts);
router.get("/getrelated", withAuth(false), getRelatedProducts);
router.get("/getcatproduct/:catname", withAuth(false), getAllCategoryProduct);
router.get("/getrecommended/:catId", withAuth(false), getRecommendedProducts);
router.get("/getnavsearch",withAuth(false),getProductsNavSearch);
router.get("/getweight",withAuth(false),getDistinctweights);
// here one route is also created for get user recommended based on their interaction

export default router;
