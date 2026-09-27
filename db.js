// Shared Supabase client. Loaded after config.js and the supabase-js CDN script.
window.sb = (window.SUPABASE_URL && window.SUPABASE_URL !== "YOUR_SUPABASE_URL")
  ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
  : null;

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

function todayISO() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function formatDayHeading(iso) {
  const today = todayISO();
  const d = new Date(iso + 'T00:00:00');
  const t = new Date(today + 'T00:00:00');
  const diffDays = Math.round((d - t) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'pm' : 'am';
  const h12 = ((hour + 11) % 12) + 1;
  return m === '00' ? h12 + ampm : h12 + ':' + m + ampm;
}

function daysUntil(iso) {
  const today = new Date(todayISO() + 'T00:00:00');
  const d = new Date(iso + 'T00:00:00');
  return Math.round((d - today) / 86400000);
}

// For a recurring yearly event (birthday, anniversary), `origDate` is the
// original date on record (e.g. actual date of birth). Returns the ISO date
// of this year's occurrence, or next year's if this year's has passed.
function nextOccurrence(origDate) {
  const today = new Date(todayISO() + 'T00:00:00');
  const orig = new Date(origDate + 'T00:00:00');
  let year = today.getFullYear();
  let occ = new Date(year, orig.getMonth(), orig.getDate());
  if (occ < today) occ = new Date(year + 1, orig.getMonth(), orig.getDate());
  return occ.getFullYear() + '-' + String(occ.getMonth() + 1).padStart(2, '0') + '-' + String(occ.getDate()).padStart(2, '0');
}

// Turning-X / X-years number for a recurring event's next occurrence.
function yearsAt(origDate) {
  const orig = new Date(origDate + 'T00:00:00');
  const occ = new Date(nextOccurrence(origDate) + 'T00:00:00');
  return occ.getFullYear() - orig.getFullYear();
}

// For a recurring event, the ISO date it falls on within a given displayed
// year/month (monthIndex 0-11), using the month/day from the original date.
// Clamps to the last real day of that month (handles 29 Feb, 31st, etc).
function monthOccurrence(origDate, year, monthIndex) {
  const orig = new Date(origDate + 'T00:00:00');
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const day = Math.min(orig.getDate(), lastDay);
  return year + '-' + String(monthIndex + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
}
