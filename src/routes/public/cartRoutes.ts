import express from "express";
import { withAuth } from "../../utils/heplers";
import {
  adjustItemQty,
  applyCouponToCart,
  clearCart,
  createOrAddItemToCart,
  getCart,
  removeItemFromCart,
} from "../../controllers/public/cartController";

const router = express.Router();

router.post("/additem", withAuth(true), createOrAddItemToCart);
router.get("/getcart", withAuth(true), getCart);
router.patch("/updateqty", withAuth(true), adjustItemQty);
router.patch("/removeitem", withAuth(true), removeItemFromCart);
router.delete("/clear", withAuth(true), clearCart);
router.patch("/coupon", withAuth(true), applyCouponToCart);

export default router;
