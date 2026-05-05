export function formatAmount(value, devise = 'MAD') {
  const num = Number(value ?? 0);
  const abs = Math.abs(num).toFixed(2);
  const [intPart, dec] = abs.split('.');
  const thousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${num < 0 ? '-' : ''}${thousands}.${dec} ${devise}`;
}

export function formatCompact(value, devise = 'MAD') {
  const n = Number(value ?? 0);
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M ${devise}`;
  if (abs >= 1_000)     return `${sign}${(abs / 1_000).toFixed(1)}k ${devise}`;
  return `${sign}${abs.toFixed(0)} ${devise}`;
}

export function formatPercent(value, decimals = 1) {
  const n = Number(value ?? 0);
  return `${n.toFixed(decimals)}%`;
}
