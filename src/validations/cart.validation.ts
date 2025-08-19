import * as yup from "yup";

const variantSchema = yup.object().shape({
  weight: yup.number().positive().required("Weight is required"),
  price: yup.number().positive().required("price is required"),
  priceAfterDiscount: yup.number().positive().notRequired().nonNullable("Price after discount must be a positive number"),
});

export const cartItemSchema = yup.object().shape({
  productId: yup.string().required("Product ID is required"),
  quantity: yup
    .number()
    .positive()
    .required("Quantity is Required")
    .integer("Quantity must be an integer")
    .min(1, "Quantity must be atleast 1"),
  variant: variantSchema.required("Variant is required"),
  addedAtPrice: yup.number().required("Added at price is required"),
  categoryOfProduct: yup.string().required("Category of product is required"),
});

export const cartRequestSchema = yup.object().shape({
  items: yup
    .array()
    .of(cartItemSchema)
    .required("Items are required")
    .min(1, "Atleast one item is required"),
  coupon: yup.string().optional(),
});
