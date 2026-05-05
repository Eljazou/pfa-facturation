export function formatDistanceToNow(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const diff = Math.max(0, Date.now() - d.getTime());
  const sec = Math.floor(diff / 1000);
  if (sec < 60)        return "à l'instant";
  const min = Math.floor(sec / 60);
  if (min < 60)        return `il y a ${min} minute${min > 1 ? 's' : ''}`;
  const h = Math.floor(min / 60);
  if (h < 24)          return `il y a ${h} heure${h > 1 ? 's' : ''}`;
  const day = Math.floor(h / 24);
  if (day < 7)         return `il y a ${day} jour${day > 1 ? 's' : ''}`;
  const wk = Math.floor(day / 7);
  if (wk < 5)          return `il y a ${wk} semaine${wk > 1 ? 's' : ''}`;
  const mo = Math.floor(day / 30);
  if (mo < 12)         return `il y a ${mo} mois`;
  const yr = Math.floor(day / 365);
  return `il y a ${yr} an${yr > 1 ? 's' : ''}`;
}
