// Shapes of the data the backend sends (see Ecommerce-backend/models and routes).

export type Product = {
  id: string;
  image: string;
  name: string;
  rating: {
    stars: number;
    count: number;
  };
  priceCents: number;
  keywords: string[];
};

export type CartItem = {
  productId: string;
  quantity: number;
  deliveryOptionId: string;
};

/** A cart item from `/api/cart-items?expand=product`. */
export type CartItemWithProduct = CartItem & {
  product: Product;
};

/** A delivery option from `/api/delivery-options?expand=estimatedDeliveryTime`. */
export type DeliveryOption = {
  id: string;
  deliveryDays: number;
  priceCents: number;
  estimatedDeliveryTimeMs: number;
};

/** One product in an order from `/api/orders?expand=products`. */
export type OrderProduct = {
  productId: string;
  quantity: number;
  estimatedDeliveryTimeMs: number;
  product: Product;
};

export type Order = {
  id: string;
  orderTimeMs: number;
  totalCostCents: number;
  products: OrderProduct[];
};

export type PaymentSummary = {
  totalItems: number;
  productCostCents: number;
  shippingCostCents: number;
  totalCostBeforeTaxCents: number;
  taxCents: number;
  totalCostCents: number;
};

/** Re-fetches the cart from the backend. */
export type LoadCart = () => Promise<void>;
