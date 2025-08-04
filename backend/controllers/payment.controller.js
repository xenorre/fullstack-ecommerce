import Coupon from "../models/coupon.model.js";
import { stripeClient } from "../lib/stripe.js";
import Order from "../models/order.model.js";

export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode } = req.body.products;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Invalid product list" });
    }

    let totalAmount = 0;

    const lineItems = products.map((product) => {
      const amount = Math.round(product.price * 100); // Convert to cents for stripe
      totalAmount += amount * product.quantity;

      return {
        price_data: {
          currency: "pln",
          product_data: {
            name: product.name,
            images: [product.image],
          },
          unit_amount: amount,
        },
      };
    });

    let coupon = null;

    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
        isActive: true,
      });

      if (coupon) {
        totalAmount -= Math.round((totalAmount * coupon.discount) / 100); // Apply discount in cents
      } else {
        return res
          .status(400)
          .json({ error: "Invalid or expired coupon code" });
      }
    }

    const session = await stripeClient.checkout.sessions
      .create({
        payment_method_types: ["card", "p24", "blik"],
        line_items: lineItems,
        mode: "payment",
        success_url: `http://localhost:3000/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
        discounts: coupon
          ? [{ coupon: await createStripeCoupon(coupon.discount) }]
          : undefined,
        metadata: {
          userId: req.user._id.toString(),
          couponCode: couponCode || null,
          products: JSON.stringify(
            products.map((product) => ({
              id: product._id,
              quantity: product.quantity,
              price: product.price,
            }))
          ),
        },
      })
      .status(200)
      .json({ message: "Checkout session created successfully" });

    if (totalAmount > 20000) {
      const newCoupon = await createNewCoupon(req.user._id);
      res.status(200).json({
        sessionId: session.id,
        message: "Checkout session created successfully",
        newCoupon: newCoupon.code,
        totalAmount: totalAmount / 100, // Convert back to PLN
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to create checkout session" });
  }
};

async function createStripeCoupon(discount) {
  try {
    const stripeCoupon = await stripeClient.coupons.create({
      percent_off: discount,
      duration: "once",
    });

    return stripeCoupon.id;
  } catch (error) {
    console.error("Error creating Stripe coupon:", error);
    throw new Error("Failed to create Stripe coupon");
  }
}

async function createNewCoupon(userId) {
  const newCoupon = new Coupon({
    code: "DSC" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    discount: 10,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    userId: userId,
  });

  await newCoupon.save();

  return newCoupon;
}

export const checkoutSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(400).json({ error: "Payment not completed" });
    }

    if (session.metadata.couponCode) {
      await Coupon.findOne(
        {
          code: session.metadata.couponCode,
          userId: session.metadata.userId,
        },
        {
          isActive: false,
        }
      );
    }

    const products = JSON.parse(session.metadata.products);
    const newOrder = new Order({
      user: session.metadata.userId,
      products: products.map((product) => ({
        product: product.id,
        quantity: product.quantity,
        price: product.price,
      })),
      totalAmount: session.amount_total / 100, // Convert from cents to PLN
      stripeSessionId: sessionId,
    });

    await newOrder.save();

    res
      .status(200)
      .json({
        success: true,
        message: "Checkout successful",
        orderId: newOrder._id,
      });
  } catch (error) {
    console.error("Error processing checkout success:", error);
    res.status(500).json({ error: "Failed to process checkout success" });
  }
};
