const PLANS = {
  basique: {
    monthly: { price: 100, priceId: 'price_basique_monthly' },
    annual:  { price: 80,  priceId: 'price_basique_annual'  },
  },
  pro: {
    monthly: { price: 200, priceId: 'price_pro_monthly' },
    annual:  { price: 160, priceId: 'price_pro_annual'  },
  },
  enterprise: {
    monthly: { price: 300, priceId: 'price_enterprise_monthly' },
    annual:  { price: 240, priceId: 'price_enterprise_annual'  },
  },
};

export const getPlanDetails = (planName, cycle) => PLANS[planName]?.[cycle] ?? null;

// MODE TEST — simulates PaymentIntent creation (no real backend needed for PFA demo)
export const createPaymentIntent = async (amount, currency = 'mad') => {
  console.log(`[Stripe Test] PaymentIntent: ${amount} ${currency}`);
  return { clientSecret: 'pi_test_simulated_secret', amount };
};
