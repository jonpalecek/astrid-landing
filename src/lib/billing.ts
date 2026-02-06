import { isSubscribed } from './stripe';

export { isSubscribed };

/**
 * Check if a user can provision an assistant
 * For now: must have active subscription
 */
export async function canProvisionAssistant(
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<{ allowed: boolean; reason?: string }> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Failed to check subscription:', error);
    return { allowed: false, reason: 'Failed to verify subscription' };
  }

  if (!isSubscribed(profile?.subscription_status)) {
    return { 
      allowed: false, 
      reason: 'Active subscription required to create an assistant' 
    };
  }

  return { allowed: true };
}

/**
 * Get subscription status for display
 */
export function getSubscriptionDisplay(status: string | null): {
  label: string;
  color: 'green' | 'yellow' | 'red' | 'gray';
} {
  switch (status) {
    case 'active':
      return { label: 'Active', color: 'green' };
    case 'past_due':
      return { label: 'Past Due', color: 'yellow' };
    case 'canceled':
      return { label: 'Canceled', color: 'red' };
    default:
      return { label: 'No Subscription', color: 'gray' };
  }
}
