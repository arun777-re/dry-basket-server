import { POST } from "@/app/api/public/cart/apply-coupon/route";
import { NextRequest } from "next/server";
import Cart from "@/models/Cart";
import Offer from "@/models/PromoCode";
import * as cartService from "@/lib/services/cartService";

// Mocks
jest.mock("@/models/Cart");
jest.mock("@/models/PromoCode");
jest.mock("@/lib/services/cartService");
jest.mock("@/lib/middleware/response", () => {
  const actual = jest.requireActual("@/lib/middleware/response");
  return {
    ...actual,
    withAuth: (handler: any) => handler, // bypass auth middleware
  };
});

// Factory function to create NextRequest
const createMockRequest = (cartId: string, code: string) =>
  new NextRequest(`http://localhost:3000/api/applyCoupon?cartId=${cartId}`, {
    method: "POST",
    body: JSON.stringify({ code }),
  });

describe("POST /applyCoupon API", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if cart is not found", async () => {
    (Cart.findById as jest.Mock).mockResolvedValue(null);

    const res = await POST(createMockRequest("invalidCartId", "CODE10"));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.message).toBe("Cart does not exists");
  });

  it("should return 400 if coupon not found or invalid value", async () => {
    (Cart.findById as jest.Mock).mockResolvedValue({ items: [], coupon: [], total: 100 });
    (Offer.findOne as jest.Mock).mockResolvedValue({ code: "BADCODE", value: 0 });

    const res = await POST(createMockRequest("cart123", "BADCODE"));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.message).toContain("Coupon not found");
  });

  it("should return 400 if coupon is already applied", async () => {
    (Cart.findById as jest.Mock).mockResolvedValue({
      items: [],
      coupon: [{ code: "FOOD10" }],
      total: 100,
    });

    (Offer.findOne as jest.Mock).mockResolvedValue({ code: "FOOD10", value: 10 });

    const res = await POST(createMockRequest("cart123", "FOOD10"));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.message).toBe("Coupon already applied to this cart");
  });

  it("should return 400 if applyCoupon fails", async () => {
    (Cart.findById as jest.Mock).mockResolvedValue({
      items: [],
      coupon: [],
      total: 100,
    });

    (Offer.findOne as jest.Mock).mockResolvedValue({ code: "BADCODE", value: 10 });
    (cartService.applyCoupon as jest.Mock).mockReturnValue({
      success: false,
      error: "Invalid coupon",
    });

    const res = await POST(createMockRequest("cart123", "BADCODE"));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.message).toBe("Invalid coupon");
  });

  it("should apply coupon and update cart successfully", async () => {
    const saveMock = jest.fn();

    const mockCart = {
      items: [{ categoryOfProduct: "Food", variant: { price: 100 }, quantity: 1 }],
      coupon: [],
      total: 100,
      save: saveMock,
    };

    (Cart.findById as jest.Mock).mockResolvedValue(mockCart);

    const mockCoupon = {
      code: "FOOD10",
      appliesToCategories: ["Food"],
      value: 10,
      expiresAt: new Date(Date.now() + 10000),
      active: true,
    };
    (Offer.findOne as jest.Mock).mockResolvedValue(mockCoupon);

    (cartService.applyCoupon as jest.Mock).mockReturnValue({
      success: true,
      total: 90,
      discountAmount: 10,
    });

    const res = await POST(createMockRequest("cart123", "FOOD10"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toBe("Coupon applied successfully");
    expect(mockCart.coupon).toContainEqual({
      code: "FOOD10",
      discountAmount: 10,
      percentage: 10,
    });
    expect(mockCart.finalTotal).toBe(90);
    expect(saveMock).toHaveBeenCalled();
  });
});
