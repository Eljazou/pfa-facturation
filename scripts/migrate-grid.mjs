// One-shot migration: MUI Grid v1 syntax → v6+ size prop
//   <Grid item xs={12} sm={6} md={3} sx={{...}}>  →  <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{...}}>
//   <Grid item xs="auto" sx={{...}}>              →  <Grid size="auto" sx={{...}}>
import fs from 'node:fs';
import path from 'node:path';

const FILES = [
  'src/features/dashboard/UserDashboard.jsx',
  'src/features/dashboard/AdminDashboard.jsx',
  'src/features/profile/ProfilePage.jsx',
  'src/features/invoices/InvoiceDetail.jsx',
  'src/features/invoices/InvoiceForm.jsx',
];

const BREAKPOINTS = ['xs', 'sm', 'md', 'lg', 'xl'];

// Match: <Grid item ...props...>
// We capture everything between "item" and ">" on the same line.
const GRID_ITEM_RE = /<Grid\s+item\b([^>]*)>/g;

// Extract a single prop's value: name={...}  or  name="..."
function extractProp(propStr, name) {
  // Brace expression: name={anything}
  const braceMatch = propStr.match(new RegExp(`\\b${name}=\\{([^}]+)\\}`));
  if (braceMatch) return { kind: 'expr', value: braceMatch[1].trim(), match: braceMatch[0] };
  // String literal: name="..."
  const strMatch = propStr.match(new RegExp(`\\b${name}="([^"]+)"`));
  if (strMatch) return { kind: 'str', value: strMatch[1], match: strMatch[0] };
  return null;
}

function migrate(content) {
  let count = 0;
  const out = content.replace(GRID_ITEM_RE, (full, propsStr) => {
    let remaining = propsStr;
    const sizeParts = [];
    let allString = true; // if every breakpoint is a quoted string with same value, can use shorthand

    for (const bp of BREAKPOINTS) {
      const found = extractProp(remaining, bp);
      if (!found) continue;
      remaining = remaining.replace(found.match, '');
      if (found.kind === 'expr') {
        sizeParts.push(`${bp}: ${found.value}`);
        allString = false;
      } else {
        sizeParts.push(`${bp}: '${found.value}'`);
      }
    }

    let sizeProp = '';
    if (sizeParts.length === 0) {
      // No responsive props on the item — remove `item` only
      sizeProp = '';
    } else if (sizeParts.length === 1 && /^xs:\s*'(auto|grow)'$/.test(sizeParts[0])) {
      // Special: only xs="auto" → size="auto"
      const m = sizeParts[0].match(/'([^']+)'/);
      sizeProp = ` size="${m[1]}"`;
    } else {
      sizeProp = ` size={{ ${sizeParts.join(', ')} }}`;
    }

    count += 1;
    return `<Grid${sizeProp}${remaining.trimStart() ? ' ' + remaining.trim() : ''}>`;
  });
  return { out, count };
}

let total = 0;
for (const rel of FILES) {
  const abs = path.resolve(rel);
  const src = fs.readFileSync(abs, 'utf8');
  const { out, count } = migrate(src);
  if (count > 0) {
    fs.writeFileSync(abs, out);
    total += count;
    console.log(`  ${rel}: ${count} Grid items migrated`);
  }
}
console.log(`Done. ${total} total replacements.`);
