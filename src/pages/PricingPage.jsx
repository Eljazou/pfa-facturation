import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckoutModal from '../components/CheckoutModal';
import {
  Box, Typography, Button, Switch, Chip, Divider,
  Accordion, AccordionSummary, AccordionDetails,
  Table, TableHead, TableBody, TableRow, TableCell,
  Stack,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import GroupIcon from '@mui/icons-material/Group';
import BusinessIcon from '@mui/icons-material/Business';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

/* ─── CSS Keyframes injected once ─────────────────────────────────────────── */
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

  @keyframes pulse-badge {
    0%, 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.35); }
    50%       { box-shadow: 0 0 0 8px rgba(37,99,235,0); }
  }
  @keyframes pulse-recommended {
    0%, 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.4); }
    60%       { box-shadow: 0 0 0 6px rgba(37,99,235,0); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeInDown {
    from { opacity: 0; transform: translateY(-20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes flipPrice {
    0%   { transform: rotateX(0deg);    opacity: 1; }
    45%  { transform: rotateX(90deg);   opacity: 0; }
    55%  { transform: rotateX(-90deg);  opacity: 0; }
    100% { transform: rotateX(0deg);    opacity: 1; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33%       { transform: translateY(-12px) rotate(1deg); }
    66%       { transform: translateY(6px) rotate(-1deg); }
  }
  @keyframes gridMove {
    0%   { transform: translateY(0); }
    100% { transform: translateY(60px); }
  }

  .pricing-card {
    transition: transform 0.3s cubic-bezier(.22,.68,0,1.2), box-shadow 0.3s ease;
    cursor: default;
  }
  .pricing-card:hover {
    transform: translateY(-10px) !important;
    box-shadow: 0 24px 60px rgba(0,0,0,0.13) !important;
  }
  .pricing-card-pro:hover {
    transform: scale(1.05) translateY(-10px) !important;
    box-shadow: 0 32px 80px rgba(37,99,235,0.28) !important;
  }
  .shimmer-btn {
    background: linear-gradient(90deg, #2563EB 0%, #7C3AED 40%, #a78bfa 60%, #2563EB 100%);
    background-size: 200% auto;
    transition: background-position 0.5s ease, transform 0.2s ease, box-shadow 0.2s ease;
  }
  .shimmer-btn:hover {
    background-position: right center;
    animation: shimmer 1.4s linear infinite;
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 30px rgba(124,58,237,0.45) !important;
  }
  .flip-price {
    display: inline-block;
    transform-style: preserve-3d;
  }
  .flip-price.flipping {
    animation: flipPrice 0.4s ease both;
  }
  .faq-accordion {
    border-radius: 12px !important;
    margin-bottom: 10px !important;
    box-shadow: none !important;
    border: 1px solid #E2E8F0 !important;
    overflow: hidden;
    transition: border-color 0.2s;
  }
  .faq-accordion:before { display: none !important; }
  .faq-accordion.Mui-expanded {
    border-color: #2563EB !important;
    box-shadow: 0 4px 20px rgba(37,99,235,0.08) !important;
  }
  .compare-row:hover td { background: #F8FAFC; }
  .compare-row td { transition: background 0.15s; }
`;

/* ─── Data ─────────────────────────────────────────────────────────────────── */
const PLANS = [
  {
    id: 'basic',
    icon: AccountCircleIcon,
    label: 'Basique',
    subtitle: '1 utilisateur · 50 factures/mois',
    accent: '#64748B',
    monthly: 100,
    annual: 80,
    featured: false,
    features: [
      { text: 'Création de factures (50/mois)', ok: true },
      { text: 'Génération PDF basique',         ok: true },
      { text: '1 client actif',                 ok: true },
      { text: 'Export Excel',                   ok: true },
      { text: 'Signature numérique',            ok: false },
      { text: 'QR code',                        ok: false },
      { text: 'Dashboard analytique',           ok: false },
      { text: 'Email automatique',              ok: false },
    ],
    btnLabel: 'Démarrer l\'essai',
    btnVariant: 'outlined',
    btnAction: 'register',
  },
  {
    id: 'pro',
    icon: GroupIcon,
    label: 'Pro',
    subtitle: '2 utilisateurs · factures illimitées',
    accent: '#2563EB',
    monthly: 200,
    annual: 160,
    featured: true,
    features: [
      { text: 'Factures illimitées',              ok: true },
      { text: 'Génération PDF professionnelle',   ok: true },
      { text: 'Signature numérique + QR code',    ok: true },
      { text: 'Dashboard analytique complet',     ok: true },
      { text: 'Email automatique (EmailJS)',       ok: true },
      { text: 'Export Excel',                     ok: true },
      { text: 'Notifications temps réel',         ok: true },
      { text: 'Support prioritaire',              ok: true },
    ],
    btnLabel: 'Commencer avec Pro',
    btnVariant: 'contained',
    btnAction: 'register',
  },
  {
    id: 'enterprise',
    icon: BusinessIcon,
    label: 'Enterprise',
    subtitle: 'Multi-utilisateurs · multi-société',
    accent: '#7C3AED',
    monthly: 300,
    annual: 240,
    featured: false,
    features: [
      { text: 'Tout ce qui est dans Pro',       ok: true },
      { text: 'Utilisateurs illimités',         ok: true },
      { text: 'Multi-entreprises',              ok: true },
      { text: 'Archivage annuel illimité',      ok: true },
      { text: 'API REST publique',              ok: true },
      { text: 'Manager dédié',                  ok: true },
      { text: 'Personnalisation complète',      ok: true },
      { text: 'SLA 99.9% garanti',              ok: true },
    ],
    btnLabel: "Contacter l'équipe",
    btnVariant: 'outlined',
    btnAction: 'contact',
  },
];

const COMPARE_ROWS = [
  { feature: 'Nombre de factures',  basic: '50/mois',   pro: 'Illimitées', enterprise: 'Illimitées' },
  { feature: 'Utilisateurs',        basic: '1',         pro: '2',          enterprise: 'Illimités' },
  { feature: 'Génération PDF',      basic: true,        pro: true,         enterprise: true },
  { feature: 'Signature numérique', basic: false,       pro: true,         enterprise: true },
  { feature: 'QR code',             basic: false,       pro: true,         enterprise: true },
  { feature: 'Dashboard KPIs',      basic: false,       pro: true,         enterprise: true },
  { feature: 'Email automatique',   basic: false,       pro: true,         enterprise: true },
  { feature: 'Export Excel',        basic: true,        pro: true,         enterprise: true },
  { feature: 'Multi-entreprises',   basic: false,       pro: false,        enterprise: true },
  { feature: 'API REST',            basic: false,       pro: false,        enterprise: true },
  { feature: 'Support',             basic: 'Email',     pro: 'Prioritaire',enterprise: 'Dédié' },
];

const FAQ = [
  {
    q: 'Est-ce que je peux changer de plan ?',
    a: "Oui, vous pouvez upgrader ou downgrader votre plan à tout moment depuis votre espace paramètres. Le changement prend effet immédiatement.",
  },
  {
    q: "Y a-t-il un engagement minimum ?",
    a: "Non, aucun engagement. Vous pouvez annuler votre abonnement à tout moment sans frais.",
  },
  {
    q: "Comment fonctionne l'essai gratuit ?",
    a: "Vous bénéficiez de 30 jours d'essai gratuit sur le plan Pro sans carte bancaire requise. À la fin de l'essai, choisissez votre plan.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Oui. Toutes les données sont chiffrées en transit (HTTPS/TLS) et stockées sur Firebase (Google Cloud). Nous sommes conformes à la Loi 09-08 marocaine sur la protection des données.",
  },
  {
    q: "Puis-je exporter mes données ?",
    a: "Oui, vous pouvez exporter toutes vos factures en Excel ou PDF à tout moment, même si vous décidez d'annuler votre abonnement.",
  },
];

/* ─── Animated counter hook ────────────────────────────────────────────────── */
function useCounter(target, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

/* ─── Cell renderer ─────────────────────────────────────────────────────────── */
function CmpCell({ value, planAccent }) {
  if (value === true)  return <CheckIcon sx={{ color: planAccent || '#22C55E', fontSize: 20 }} />;
  if (value === false) return <CloseIcon sx={{ color: '#CBD5E1', fontSize: 20 }} />;
  return <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{value}</Typography>;
}

/* ─── Price display with flip animation ─────────────────────────────────────── */
function PriceDisplay({ price, annual, accent }) {
  const [flipping, setFlipping] = useState(false);
  const prevAnnual = useRef(annual);

  useEffect(() => {
    if (prevAnnual.current !== annual) {
      setFlipping(true);
      const t = setTimeout(() => setFlipping(false), 400);
      prevAnnual.current = annual;
      return () => clearTimeout(t);
    }
  }, [annual]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, my: 1.5 }}>
      <Typography sx={{ fontSize: 15, fontWeight: 600, color: accent, mb: 0.8, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        MAD
      </Typography>
      <span
        className={`flip-price${flipping ? ' flipping' : ''}`}
        style={{ fontSize: 42, fontWeight: 800, color: accent, lineHeight: 1, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
      >
        {price}
      </span>
      <Typography sx={{ fontSize: 13, color: '#94A3B8', mb: 0.8, fontFamily: 'DM Sans, sans-serif' }}>
        /mois
      </Typography>
    </Box>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────────── */
export default function PricingPage() {
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const count = useCounter(500);

  const openCheckout = (plan) => {
    setSelectedPlan({
      name: plan.label,
      monthlyPrice: plan.monthly,
      annualPrice: plan.annual,
    });
    setCheckoutOpen(true);
  };

  const handleBtn = (action, plan) => {
    if (action === 'contact') { window.location.href = 'mailto:contact@facturapro.ma'; return; }
    openCheckout(plan);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{GLOBAL_STYLES}</style>

      {/* ── Top nav bar ─────────────────────────────────────────────────────── */}
      <Box sx={{
        position: 'sticky', top: 0, zIndex: 100,
        bgcolor: 'rgba(248,250,252,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(226,232,240,0.8)',
        px: { xs: 3, md: 8 }, py: 1.5,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Box
          onClick={() => navigate('/login')}
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', textDecoration: 'none' }}
        >
          <Box sx={{
            width: 34, height: 34, borderRadius: '10px',
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ReceiptLongIcon sx={{ color: '#fff', fontSize: 18 }} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#0F172A' }}>
            FacturaPro
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            onClick={() => navigate('/login')}
            sx={{ fontSize: 13, color: '#64748B', fontWeight: 500, fontFamily: 'DM Sans, sans-serif', textTransform: 'none', '&:hover': { color: '#2563EB', bgcolor: 'transparent' } }}
          >
            Connexion
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/register')}
            sx={{
              fontSize: 13, fontWeight: 600, textTransform: 'none', borderRadius: '10px',
              px: 2.5, py: 1,
              background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
              '&:hover': { boxShadow: '0 6px 20px rgba(37,99,235,0.4)', transform: 'translateY(-1px)' },
              transition: 'all 0.2s',
            }}
          >
            Créer un compte
          </Button>
        </Stack>
      </Box>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <Box sx={{
        position: 'relative', overflow: 'hidden',
        pt: { xs: 8, md: 12 }, pb: { xs: 6, md: 10 },
        textAlign: 'center', px: 3,
      }}>
        {/* Decorative background blobs */}
        <Box sx={{
          position: 'absolute', top: -120, left: '10%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <Box sx={{
          position: 'absolute', top: -60, right: '5%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        {/* Moving grid */}
        <Box sx={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.035,
          backgroundImage: 'linear-gradient(#2563EB 1px, transparent 1px), linear-gradient(90deg, #2563EB 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          animation: 'gridMove 8s linear infinite',
        }} />

        {/* Animated badge */}
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', gap: 1,
          bgcolor: '#EFF6FF', border: '1px solid #BFDBFE',
          borderRadius: '100px', px: 2.5, py: 0.75, mb: 4,
          animation: 'pulse-badge 2.5s ease-in-out infinite, fadeInDown 0.6s ease both',
          cursor: 'default',
        }}>
          <span style={{ fontSize: 16 }}>🚀</span>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#2563EB', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Nouveau — Essai gratuit 30 jours
          </Typography>
        </Box>

        {/* Main title */}
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: 36, md: 54 }, fontWeight: 800, lineHeight: 1.12,
            color: '#0F172A', mb: 3, letterSpacing: '-0.03em',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            animation: 'fadeInUp 0.7s ease 0.1s both',
          }}
        >
          Des tarifs simples et{' '}
          <Box component="span" sx={{
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            transparents
          </Box>
        </Typography>

        {/* Subtitle */}
        <Typography
          sx={{
            fontSize: { xs: 16, md: 19 }, color: '#64748B', maxWidth: 540, mx: 'auto',
            lineHeight: 1.65, mb: 5, fontFamily: 'DM Sans, sans-serif',
            animation: 'fadeInUp 0.7s ease 0.2s both',
          }}
        >
          Choisissez le plan qui correspond à votre activité.
          <br />Pas de frais cachés. Annulez à tout moment.
        </Typography>

        {/* Animated counter */}
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', gap: 1.5,
          bgcolor: '#fff', border: '1px solid #E2E8F0',
          borderRadius: '14px', px: 3, py: 1.5,
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
          animation: 'fadeInUp 0.7s ease 0.3s both',
        }}>
          <Box sx={{ display: 'flex', gap: '-4px' }}>
            {['#2563EB','#7C3AED','#10B981','#F59E0B'].map((c, i) => (
              <Box key={i} sx={{
                width: 26, height: 26, borderRadius: '50%',
                bgcolor: c, border: '2px solid white',
                ml: i === 0 ? 0 : '-8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>
                  {['A','B','C','D'][i]}
                </Typography>
              </Box>
            ))}
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#0F172A', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Rejoignez{' '}
            <Box component="span" sx={{ color: '#2563EB' }}>+{count}</Box>
            {' '}PME marocaines qui font confiance à FacturaPro
          </Typography>
        </Box>
      </Box>

      {/* ── TOGGLE MENSUEL / ANNUEL ──────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 6 }}>
        <Typography sx={{
          fontSize: 15, fontWeight: annual ? 400 : 700,
          color: annual ? '#94A3B8' : '#0F172A',
          transition: 'all 0.25s', fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}>
          Mensuel
        </Typography>
        <Switch
          checked={annual}
          onChange={(e) => setAnnual(e.target.checked)}
          sx={{
            '& .MuiSwitch-thumb': { bgcolor: '#2563EB' },
            '& .MuiSwitch-track': { bgcolor: annual ? '#BFDBFE !important' : '#CBD5E1 !important' },
          }}
        />
        <Typography sx={{
          fontSize: 15, fontWeight: annual ? 700 : 400,
          color: annual ? '#0F172A' : '#94A3B8',
          transition: 'all 0.25s', fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}>
          Annuel
        </Typography>
        <Box sx={{
          overflow: 'hidden', maxWidth: annual ? 60 : 0,
          transition: 'max-width 0.35s cubic-bezier(.22,.68,0,1.2)',
        }}>
          <Chip
            label="-20%"
            size="small"
            sx={{
              bgcolor: '#DCFCE7', color: '#16A34A', fontWeight: 700,
              fontSize: 12, border: '1px solid #BBF7D0',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          />
        </Box>
      </Box>

      {/* ── PRICING CARDS ────────────────────────────────────────────────────── */}
      <Box sx={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
        alignItems: 'center', gap: 3, px: { xs: 2, md: 6 }, mb: 10,
        perspective: '1000px',
      }}>
        {PLANS.map((plan, idx) => {
          const Icon = plan.icon;
          const price = annual ? plan.annual : plan.monthly;
          return (
            <Box
              key={plan.id}
              className={`pricing-card${plan.featured ? ' pricing-card-pro' : ''}`}
              sx={{
                position: 'relative',
                width: { xs: '100%', sm: 320 },
                bgcolor: plan.featured ? '#EFF6FF' : '#FFFFFF',
                border: plan.featured ? '2px solid #2563EB' : '1px solid #E2E8F0',
                borderRadius: '20px',
                p: 3.5,
                transform: plan.featured ? 'scale(1.05)' : 'scale(1)',
                boxShadow: plan.featured
                  ? '0 20px 60px rgba(37,99,235,0.18)'
                  : '0 4px 24px rgba(0,0,0,0.06)',
                animation: `fadeInUp 0.6s ease ${0.1 + idx * 0.12}s both`,
              }}
            >
              {/* RECOMMANDÉ badge */}
              {plan.featured && (
                <Box sx={{
                  position: 'absolute', top: -1, left: 24,
                  bgcolor: '#2563EB', color: '#fff',
                  px: 1.5, py: 0.4, borderRadius: '0 0 8px 8px',
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  animation: 'pulse-recommended 2s ease-in-out infinite',
                }}>
                  RECOMMANDÉ
                </Box>
              )}

              {/* Plan header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, mt: plan.featured ? 1 : 0 }}>
                <Box sx={{
                  width: 44, height: 44, borderRadius: '12px',
                  bgcolor: `${plan.accent}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon sx={{ color: plan.accent, fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography sx={{
                    fontSize: 18, fontWeight: 800, color: '#0F172A',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}>
                    {plan.label}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
                    {plan.subtitle}
                  </Typography>
                </Box>
              </Box>

              {/* Price */}
              <PriceDisplay price={price} annual={annual} accent={plan.accent} />

              {/* Annual note */}
              {annual && (
                <Typography sx={{ fontSize: 11, color: '#16A34A', fontWeight: 600, mb: 2, fontFamily: 'DM Sans, sans-serif' }}>
                  Économisez {(plan.monthly - plan.annual) * 12} MAD/an
                </Typography>
              )}

              <Divider sx={{ my: 2, borderColor: plan.featured ? '#BFDBFE' : '#F1F5F9' }} />

              {/* Features */}
              <Stack spacing={1.2} sx={{ mb: 3 }}>
                {plan.features.map((f, fi) => (
                  <Box key={fi} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {f.ok
                      ? <CheckIcon sx={{ color: '#22C55E', fontSize: 18, flexShrink: 0 }} />
                      : <CloseIcon sx={{ color: '#CBD5E1', fontSize: 18, flexShrink: 0 }} />}
                    <Typography sx={{
                      fontSize: 13.5, fontFamily: 'DM Sans, sans-serif',
                      color: f.ok ? '#334155' : '#CBD5E1',
                      fontWeight: f.ok ? 500 : 400,
                    }}>
                      {f.text}
                    </Typography>
                  </Box>
                ))}
              </Stack>

              {/* CTA Button */}
              {plan.featured ? (
                <Button
                  fullWidth
                  className="shimmer-btn"
                  onClick={() => handleBtn(plan.btnAction, plan)}
                  sx={{
                    py: 1.4, borderRadius: '12px', fontWeight: 700,
                    fontSize: 14, textTransform: 'none',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    color: '#fff',
                    boxShadow: '0 6px 24px rgba(37,99,235,0.35)',
                    border: 'none',
                  }}
                >
                  {plan.btnLabel}
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleBtn(plan.btnAction, plan)}
                  sx={{
                    py: 1.4, borderRadius: '12px', fontWeight: 700,
                    fontSize: 14, textTransform: 'none',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    borderColor: plan.accent,
                    color: plan.accent,
                    '&:hover': {
                      bgcolor: `${plan.accent}0D`,
                      borderColor: plan.accent,
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  {plan.btnLabel}
                </Button>
              )}
            </Box>
          );
        })}
      </Box>

      {/* ── COMPARISON TABLE ─────────────────────────────────────────────────── */}
      <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, md: 4 }, mb: 10 }}>
        <Typography
          sx={{
            fontSize: { xs: 26, md: 34 }, fontWeight: 800, textAlign: 'center',
            color: '#0F172A', mb: 1, fontFamily: 'Plus Jakarta Sans, sans-serif',
            letterSpacing: '-0.02em',
          }}
        >
          Comparez tous les plans
        </Typography>
        <Typography sx={{
          textAlign: 'center', color: '#64748B', mb: 4, fontSize: 16,
          fontFamily: 'DM Sans, sans-serif',
        }}>
          Une vue d'ensemble complète pour faire le bon choix
        </Typography>

        <Box sx={{
          borderRadius: '20px', overflow: 'hidden',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          bgcolor: '#fff',
        }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#64748B', fontFamily: 'Plus Jakarta Sans, sans-serif', py: 2 }}>
                  Fonctionnalité
                </TableCell>
                {[
                  { label: 'Basique', accent: '#64748B' },
                  { label: 'Pro', accent: '#2563EB' },
                  { label: 'Enterprise', accent: '#7C3AED' },
                ].map((col) => (
                  <TableCell key={col.label} align="center" sx={{ py: 2 }}>
                    <Typography sx={{
                      fontWeight: 800, fontSize: 14, color: col.accent,
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}>
                      {col.label}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {COMPARE_ROWS.map((row, i) => (
                <TableRow
                  key={i}
                  className="compare-row"
                  sx={{ borderTop: '1px solid #F1F5F9', '&:last-child td': { borderBottom: 0 } }}
                >
                  <TableCell sx={{ fontSize: 13.5, fontWeight: 500, color: '#334155', py: 1.8, fontFamily: 'DM Sans, sans-serif' }}>
                    {row.feature}
                  </TableCell>
                  <TableCell align="center"><CmpCell value={row.basic} planAccent="#64748B" /></TableCell>
                  <TableCell align="center"><CmpCell value={row.pro} planAccent="#2563EB" /></TableCell>
                  <TableCell align="center"><CmpCell value={row.enterprise} planAccent="#7C3AED" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <Box sx={{ maxWidth: 700, mx: 'auto', px: { xs: 2, md: 4 }, mb: 10 }}>
        <Typography
          sx={{
            fontSize: { xs: 26, md: 34 }, fontWeight: 800, textAlign: 'center',
            color: '#0F172A', mb: 1, fontFamily: 'Plus Jakarta Sans, sans-serif',
            letterSpacing: '-0.02em',
          }}
        >
          Questions fréquentes
        </Typography>
        <Typography sx={{
          textAlign: 'center', color: '#64748B', mb: 5, fontSize: 16,
          fontFamily: 'DM Sans, sans-serif',
        }}>
          Tout ce que vous devez savoir avant de commencer
        </Typography>

        {FAQ.map((item, i) => (
          <Accordion
            key={i}
            expanded={expandedFaq === i}
            onChange={(_, exp) => setExpandedFaq(exp ? i : false)}
            className="faq-accordion"
            sx={{ mb: 1.5 }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: '#2563EB' }} />}
              sx={{ px: 3, py: 0.5 }}
            >
              <Typography sx={{
                fontWeight: 600, fontSize: 15, color: '#0F172A',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}>
                {item.q}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 3, pb: 2.5 }}>
              <Typography sx={{
                color: '#64748B', fontSize: 14.5, lineHeight: 1.7,
                fontFamily: 'DM Sans, sans-serif',
              }}>
                {item.a}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* ── CTA FINAL ────────────────────────────────────────────────────────── */}
      <Box sx={{ px: { xs: 2, md: 6 }, pb: 10 }}>
        <Box sx={{
          background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 40%, #7C3AED 100%)',
          borderRadius: '28px', p: { xs: 5, md: 8 }, textAlign: 'center',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(37,99,235,0.3)',
        }}>
          {/* Decorative orbs */}
          <Box sx={{
            position: 'absolute', top: -60, right: -60,
            width: 280, height: 280, borderRadius: '50%',
            background: 'rgba(124,58,237,0.3)', filter: 'blur(60px)',
            pointerEvents: 'none',
          }} />
          <Box sx={{
            position: 'absolute', bottom: -80, left: -40,
            width: 320, height: 320, borderRadius: '50%',
            background: 'rgba(37,99,235,0.25)', filter: 'blur(80px)',
            pointerEvents: 'none',
          }} />
          {/* Dot grid overlay */}
          <Box sx={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography
              sx={{
                fontSize: { xs: 28, md: 42 }, fontWeight: 800, color: '#FFFFFF',
                mb: 2, lineHeight: 1.2, letterSpacing: '-0.02em',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              Prêt à digitaliser votre facturation ?
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: 15, md: 18 }, color: 'rgba(255,255,255,0.85)',
                mb: 5, maxWidth: 480, mx: 'auto', lineHeight: 1.65,
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              Rejoignez des centaines de PME marocaines.
              <br />Premier mois offert. Sans carte bancaire.
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                size="large"
                onClick={() => navigate('/login')}
                sx={{
                  bgcolor: 'transparent',
                  color: '#FFFFFF',
                  fontWeight: 600, fontSize: 15, textTransform: 'none',
                  borderRadius: '14px', px: 5, py: 1.6,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  border: '2px solid rgba(255,255,255,0.7)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.12)',
                    borderColor: '#FFFFFF',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s',
                }}
              >
                Voir une démo
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <Box sx={{
        borderTop: '1px solid #E2E8F0', px: { xs: 3, md: 8 }, py: 4,
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
        alignItems: 'center', gap: 2,
        bgcolor: '#fff',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 28, height: 28, borderRadius: '8px',
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ReceiptLongIcon sx={{ color: '#fff', fontSize: 15 }} />
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0F172A', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            FacturaPro
          </Typography>
        </Box>
        <Typography sx={{ fontSize: 12, color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
          © 2026 FacturaPro · Tous droits réservés · contact@facturapro.ma
        </Typography>
        <Button
          onClick={() => navigate('/login')}
          sx={{ fontSize: 12, color: '#64748B', textTransform: 'none', fontFamily: 'DM Sans, sans-serif' }}
        >
          Se connecter →
        </Button>
      </Box>

      {/* ── CHECKOUT MODAL ───────────────────────────────────────────────────── */}
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        plan={selectedPlan}
        billingCycle={annual ? 'annual' : 'monthly'}
      />
    </Box>
  );
}
