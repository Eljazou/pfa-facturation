import { createTheme } from '@mui/material/styles';

// ── Design tokens ────────────────────────────────────────────────────────────
export const tokens = {
  color: {
    primary:      '#2563EB',
    primaryDark:  '#1D4ED8',
    primaryLight: '#DBEAFE',
    secondary:    '#7C3AED',
    success:      '#059669',
    successLight: '#D1FAE5',
    warning:      '#D97706',
    warningLight: '#FEF3C7',
    error:        '#DC2626',
    errorLight:   '#FEE2E2',
    info:         '#0891B2',
    infoLight:    '#CFFAFE',

    bgApp:        '#F8FAFC',
    bgCard:       '#FFFFFF',
    bgSidebar:    '#0F172A',
    bgHover:      '#F1F5F9',

    textPrimary:   '#0F172A',
    textSecondary: '#64748B',
    textMuted:     '#94A3B8',
    textOnDark:    '#F8FAFC',

    border:    '#E2E8F0',
    divider:   '#F1F5F9',
  },
  radius: { sm: 6, md: 10, lg: 14, xl: 20, full: 9999 },
  space:  { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
};

const c = tokens.color;

const theme = createTheme({
  palette: {
    primary:    { main: c.primary,   dark: c.primaryDark, light: c.primaryLight, contrastText: '#FFFFFF' },
    secondary:  { main: c.secondary, contrastText: '#FFFFFF' },
    success:    { main: c.success,   light: c.successLight },
    warning:    { main: c.warning,   light: c.warningLight },
    error:      { main: c.error,     light: c.errorLight },
    info:       { main: c.info,      light: c.infoLight },
    background: { default: c.bgApp,  paper: c.bgCard },
    text:       { primary: c.textPrimary, secondary: c.textSecondary, disabled: c.textMuted },
    divider:    c.border,
    grey: {
      50:  '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    htmlFontSize: 14,
    h1: { fontSize: '30px', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontSize: '24px', fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontSize: '20px', fontWeight: 700 },
    h4: { fontSize: '18px', fontWeight: 600 },
    h5: { fontSize: '16px', fontWeight: 600 },
    h6: { fontSize: '15px', fontWeight: 600 },
    body1:    { fontSize: '14px', fontWeight: 400, lineHeight: 1.55 },
    body2:    { fontSize: '13px', fontWeight: 400, lineHeight: 1.55 },
    caption:  { fontSize: '12px', fontWeight: 400, color: c.textSecondary },
    overline: { fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' },
    button:   { fontSize: '14px', fontWeight: 500, textTransform: 'none', letterSpacing: 0 },
  },
  shape: { borderRadius: tokens.radius.md },
  shadows: [
    'none',
    '0 1px 2px rgba(15,23,42,0.05)',
    '0 1px 3px rgba(15,23,42,0.08)',
    '0 4px 6px rgba(15,23,42,0.07)',
    '0 8px 12px rgba(15,23,42,0.08)',
    '0 10px 15px rgba(15,23,42,0.1)',
    '0 12px 20px rgba(15,23,42,0.1)',
    '0 14px 22px rgba(15,23,42,0.1)',
    '0 16px 24px rgba(15,23,42,0.1)',
    '0 18px 26px rgba(15,23,42,0.1)',
    '0 20px 28px rgba(15,23,42,0.1)',
    '0 22px 30px rgba(15,23,42,0.1)',
    '0 24px 32px rgba(15,23,42,0.1)',
    '0 24px 34px rgba(15,23,42,0.12)',
    '0 24px 36px rgba(15,23,42,0.12)',
    '0 24px 38px rgba(15,23,42,0.12)',
    '0 24px 40px rgba(15,23,42,0.12)',
    '0 25px 42px rgba(15,23,42,0.13)',
    '0 25px 44px rgba(15,23,42,0.13)',
    '0 25px 46px rgba(15,23,42,0.13)',
    '0 25px 48px rgba(15,23,42,0.14)',
    '0 25px 50px rgba(15,23,42,0.14)',
    '0 25px 50px rgba(15,23,42,0.15)',
    '0 25px 50px rgba(15,23,42,0.15)',
    '0 25px 50px rgba(15,23,42,0.15)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: c.bgApp },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          minHeight: 40,
          paddingInline: 16,
          transition: 'background-color 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease',
          '&:active': { transform: 'scale(0.98)' },
        },
        sizeSmall:  { minHeight: 32, fontSize: 13, paddingInline: 12 },
        sizeLarge:  { minHeight: 46, fontSize: 15 },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 6px rgba(37,99,235,0.25)' },
        },
        containedPrimary: {
          backgroundColor: c.primary,
          '&:hover': { backgroundColor: c.primaryDark },
        },
        outlined: {
          borderWidth: 1.5,
          borderColor: c.border,
          color: c.textPrimary,
          backgroundColor: '#FFFFFF',
          '&:hover': { backgroundColor: c.bgHover, borderColor: '#94A3B8' },
        },
        text: {
          color: c.textPrimary,
          '&:hover': { backgroundColor: c.bgHover },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          width: 36,
          height: 36,
          transition: 'background-color 0.15s ease',
        },
        sizeSmall: { width: 32, height: 32 },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.lg,
          border: `1px solid ${c.border}`,
          boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        rounded:  { borderRadius: tokens.radius.lg },
        outlined: { borderColor: c.border },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#FFFFFF',
          fontSize: 14,
          '& fieldset': { borderColor: c.border, borderWidth: 1.5 },
          '&:hover fieldset': { borderColor: '#94A3B8' },
          '&.Mui-focused fieldset': { borderColor: c.primary, borderWidth: 2 },
          '&.Mui-disabled': { backgroundColor: c.bgHover },
        },
        input: { padding: '11px 14px' },
        notchedOutline: { borderColor: c.border },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: 14,
          color: c.textSecondary,
          '&.Mui-focused': { color: c.primary },
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: { borderRadius: tokens.radius.md, border: `1px solid ${c.border}`, backgroundColor: '#FFFFFF' },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: c.bgApp,
            color: c.textSecondary,
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: `2px solid ${c.border}`,
            paddingTop: 10,
            paddingBottom: 10,
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root': {
            transition: 'background-color 0.12s ease',
            '&:hover': { backgroundColor: c.bgApp },
            '& .MuiTableCell-root': {
              borderBottom: `1px solid ${c.divider}`,
              fontSize: 14,
              color: c.textPrimary,
              padding: '12px 16px',
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          border: `1px solid ${c.border}`,
          boxShadow: '0 25px 50px rgba(15,23,42,0.18)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: 18,
          fontWeight: 600,
          padding: '20px 24px',
          borderBottom: `1px solid ${c.divider}`,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: { root: { padding: '20px 24px' } },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
          borderTop: `1px solid ${c.divider}`,
          gap: 8,
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(15,23,42,0.5)',
          backdropFilter: 'blur(3px)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.full,
          fontWeight: 500,
          fontSize: 12,
          height: 24,
        },
        sizeSmall: { height: 22 },
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
      styleOverrides: {
        tooltip: {
          backgroundColor: c.textPrimary,
          fontSize: 12,
          borderRadius: 6,
          padding: '6px 10px',
        },
        arrow: { color: c.textPrimary },
      },
    },
    MuiAppBar: {
      defaultProps: { color: 'inherit', elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: c.textPrimary,
          borderBottom: `1px solid ${c.border}`,
          boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { height: 3, borderRadius: '3px 3px 0 0' },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: 14,
          minHeight: 44,
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderColor: c.border,
          color: c.textPrimary,
          '&.Mui-selected': {
            backgroundColor: c.primaryLight,
            color: c.primaryDark,
            '&:hover': { backgroundColor: c.primaryLight },
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, height: 6, backgroundColor: c.bgHover },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10, fontSize: 14 },
        standardSuccess: { backgroundColor: c.successLight, color: '#065F46' },
        standardWarning: { backgroundColor: c.warningLight, color: '#92400E' },
        standardError:   { backgroundColor: c.errorLight,   color: '#991B1B' },
        standardInfo:    { backgroundColor: c.infoLight,    color: '#155E75' },
      },
    },
    MuiSnackbar: {
      styleOverrides: { root: { '& .MuiAlert-root': { borderRadius: 10 } } },
    },
    MuiAvatar: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: `1px solid ${c.border}`,
          borderRadius: tokens.radius.md,
          backgroundColor: '#FFFFFF',
          fontSize: 14,
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: c.bgApp,
            borderBottom: `2px solid ${c.border}`,
            color: c.textSecondary,
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
          '& .MuiDataGrid-row:hover': { backgroundColor: c.bgApp },
          '& .MuiDataGrid-cell': { borderBottom: `1px solid ${c.divider}` },
          '& .MuiDataGrid-footerContainer': { borderTop: `1px solid ${c.border}` },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundImage: 'none' },
      },
    },
  },
});

export default theme;
