import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckoutModal from '../components/CheckoutModal';
import {
  Box, Typography, Button, Divider,
  Accordion, AccordionSummary, AccordionDetails,
  Table, TableHead, TableBody, TableRow, TableCell,
  Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Snackbar, Alert,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import GroupIcon from '@mui/icons-material/Group';
import BusinessIcon from '@mui/icons-material/Business';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

/* ─── Original app tokens ───────────────────────────────────────────────────── */
const C = {
  bg:       '#F8FAFC',
  surface:  '#FFFFFF',
  blue:     '#2563EB',
  purple:   '#7C3AED',
  grad:     'linear-gradient(135deg, #2563EB, #7C3AED)',
  gradDeep: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 40%, #7C3AED 100%)',
  text:     '#0F172A',
  muted:    '#64748B',
  border:   '#E2E8F0',
  green:    '#22C55E',
  display:  '"Plus Jakarta Sans", sans-serif',
  body:     '"DM Sans", sans-serif',
};

/* ─── Global styles ──────────────────────────────────────────────────────────── */
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

  @keyframes fp-fadeUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fp-flipPrice {
    0%  { opacity:1; transform:scaleY(1); }
    40% { opacity:0; transform:scaleY(0); }
    60% { opacity:0; transform:scaleY(0); }
    100%{ opacity:1; transform:scaleY(1); }
  }
  @keyframes fp-float {
    0%,100% { transform: translateY(0px); }
    50%     { transform: translateY(-10px); }
  }
  @keyframes fp-pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.35); }
    50%     { box-shadow: 0 0 0 10px rgba(37,99,235,0); }
  }
  @keyframes fp-glow {
    0%,100% { box-shadow: 0 20px 60px rgba(37,99,235,0.18), 0 0 0 0 rgba(37,99,235,0.2); }
    50%     { box-shadow: 0 28px 80px rgba(37,99,235,0.28), 0 0 0 8px rgba(37,99,235,0); }
  }
  @keyframes fp-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes fp-gridMove {
    from { transform: translateY(0); }
    to   { transform: translateY(60px); }
  }
  @keyframes fp-blob1 {
    0%,100% { transform: translate(0,0) scale(1); }
    33%     { transform: translate(30px,-20px) scale(1.05); }
    66%     { transform: translate(-20px,10px) scale(0.97); }
  }
  @keyframes fp-blob2 {
    0%,100% { transform: translate(0,0) scale(1); }
    33%     { transform: translate(-25px,15px) scale(1.04); }
    66%     { transform: translate(20px,-10px) scale(0.98); }
  }
  @keyframes fp-badge {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(-4px); }
  }
  @keyframes fp-spin-slow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  /* Scroll-reveal utility */
  .fp-reveal {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.6s cubic-bezier(.22,.68,0,1), transform 0.6s cubic-bezier(.22,.68,0,1);
  }
  .fp-reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }
  .fp-reveal-d1 { transition-delay: 0.05s; }
  .fp-reveal-d2 { transition-delay: 0.15s; }
  .fp-reveal-d3 { transition-delay: 0.25s; }

  /* Hero initial animations */
  .fp-hero-1 { animation: fp-fadeUp 0.6s cubic-bezier(.22,.68,0,1) 0.05s both; }
  .fp-hero-2 { animation: fp-fadeUp 0.6s cubic-bezier(.22,.68,0,1) 0.15s both; }
  .fp-hero-3 { animation: fp-fadeUp 0.6s cubic-bezier(.22,.68,0,1) 0.25s both; }
  .fp-hero-4 { animation: fp-fadeUp 0.6s cubic-bezier(.22,.68,0,1) 0.35s both; }

  /* Cards */
  .fp-card {
    transition: transform 0.32s cubic-bezier(.22,.68,0,1.2), box-shadow 0.32s ease;
    cursor: default;
  }
  .fp-card:hover { transform: translateY(-10px); }
  .fp-card-pro {
    animation: fp-glow 3s ease-in-out infinite, fp-float 5s ease-in-out infinite;
  }
  .fp-card-pro:hover {
    transform: scale(1.02) translateY(-12px) !important;
    animation-play-state: paused;
    box-shadow: 0 36px 80px rgba(37,99,235,0.32) !important;
  }

  /* Shimmer button */
  .fp-shimmer {
    background: linear-gradient(90deg, #2563EB 0%, #7C3AED 35%, #a78bfa 55%, #2563EB 100%);
    background-size: 200% auto;
    transition: background-position 0.5s ease, transform 0.2s ease, box-shadow 0.2s ease;
  }
  .fp-shimmer:hover {
    animation: fp-shimmer 1.5s linear infinite;
    transform: translateY(-2px);
    box-shadow: 0 10px 32px rgba(124,58,237,0.45) !important;
  }

  /* Price flip */
  .fp-price { display: inline-block; }
  .fp-price.flipping { animation: fp-flipPrice 0.38s ease both; }

  /* FAQ */
  .fp-faq {
    border-radius: 14px !important;
    margin-bottom: 10px !important;
    box-shadow: none !important;
    border: 1.5px solid #E2E8F0 !important;
    overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
    background: #fff !important;
  }
  .fp-faq:before { display: none !important; }
  .fp-faq.Mui-expanded {
    border-color: #2563EB !important;
    box-shadow: 0 4px 24px rgba(37,99,235,0.09) !important;
  }

  /* Compare table */
  .fp-row:hover td { background: #F1F5FF; }
  .fp-row td { transition: background 0.15s; }

  @media (prefers-reduced-motion: reduce) {
    .fp-reveal, .fp-hero-1,.fp-hero-2,.fp-hero-3,.fp-hero-4 {
      animation: none; opacity: 1; transform: none; transition: none;
    }
    .fp-card, .fp-card-pro { animation: none; transition: none; }
  }
`;

/* ─── Data ───────────────────────────────────────────────────────────────────── */
const PLANS = [
  {
    id: 'basic', icon: AccountCircleIcon,
    label: 'Basique', subtitle: '1 utilisateur · 50 factures/mois',
    accent: '#64748B', monthly: 100, annual: 80, featured: false,
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
    btnLabel: "Démarrer l'essai", btnAction: 'register',
  },
  {
    id: 'pro', icon: GroupIcon,
    label: 'Pro', subtitle: '2 utilisateurs · factures illimitées',
    accent: '#2563EB', monthly: 200, annual: 160, featured: true,
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
    btnLabel: 'Commencer avec Pro', btnAction: 'register',
  },
  {
    id: 'enterprise', icon: BusinessIcon,
    label: 'Enterprise', subtitle: 'Multi-utilisateurs · multi-société',
    accent: '#7C3AED', monthly: 300, annual: 240, featured: false,
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
    btnLabel: "Contacter l'équipe", btnAction: 'contact',
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
  { q: 'Est-ce que je peux changer de plan ?', a: "Oui, vous pouvez upgrader ou downgrader votre plan à tout moment depuis votre espace paramètres. Le changement prend effet immédiatement." },
  { q: "Y a-t-il un engagement minimum ?", a: "Non, aucun engagement. Vous pouvez annuler votre abonnement à tout moment sans frais." },
  { q: "Comment fonctionne l'essai gratuit ?", a: "Vous bénéficiez de 30 jours d'essai gratuit sur le plan Pro sans carte bancaire requise. À la fin de l'essai, choisissez votre plan." },
  { q: "Mes données sont-elles sécurisées ?", a: "Oui. Toutes les données sont chiffrées en transit (HTTPS/TLS) et stockées sur Firebase (Google Cloud). Nous sommes conformes à la Loi 09-08 marocaine." },
  { q: "Puis-je exporter mes données ?", a: "Oui, vous pouvez exporter toutes vos factures en Excel ou PDF à tout moment, même si vous décidez d'annuler votre abonnement." },
];

/* ─── Animated counter ───────────────────────────────────────────────────────── */
function useCounter(target, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let v = 0;
    const step = Math.ceil(target / (duration / 16));
    const t = setInterval(() => {
      v += step;
      if (v >= target) { setCount(target); clearInterval(t); }
      else setCount(v);
    }, 16);
    return () => clearInterval(t);
  }, [target, duration]);
  return count;
}

/* ─── Scroll reveal hook ─────────────────────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.fp-reveal');
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ─── Price with flip ────────────────────────────────────────────────────────── */
function PriceDisplay({ price, annual, accent }) {
  const [flipping, setFlipping] = useState(false);
  const prev = useRef(annual);
  useEffect(() => {
    if (prev.current !== annual) {
      setFlipping(true);
      const t = setTimeout(() => setFlipping(false), 380);
      prev.current = annual;
      return () => clearTimeout(t);
    }
  }, [annual]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.75, my: 2 }}>
      <Typography sx={{ fontSize: 15, fontWeight: 700, color: accent, mb: 0.9, fontFamily: C.display }}>MAD</Typography>
      <span className={`fp-price${flipping ? ' flipping' : ''}`}
        style={{ fontSize: 46, fontWeight: 800, color: accent, lineHeight: 1, fontFamily: C.display }}
      >{price}</span>
      <Typography sx={{ fontSize: 13, color: C.muted, mb: 0.9, fontFamily: C.body }}>/mois</Typography>
    </Box>
  );
}

/* ─── Compare cell ───────────────────────────────────────────────────────────── */
function CmpCell({ value, planAccent }) {
  if (value === true)  return <CheckIcon sx={{ color: planAccent || C.green, fontSize: 20 }} />;
  if (value === false) return <CloseIcon sx={{ color: '#CBD5E1', fontSize: 20 }} />;
  return <Typography sx={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: C.body }}>{value}</Typography>;
}

/* ─── Main ───────────────────────────────────────────────────────────────────── */
export default function PricingPage() {
  const navigate = useNavigate();
  const [annual,       setAnnual]       = useState(false);
  const [expandedFaq,  setExpandedFaq]  = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [contactOpen,  setContactOpen]  = useState(false);
  const [copied,       setCopied]       = useState(false);
  const count = useCounter(500);
  useReveal();

  const openCheckout = (plan) => {
    setSelectedPlan({ name: plan.label, monthlyPrice: plan.monthly, annualPrice: plan.annual });
    setCheckoutOpen(true);
  };
  const handleBtn = (action, plan) => {
    if (action === 'contact') { setContactOpen(true); return; }
    openCheckout(plan);
  };
  const handleCopyEmail = () => { navigator.clipboard.writeText('contact@facturapro.ma'); setCopied(true); };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: C.bg, fontFamily: C.body }}>
      <style>{GLOBAL_STYLES}</style>

      {/* ── NAV ──────────────────────────────────────────────────────────────── */}
      <Box component="nav" sx={{
        position: 'sticky', top: 0, zIndex: 100,
        bgcolor: 'rgba(248,250,252,0.88)', backdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${C.border}`,
        px: { xs: 2.5, md: 6 }, height: { xs: 56, md: 64 },
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Box onClick={() => navigate('/login')} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, cursor: 'pointer', flexShrink: 0 }}>
          <Box sx={{ width: { xs: 30, md: 34 }, height: { xs: 30, md: 34 }, borderRadius: '10px', background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ReceiptLongIcon sx={{ color: '#fff', fontSize: { xs: 16, md: 18 } }} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: 15, md: 17 }, fontFamily: C.display, color: C.text }}>FacturaPro</Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button onClick={() => navigate('/login')} sx={{ display: { xs: 'none', sm: 'inline-flex' }, fontSize: 13, color: C.muted, fontWeight: 500, fontFamily: C.body, textTransform: 'none', '&:hover': { color: C.blue, bgcolor: 'transparent' } }}>
            Connexion
          </Button>
          <Button variant="contained" onClick={() => navigate('/register')} sx={{ fontSize: { xs: 12, md: 13 }, fontWeight: 600, textTransform: 'none', borderRadius: '10px', px: { xs: 1.75, md: 2.5 }, py: { xs: 0.7, md: 0.9 }, whiteSpace: 'nowrap', fontFamily: C.display, background: C.grad, boxShadow: '0 4px 14px rgba(37,99,235,0.3)', '&:hover': { boxShadow: '0 6px 22px rgba(37,99,235,0.42)', transform: 'translateY(-1px)' }, transition: 'all 0.2s' }}>
            Créer un compte
          </Button>
        </Stack>
      </Box>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <Box sx={{ position: 'relative', overflow: 'hidden', pt: { xs: 10, md: 14 }, pb: { xs: 8, md: 12 }, textAlign: 'center', px: 3 }}>
        {/* Animated blobs */}
        <Box sx={{ position: 'absolute', top: -100, left: '8%', width: { xs: 300, md: 560 }, height: { xs: 300, md: 560 }, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.10) 0%, transparent 65%)', animation: 'fp-blob1 12s ease-in-out infinite', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', top: -40, right: '5%', width: { xs: 250, md: 420 }, height: { xs: 250, md: 420 }, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.09) 0%, transparent 65%)', animation: 'fp-blob2 10s ease-in-out infinite', pointerEvents: 'none' }} />
        {/* Grid */}
        <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.03, backgroundImage: `linear-gradient(${C.blue} 1px, transparent 1px), linear-gradient(90deg, ${C.blue} 1px, transparent 1px)`, backgroundSize: '40px 40px', animation: 'fp-gridMove 10s linear infinite' }} />

        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 780, mx: 'auto' }}>
          {/* Badge */}
          <Box className="fp-hero-1" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '100px', px: 2.5, py: 0.75, mb: 4, animation: 'fp-hero-1, fp-badge 3s ease-in-out 1s infinite' }}>
            <span style={{ fontSize: 16 }}>🚀</span>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: C.blue, fontFamily: C.display }}>Nouveau — Essai gratuit 30 jours</Typography>
          </Box>

          {/* Title */}
          <Typography component="h1" className="fp-hero-2" sx={{ fontSize: { xs: 36, sm: 50, md: 62 }, fontWeight: 800, lineHeight: 1.1, color: C.text, mb: 3, letterSpacing: '-0.03em', fontFamily: C.display }}>
            Des tarifs simples et{' '}
            <Box component="span" sx={{ background: C.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              transparents
            </Box>
          </Typography>

          {/* Subtitle */}
          <Typography className="fp-hero-3" sx={{ fontSize: { xs: 16, md: 19 }, color: C.muted, maxWidth: 520, mx: 'auto', lineHeight: 1.7, mb: 5, fontFamily: C.body }}>
            Choisissez le plan qui correspond à votre activité.
            <br />Pas de frais cachés. Annulez à tout moment.
          </Typography>

          {/* Social proof */}
          <Box className="fp-hero-4" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', px: 3, py: 1.5, boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
            <Box sx={{ display: 'flex' }}>
              {[C.blue, C.purple, '#10B981', '#F59E0B'].map((clr, i) => (
                <Box key={i} sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: clr, border: '2px solid #fff', ml: i === 0 ? 0 : '-8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{['A','B','C','D'][i]}</Typography>
                </Box>
              ))}
            </Box>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: C.display }}>
              Rejoignez <Box component="span" sx={{ color: C.blue }}>+{count}</Box> PME marocaines
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── TOGGLE ───────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2.5, mb: { xs: 6, md: 8 } }}>
        <Typography onClick={() => setAnnual(false)} sx={{ fontSize: 15, fontWeight: annual ? 400 : 700, color: annual ? C.muted : C.text, fontFamily: C.display, cursor: 'pointer', transition: 'all 0.25s', userSelect: 'none' }}>Mensuel</Typography>

        <Box onClick={() => setAnnual(!annual)} sx={{ width: 50, height: 28, borderRadius: 14, bgcolor: annual ? C.blue : '#CBD5E1', position: 'relative', cursor: 'pointer', transition: 'background 0.25s', flexShrink: 0, boxShadow: annual ? '0 0 0 3px rgba(37,99,235,0.15)' : 'none' }}>
          <Box sx={{ position: 'absolute', top: 4, left: annual ? 26 : 4, width: 20, height: 20, borderRadius: '50%', bgcolor: '#fff', transition: 'left 0.25s cubic-bezier(.22,.68,0,1.2)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography onClick={() => setAnnual(true)} sx={{ fontSize: 15, fontWeight: annual ? 700 : 400, color: annual ? C.text : C.muted, fontFamily: C.display, cursor: 'pointer', transition: 'all 0.25s', userSelect: 'none' }}>Annuel</Typography>
          <Box sx={{ overflow: 'hidden', maxWidth: annual ? 56 : 0, transition: 'max-width 0.35s cubic-bezier(.22,.68,0,1.2)' }}>
            <Box sx={{ px: 1, py: 0.3, bgcolor: '#DCFCE7', border: '1px solid #BBF7D0', borderRadius: '6px', whiteSpace: 'nowrap' }}>
              <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: '#15803D', fontFamily: C.display }}>−20%</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── CARDS ────────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: { xs: 3, md: 2.5 }, px: { xs: 2, md: 5, lg: 8 }, mb: { xs: 10, md: 14 }, perspective: '1000px' }}>
        {PLANS.map((plan, idx) => {
          const Icon = plan.icon;
          const price = annual ? plan.annual : plan.monthly;
          return (
            <Box
              key={plan.id}
              className={`fp-card fp-reveal fp-reveal-d${idx + 1} ${plan.featured ? 'fp-card-pro' : ''}`}
              sx={{
                position: 'relative',
                width: { xs: '100%', sm: 310, lg: 330 },
                bgcolor: plan.featured ? '#EFF6FF' : C.surface,
                border: plan.featured ? `2px solid ${C.blue}` : `1.5px solid ${C.border}`,
                borderRadius: '22px', p: { xs: 3, md: 3.5 },
                boxShadow: plan.featured ? '0 20px 60px rgba(37,99,235,0.18)' : '0 2px 20px rgba(0,0,0,0.05)',
                display: 'flex', flexDirection: 'column',
              }}
            >
              {plan.featured && (
                <Box sx={{ position: 'absolute', top: -1, left: 28, background: C.grad, color: '#fff', px: 1.75, py: 0.4, borderRadius: '0 0 9px 9px', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', fontFamily: C.display }}>
                  RECOMMANDÉ
                </Box>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: plan.featured ? 1.5 : 0, mb: 0.5 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: `${plan.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon sx={{ color: plan.accent, fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: C.display }}>{plan.label}</Typography>
                  <Typography sx={{ fontSize: 12, color: C.muted, fontFamily: C.body }}>{plan.subtitle}</Typography>
                </Box>
              </Box>

              <PriceDisplay price={price} annual={annual} accent={plan.accent} />

              {annual ? (
                <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 2.5, color: '#16A34A', fontFamily: C.body }}>
                  Économisez {(plan.monthly - plan.annual) * 12} MAD/an
                </Typography>
              ) : <Box sx={{ mb: 2.5 }} />}

              <Divider sx={{ borderColor: plan.featured ? '#BFDBFE' : '#F1F5F9', mb: 2.5 }} />

              <Stack spacing={1.2} sx={{ flex: 1, mb: 3 }}>
                {plan.features.map((f, fi) => (
                  <Box key={fi} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {f.ok
                      ? <CheckIcon sx={{ color: C.green, fontSize: 17, flexShrink: 0 }} />
                      : <CloseIcon sx={{ color: '#CBD5E1', fontSize: 17, flexShrink: 0 }} />}
                    <Typography sx={{ fontSize: 13.5, fontFamily: C.body, color: f.ok ? '#334155' : '#CBD5E1', fontWeight: f.ok ? 500 : 400 }}>
                      {f.text}
                    </Typography>
                  </Box>
                ))}
              </Stack>

              {plan.featured ? (
                <Button fullWidth className="fp-shimmer" onClick={() => handleBtn(plan.btnAction, plan)} sx={{ py: 1.45, borderRadius: '12px', fontWeight: 700, fontSize: 14, textTransform: 'none', fontFamily: C.display, color: '#fff', border: 'none', boxShadow: '0 6px 24px rgba(37,99,235,0.35)' }}>
                  {plan.btnLabel}
                </Button>
              ) : (
                <Button fullWidth variant="outlined" onClick={() => handleBtn(plan.btnAction, plan)} sx={{ py: 1.45, borderRadius: '12px', fontWeight: 700, fontSize: 14, textTransform: 'none', fontFamily: C.display, borderColor: plan.accent, color: plan.accent, borderWidth: '1.5px', '&:hover': { bgcolor: `${plan.accent}0D`, borderColor: plan.accent, transform: 'translateY(-2px)' }, transition: 'all 0.2s' }}>
                  {plan.btnLabel}
                </Button>
              )}
            </Box>
          );
        })}
      </Box>

      {/* ── COMPARE TABLE ────────────────────────────────────────────────────── */}
      <Box className="fp-reveal" sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, md: 4 }, mb: { xs: 10, md: 14 } }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography sx={{ fontSize: { xs: 26, md: 36 }, fontWeight: 800, color: C.text, fontFamily: C.display, letterSpacing: '-0.02em', mb: 1 }}>Comparez tous les plans</Typography>
          <Typography sx={{ color: C.muted, fontSize: 16, fontFamily: C.body }}>Une vue d'ensemble complète pour faire le bon choix</Typography>
        </Box>
        <Box sx={{ borderRadius: '20px', overflow: 'hidden', border: `1px solid ${C.border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
          <Table sx={{ minWidth: 480 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: 13, color: C.muted, fontFamily: C.display, py: 2, borderBottom: `1px solid ${C.border}` }}>Fonctionnalité</TableCell>
                {[{ label: 'Basique', accent: '#64748B' }, { label: 'Pro', accent: C.blue }, { label: 'Enterprise', accent: C.purple }].map((col) => (
                  <TableCell key={col.label} align="center" sx={{ py: 2, borderBottom: `1px solid ${C.border}` }}>
                    <Typography sx={{ fontWeight: 800, fontSize: 14, color: col.accent, fontFamily: C.display }}>{col.label}</Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {COMPARE_ROWS.map((row, i) => (
                <TableRow key={i} className="fp-row" sx={{ borderTop: `1px solid ${C.border}`, '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell sx={{ fontSize: 13.5, fontWeight: 500, color: '#334155', py: 1.8, fontFamily: C.body }}>{row.feature}</TableCell>
                  <TableCell align="center" sx={{ bgcolor: i % 2 === 0 ? '#FAFAFA' : '#fff' }}><CmpCell value={row.basic} planAccent="#64748B" /></TableCell>
                  <TableCell align="center" sx={{ bgcolor: i % 2 === 0 ? '#EFF6FF' : '#F5F8FF' }}><CmpCell value={row.pro} planAccent={C.blue} /></TableCell>
                  <TableCell align="center" sx={{ bgcolor: i % 2 === 0 ? '#FAFAFA' : '#fff' }}><CmpCell value={row.enterprise} planAccent={C.purple} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <Box className="fp-reveal" sx={{ maxWidth: 700, mx: 'auto', px: { xs: 2, md: 4 }, mb: { xs: 10, md: 14 } }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography sx={{ fontSize: { xs: 26, md: 36 }, fontWeight: 800, color: C.text, fontFamily: C.display, letterSpacing: '-0.02em', mb: 1 }}>Questions fréquentes</Typography>
          <Typography sx={{ color: C.muted, fontSize: 16, fontFamily: C.body }}>Tout ce que vous devez savoir avant de commencer</Typography>
        </Box>
        {FAQ.map((item, i) => (
          <Accordion key={i} expanded={expandedFaq === i} onChange={(_, exp) => setExpandedFaq(exp ? i : false)} className="fp-faq">
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: C.blue }} />} sx={{ px: 3, py: 0.75 }}>
              <Typography sx={{ fontWeight: 600, fontSize: 15, color: C.text, fontFamily: C.display }}>{item.q}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 3, pb: 2.5, pt: 0 }}>
              <Typography sx={{ color: C.muted, fontSize: 14.5, lineHeight: 1.75, fontFamily: C.body }}>{item.a}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <Box className="fp-reveal" sx={{ px: { xs: 2, md: 5, lg: 8 }, pb: { xs: 10, md: 14 } }}>
        <Box sx={{ background: C.gradDeep, borderRadius: { xs: '22px', md: '28px' }, p: { xs: 5, md: 8 }, textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 80px rgba(37,99,235,0.3)' }}>
          <Box sx={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(124,58,237,0.3)', filter: 'blur(60px)', pointerEvents: 'none' }} />
          <Box sx={{ position: 'absolute', bottom: -80, left: -40, width: 320, height: 320, borderRadius: '50%', background: 'rgba(37,99,235,0.25)', filter: 'blur(80px)', pointerEvents: 'none' }} />
          <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography sx={{ fontSize: { xs: 28, md: 44 }, fontWeight: 800, color: '#fff', mb: 2, lineHeight: 1.15, letterSpacing: '-0.025em', fontFamily: C.display }}>
              Prêt à digitaliser votre facturation ?
            </Typography>
            <Typography sx={{ fontSize: { xs: 15, md: 18 }, color: 'rgba(255,255,255,0.82)', mb: 5, maxWidth: 460, mx: 'auto', lineHeight: 1.7, fontFamily: C.body }}>
              Premier mois offert. Sans carte bancaire. Annulez à tout moment.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              <Button size="large" onClick={() => navigate('/register')} sx={{ bgcolor: '#fff', color: C.blue, fontWeight: 700, fontSize: 15, textTransform: 'none', borderRadius: '13px', px: 4.5, py: 1.6, fontFamily: C.display, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', '&:hover': { bgcolor: '#F0F9FF', transform: 'translateY(-2px)', boxShadow: '0 8px 28px rgba(0,0,0,0.2)' }, transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                Essayer gratuitement →
              </Button>
              <Button size="large" onClick={() => navigate('/login')} sx={{ bgcolor: 'transparent', color: 'rgba(255,255,255,0.8)', fontWeight: 500, fontSize: 14, textTransform: 'none', borderRadius: '13px', px: 3.5, py: 1.6, fontFamily: C.body, border: '1.5px solid rgba(255,255,255,0.3)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.6)' }, transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                Se connecter
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <Box sx={{ borderTop: `1px solid ${C.border}`, px: { xs: 3, md: 6 }, py: { xs: 3, md: 3.5 }, bgcolor: C.surface }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'space-between', gap: { xs: 2, md: 0 }, textAlign: { xs: 'center', md: 'left' } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: { xs: 'center', md: 'flex-start' } }}>
            <Box sx={{ width: 28, height: 28, borderRadius: '8px', background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ReceiptLongIcon sx={{ color: '#fff', fontSize: 15 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: C.text, fontFamily: C.display }}>FacturaPro</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, color: C.muted, fontFamily: C.body }}>© 2026 FacturaPro · Tous droits réservés</Typography>
            <Typography sx={{ fontSize: 12, color: C.muted, fontFamily: C.body, mt: 0.25 }}>contact@facturapro.ma</Typography>
          </Box>
          <Button onClick={() => navigate('/login')} sx={{ fontSize: 12.5, color: C.muted, textTransform: 'none', fontFamily: C.body, '&:hover': { color: C.blue, bgcolor: 'transparent' } }}>
            Se connecter →
          </Button>
        </Box>
      </Box>

      {/* ── CONTACT MODAL ────────────────────────────────────────────────────── */}
      <Dialog
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden', maxWidth: 440, width: '100%', m: 2 } }}
      >
        {/* Gradient header */}
        <Box sx={{ background: C.grad, px: 3, pt: 3.5, pb: 4, position: 'relative', overflow: 'hidden' }}>
          {/* decorative circles */}
          <Box sx={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
          <Box sx={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

          <IconButton
            onClick={() => setContactOpen(false)}
            size="small"
            sx={{ position: 'absolute', right: 12, top: 12, color: 'rgba(255,255,255,0.7)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)', color: '#fff' } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          {/* Icon */}
          <Box sx={{ width: 52, height: 52, borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, backdropFilter: 'blur(8px)' }}>
            <Typography sx={{ fontSize: 26 }}>🚀</Typography>
          </Box>

          <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: C.display, lineHeight: 1.2, mb: 0.75 }}>
            Parlons de votre projet
          </Typography>
          <Typography sx={{ fontSize: 14, color: 'rgba(255,255,255,0.78)', fontFamily: C.body, lineHeight: 1.5 }}>
            Notre équipe vous répond sous <strong style={{ color: '#fff' }}>24h</strong> avec une offre personnalisée.
          </Typography>
        </Box>

        {/* Content */}
        <Box sx={{ px: 3, pt: 3, pb: 1 }}>
          {/* Response time chips */}
          <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
            {['⚡ Réponse rapide', '🔒 Confidentiel', '🎯 Sur mesure'].map((label) => (
              <Box key={label} sx={{ px: 1.25, py: 0.4, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '20px' }}>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: C.blue, fontFamily: C.body, whiteSpace: 'nowrap' }}>{label}</Typography>
              </Box>
            ))}
          </Stack>

          <Stack spacing={1.5}>
            {/* Email button */}
            <Button
              component="a"
              href="mailto:contact@facturapro.ma"
              fullWidth
              sx={{
                py: 1.6, borderRadius: '13px', textTransform: 'none',
                fontWeight: 700, fontSize: 14.5, fontFamily: C.display,
                background: C.grad, color: '#fff',
                boxShadow: '0 6px 20px rgba(37,99,235,0.32)',
                display: 'flex', alignItems: 'center', gap: 1.5,
                '&:hover': { boxShadow: '0 10px 28px rgba(37,99,235,0.42)', transform: 'translateY(-1px)' },
                transition: 'all 0.2s',
              }}
            >
              <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✉️</Box>
              Envoyer un email
            </Button>

            {/* Copy button */}
            <Button
              fullWidth
              onClick={handleCopyEmail}
              sx={{
                py: 1.6, borderRadius: '13px', textTransform: 'none',
                fontWeight: 600, fontSize: 14.5, fontFamily: C.display,
                bgcolor: '#F8FAFC', color: C.text,
                border: `1.5px solid ${C.border}`,
                display: 'flex', alignItems: 'center', gap: 1.5,
                '&:hover': { bgcolor: '#EFF6FF', borderColor: C.blue, color: C.blue },
                transition: 'all 0.2s',
              }}
            >
              <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📋</Box>
              Copier l'adresse email
            </Button>
          </Stack>

          {/* Email display */}
          <Box sx={{ mt: 2.5, mb: 1, p: 1.75, bgcolor: '#F8FAFC', border: `1px dashed ${C.border}`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22C55E', flexShrink: 0 }} />
            <Typography sx={{ fontSize: 13.5, color: C.muted, fontFamily: C.body, fontWeight: 500 }}>
              contact@facturapro.ma
            </Typography>
          </Box>
        </Box>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 0.5 }}>
          <Button onClick={() => setContactOpen(false)} sx={{ textTransform: 'none', color: C.muted, fontFamily: C.body, fontSize: 13, '&:hover': { bgcolor: 'transparent', color: C.text } }}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={copied} autoHideDuration={2500} onClose={() => setCopied(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" sx={{ borderRadius: '10px' }}>Email copié dans le presse-papiers !</Alert>
      </Snackbar>

      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} plan={selectedPlan} billingCycle={annual ? 'annual' : 'monthly'} />
    </Box>
  );
}
