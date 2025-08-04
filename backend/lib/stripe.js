import stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

export const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
