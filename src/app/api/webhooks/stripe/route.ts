import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createServiceClient } from '@/lib/supabase-server';
import { stripe, mapStripeStatus } from '@/lib/stripe';
import Stripe from 'stripe';

// Disable body parsing - we need the raw body for signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, supabase);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription, supabase);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, supabase);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
) {
  const userId = session.metadata?.supabase_user_id;
  if (!userId) {
    console.error('No supabase_user_id in checkout session metadata');
    return;
  }

  console.log(`Checkout completed for user ${userId}`);
  
  // Subscription details come via subscription.created webhook
  // but we can update customer ID here if not already set
  if (session.customer) {
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: session.customer as string })
      .eq('id', userId);
  }
}

async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
) {
  const customerId = subscription.customer as string;
  
  // Type assertion for period fields (exist at runtime but not in newer type definitions)
  const sub = subscription as Stripe.Subscription & {
    current_period_start: number;
    current_period_end: number;
  };

  // Find user by stripe_customer_id
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (error || !profile) {
    console.error(`No profile found for customer ${customerId}:`, error);
    return;
  }

  const status = mapStripeStatus(subscription.status);

  // Update profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      subscription_status: status,
      subscription_id: subscription.id,
      subscription_ends_at: new Date(sub.current_period_end * 1000).toISOString(),
    })
    .eq('id', profile.id);

  if (updateError) {
    console.error('Failed to update profile:', updateError);
    return;
  }

  // Upsert subscription record for history
  await supabase.from('subscriptions').upsert(
    {
      user_id: profile.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      status: subscription.status,
      price_id: subscription.items.data[0]?.price.id,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_subscription_id' }
  );

  console.log(`Subscription ${subscription.id} updated: ${status} for user ${profile.id}`);
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
) {
  const customerId = subscription.customer as string;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) {
    console.error(`No profile found for customer ${customerId}`);
    return;
  }

  await supabase
    .from('profiles')
    .update({
      subscription_status: 'none',
      subscription_id: null,
      subscription_ends_at: null,
    })
    .eq('id', profile.id);

  console.log(`Subscription deleted, user ${profile.id} no longer active`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log(`Invoice ${invoice.id} paid for customer ${invoice.customer}`);
  // Could trigger email notification here
}

async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
) {
  const customerId = invoice.customer as string;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) {
    console.error(`No profile found for customer ${customerId}`);
    return;
  }

  await supabase
    .from('profiles')
    .update({ subscription_status: 'past_due' })
    .eq('id', profile.id);

  console.log(`Payment failed for user ${profile.id}`);
  // TODO: Send email notification about failed payment
}
