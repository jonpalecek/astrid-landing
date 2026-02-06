import Stripe from 'stripe';

// Initialize Stripe with secret key
// Throws at runtime if STRIPE_SECRET_KEY is not set
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Helper to check if user has active subscription
export function isSubscribed(subscriptionStatus: string | null): boolean {
  return subscriptionStatus === 'active';
}

// Map Stripe subscription status to our simplified status
export function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): string {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
      return 'canceled';
    default:
      return 'none';
  }
}
