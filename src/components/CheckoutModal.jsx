import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog, DialogContent, DialogTitle, Box, Typography, TextField,
  Button, CircularProgress, Stack, Divider, IconButton, Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  Elements, CardElement, useStripe, useElements,
} from '@stripe/react-stripe-js';
import { stripePromise } from '../config/stripe';

/* ─── Card element styles to match MUI look ─────────────────────────────── */
const CARD_STYLE = {
  style: {
    base: {
      fontSize: '15px',
      fontFamily: '"Plus Jakarta Sans", "DM Sans", Arial, sans-serif',
      color: '#0F172A',
      fontWeight: '500',
      '::placeholder': { color: '#94A3B8' },
    },
    invalid: { color: '#DC2626', iconColor: '#DC2626' },
  },
};

/* ─── Success screen ─────────────────────────────────────────────────────── */
function SuccessScreen({ email, planName, onRegister }) {
  return (
    <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
      <Box sx={{
        width: 80, height: 80, borderRadius: '50%',
        bgcolor: '#DCFCE7', display: 'flex', alignItems: 'center',
        justifyContent: 'center', mx: 'auto', mb: 3,
        animation: 'popIn 0.4s cubic-bezier(.22,.68,0,1.4) both',
      }}>
        <CheckCircleIcon sx={{ fontSize: 44, color: '#16A34A' }} />
      </Box>
      <style>{`
        @keyframes popIn {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <Typography sx={{
        fontSize: 22, fontWeight: 800, color: '#0F172A', mb: 1,
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}>
        Paiement réussi !
      </Typography>
      <Typography sx={{
        fontSize: 15, fontWeight: 600, color: '#2563EB', mb: 2,
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}>
        Bienvenue dans FacturaPro {planName}
      </Typography>
      <Typography sx={{ color: '#64748B', fontSize: 14, mb: 4, fontFamily: 'DM Sans, sans-serif' }}>
        Un email de confirmation a été envoyé à{' '}
        <Box component="span" sx={{ fontWeight: 600, color: '#0F172A' }}>{email}</Box>
      </Typography>

      <Button
        fullWidth
        size="large"
        onClick={onRegister}
        sx={{
          background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
          color: '#fff', fontWeight: 700, fontSize: 15,
          textTransform: 'none', borderRadius: '12px', py: 1.5,
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          boxShadow: '0 6px 24px rgba(37,99,235,0.35)',
          '&:hover': { boxShadow: '0 8px 30px rgba(37,99,235,0.45)', transform: 'translateY(-1px)' },
          transition: 'all 0.2s',
        }}
      >
        Créer mon compte maintenant
      </Button>
    </Box>
  );
}

/* ─── Checkout form (inside Elements context) ────────────────────────────── */
function CheckoutForm({ plan, billingCycle, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [cardFocused, setCardFocused] = useState(false);

  const price = billingCycle === 'annual' ? plan?.annualPrice : plan?.monthlyPrice;
  const cycleLabel = billingCycle === 'annual' ? 'Annuel' : 'Mensuel';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !email || !name) return;
    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: { name, email },
    });

    if (stripeError) {
      setError(stripeError.message);
      setLoading(false);
      return;
    }

    console.log('[Stripe Test] PaymentMethod created:', paymentMethod.id);
    setLoading(false);
    onSuccess({ email, name, plan, paymentMethod });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {/* Order summary */}
      <Box sx={{
        bgcolor: '#F8FAFC', border: '1px solid #E2E8F0',
        borderRadius: '12px', p: 2, mb: 3,
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#0F172A', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Plan {plan?.name} · {cycleLabel}
          </Typography>
          <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#2563EB', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {price} MAD/mois
          </Typography>
        </Box>
        <Divider sx={{ my: 1 }} />
        <Typography sx={{ fontSize: 12, color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
          ✓ Essai gratuit 30 jours inclus
        </Typography>
        <Typography sx={{ fontSize: 12, color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
          Puis {price} MAD/mois · Annulez quand vous voulez
        </Typography>
      </Box>

      <Stack spacing={2}>
        <TextField
          fullWidth
          label="Nom complet"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
        />
        <TextField
          fullWidth
          label="Adresse email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
        />

        {/* CardElement styled like a MUI TextField */}
        <Box>
          <Typography sx={{ fontSize: 12, color: '#64748B', mb: 0.75, fontFamily: 'DM Sans, sans-serif' }}>
            Numéro de carte
          </Typography>
          <Box sx={{
            border: `1.5px solid ${cardFocused ? '#2563EB' : '#E2E8F0'}`,
            borderRadius: '10px', px: 1.75, py: 1.75,
            transition: 'border-color 0.2s',
            bgcolor: '#fff',
          }}>
            <CardElement
              options={CARD_STYLE}
              onFocus={() => setCardFocused(true)}
              onBlur={() => setCardFocused(false)}
            />
          </Box>
        </Box>

        {/* Test card hint */}
        <Box sx={{
          bgcolor: '#FEF9C3', border: '1px solid #FDE68A',
          borderRadius: '8px', p: 1.5,
        }}>
          <Typography sx={{ fontSize: 12, color: '#92400E', fontWeight: 600, mb: 0.25, fontFamily: 'DM Sans, sans-serif' }}>
            🧪 Mode test — Utilisez cette carte
          </Typography>
          <Typography sx={{ fontSize: 12, color: '#92400E', fontFamily: 'monospace' }}>
            Numéro&nbsp;&nbsp;: 4242 4242 4242 4242<br />
            Expiry&nbsp;&nbsp;&nbsp;: 12/26 &nbsp; CVC : 123<br />
            Code postal : n'importe lequel
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ borderRadius: '10px', fontSize: 13 }}>
            {error}
          </Alert>
        )}

        <Button
          type="submit"
          fullWidth
          size="large"
          disabled={loading || !stripe || !email || !name}
          sx={{
            background: loading
              ? '#E2E8F0'
              : 'linear-gradient(135deg, #2563EB, #7C3AED)',
            color: loading ? '#94A3B8' : '#fff',
            fontWeight: 700, fontSize: 15,
            textTransform: 'none', borderRadius: '12px', py: 1.5,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            boxShadow: loading ? 'none' : '0 6px 24px rgba(37,99,235,0.30)',
            '&:hover': { boxShadow: '0 8px 30px rgba(37,99,235,0.40)', transform: 'translateY(-1px)' },
            '&:disabled': { background: '#E2E8F0' },
            transition: 'all 0.2s',
          }}
        >
          {loading
            ? <><CircularProgress size={18} sx={{ color: '#94A3B8', mr: 1 }} />Traitement…</>
            : `Payer ${price} MAD et créer mon compte`}
        </Button>
      </Stack>

      {/* Security badges */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mt: 2 }}>
        <LockIcon sx={{ fontSize: 14, color: '#94A3B8' }} />
        <Typography sx={{ fontSize: 11, color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
          Paiement sécurisé · SSL · Powered by Stripe
        </Typography>
      </Box>
    </Box>
  );
}

/* ─── Modal wrapper ──────────────────────────────────────────────────────── */
export default function CheckoutModal({ open, onClose, plan, billingCycle }) {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(null);

  const handleSuccess = useCallback(({ email, name, paymentMethod }) => {
    setSuccess({ email, name, paymentMethod });
  }, []);

  const handleRegister = () => {
    onClose();
    setSuccess(null);
    navigate('/register', {
      state: {
        email: success?.email,
        name: success?.name,
        plan: plan?.name,
        fromPayment: true,
      },
    });
  };

  const handleClose = () => {
    if (success) setSuccess(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          p: 0,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.15)',
        },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, pt: 3, pb: 0,
      }}>
        <Box>
          <Typography sx={{
            fontSize: 20, fontWeight: 800, color: '#0F172A',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}>
            {success ? 'Paiement confirmé' : 'Finaliser votre abonnement'}
          </Typography>
          {!success && plan && (
            <Typography sx={{ fontSize: 13, color: '#64748B', fontFamily: 'DM Sans, sans-serif', mt: 0.25 }}>
              Plan {plan.name} · {billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice} MAD/mois
            </Typography>
          )}
        </Box>
        <IconButton onClick={handleClose} size="small" sx={{ color: '#94A3B8', '&:hover': { color: '#0F172A' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 2.5, pb: 3 }}>
        {success ? (
          <SuccessScreen
            email={success.email}
            planName={plan?.name}
            onRegister={handleRegister}
          />
        ) : (
          <Elements stripe={stripePromise}>
            <CheckoutForm
              plan={plan}
              billingCycle={billingCycle}
              onSuccess={handleSuccess}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}
