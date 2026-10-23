/* Диспетчер доставки — мастер-приложение (PWA)
 * Работает с Supabase (схема в supabase/schema.sql) или в демо-режиме без сервера.
 */
(() => {
'use strict';

const APP_VERSION = '0.1.0';

const CDN = {
  supabase: [
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
    'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js',
  ],
  leafletJs: [
    'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  ],
  xlsx: [
    'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    'https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js',
  ],
  leafletCss: [
    'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  ],
};

const STATUS = {
  draft: 'Черновик', sent: 'Отправлен', accepted: 'Принят',
  in_progress: 'В пути', done: 'Завершён', cancelled: 'Отменён',
};
const COURIER_STATE = {
  online: 'на смене', stale: 'на смене · нет связи', off: 'не на смене', disabled: 'отключён',
};
const DEMO_DOOR = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//2wBDAQ4ODhMREyYVFSZPNS01T09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0//wAARCADwAUADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDTooorUgKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooqG8uPstq823dtxxnGecUATUVi/wBvf9Ov/kT/AOtR/b3/AE6/+RP/AK1TzxK5JG1RWL/b3/Tr/wCRP/rUf29/06/+RP8A61HPEOSRtUVi/wBvf9Ov/kT/AOtR/b3/AE6/+RP/AK1HPEOSRtUVi/29/wBOv/kT/wCtR/b3/Tr/AORP/rUc8Q5JG1RWL/b3/Tr/AORP/rUf29/06/8AkT/61HPEOSRtUVi/29/06/8AkT/61H9vf9Ov/kT/AOtRzxDkkbVFVdPu/tsDS+Xsw23Gc9h/jVqqTuS1YKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKpax/yDJv8AgP8A6EKu1S1j/kGTf8B/9CFKWzHHdHMUUUVzHQFFFFABRRRQAUUUUAFFFFABRRRQB0Ogf8eL/wDXQ/yFadZmgf8AHi//AF0P8hWnXRHY55bhRRRVCCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKpax/wAgyb/gP/oQq7VLWP8AkGTf8B/9CFKWzHHdHMUUUVzHQFFFFABRRRQAUUUUAFFFFABRRRQB0Ogf8eL/APXQ/wAhWnWZoH/Hi/8A10P8hWnXRHY55bhRRRVCCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKpax/yDJv+A/+hCrtUtY/5Bk3/Af/AEIUpbMcd0cxRRRXMdAUUUUAFFFFABRRRQAUUUUAFFFFAHQ6B/x4v/10P8hWnWZoH/Hi/wD10P8AIVp10R2OeW4UUUVQgooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACqWsf8gyb/gP/AKEKu1S1j/kGTf8AAf8A0IUpbMcd0cxRRRXMdAUUVVvv4Px/pTSuDdkWqKyqKrkI5zVorKoo5A5zVoqlZf64/wC7V2pasUncKKKKQzodA/48X/66H+QrTrM0D/jxf/rof5CtOuiOxzy3CiiiqEFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAVS1j/kGTf8AAf8A0IVdqlrH/IMm/wCA/wDoQpS2Y47o5iiiiuY6Aqrffwfj/SrVVb7+D8f6VUdxS2KlFFFaGQUUUUAWLL/XH/dq7VKy/wBcf92rtZy3NI7BRRRUlHQ6B/x4v/10P8hWnWZoH/Hi/wD10P8AIVp10R2OeW4UUUVQgooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACqWsf8gyb/gP/AKEKu1S1j/kGTf8AAf8A0IUpbMcd0cxRRRXMdAVVvv4Px/pVqqt9/B+P9KqO4pbFSiiitDIKKKKALFl/rj/u1dqlZf64/wC7V2s5bmkdgoooqSjodA/48X/66H+QrTrM0D/jxf8A66H+QrTrojsc8twoooqhBRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFUtY/5Bk3/Af/AEIVdqlrH/IMm/4D/wChClLZjjujmKKKK5joCqt9/B+P9KtVVvv4Px/pVR3FLYqUUUVoZBRRRQBYsv8AXH/dq7VKy/1x/wB2rtZy3NI7BRRRUlHQ6B/x4v8A9dD/ACFadZmgf8eL/wDXQ/yFaddEdjnluFFFFUIKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAqlrH/IMm/4D/6EKu1S1j/kGTf8B/8AQhSlsxx3RzFFFFcx0BVW+/g/H+lWqq338H4/0qo7ilsVKKKK0MgooooAsWX+uP8Au1dqlZf64/7tXazluaR2CiiipKOh0D/jxf8A66H+QrTrM0D/AI8X/wCuh/kK066I7HPLcKKKKoQUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABVLWP8AkGTf8B/9CFXapax/yDJv+A/+hClLZjjujmKKKK5joCqt9/B+P9KtVVvv4Px/pVR3FLYqUUUVoZBRRRQBYsv9cf8Adq7VKy/1x/3au1nLc0jsFFFFSUdDoH/Hi/8A10P8hWnWZoH/AB4v/wBdD/IVp10R2OeW4UUUVQgooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACqWsf8AIMm/4D/6EKu1S1j/AJBk3/Af/QhSlsxx3RzFFFFcx0BVW+/g/H+lWqq338H4/wBKqO4pbFSiiitDIKKKKALFl/rj/u1dqlZf64/7tXazluaR2CiiipKOh0D/AI8X/wCuh/kK06zNA/48X/66H+QrTrojsc8twoooqhBRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFUtY/5Bk3/Af/QhV2qWsf8AIMm/4D/6EKUtmOO6OYooormOgKq338H4/wBKtVVvv4Px/pVR3FLYqUUUVoZBRRRQBYsv9cf92rtUrL/XH/dq7WctzSOwUUUVJR0Ogf8AHi//AF0P8hWnWZoH/Hi//XQ/yFaddEdjnluFFFFUIKKKKACiiigAooooAKKKKACiiigD/9k='; // демо: фото подъезда
const FAR_METERS = 300;
/* ---------- адрес → ключ (как в «Маршрутах Про»: «д. 143, корп. 2» = «143к2», порядок слов не важен) ---------- */
const ADDR_ABBR = {
  улица: 'ул', проспект: 'пр', 'пр-т': 'пр', 'пр-кт': 'пр', просп: 'пр', переулок: 'пер', площадь: 'пл', шоссе: 'ш',
  бульвар: 'б-р', набережная: 'наб', проезд: 'пр-д', микрорайон: 'мкр', квартал: 'кв-л', область: 'обл', корпус: 'к',
  корп: 'к', строение: 'с', стр: 'с', литера: 'л', литер: 'л', лит: 'л', дом: '', д: '', город: '', г: '', россия: '',
};
function addressTokens(address) {
  const str = String(address || '').toLowerCase().replace(/ё/g, 'е').replace(/(?<!\d)\d{6}(?!\d)/g, ' ');
  const raw = str.split(/[\s,.;:"«»()/\\]+/).filter(Boolean).map((p) => (p in ADDR_ABBR ? ADDR_ABBR[p] : p)).filter(Boolean);
  const out = [];
  for (let i = 0; i < raw.length; i++) {
    let t = raw[i];
    if ((t === 'к' || t === 'с' || t === 'л') && i + 1 < raw.length && /^\d/.test(raw[i + 1])) { t = t + raw[i + 1]; i++; }
    if (out.length && /^\d/.test(out[out.length - 1]) && (/^[ксл]\d/.test(t) || /^[а-яa-z]$/.test(t))) { out[out.length - 1] += t; continue; }
    out.push(t);
  }
  return out;
}
function addressKey(address) { return [...new Set(addressTokens(address))].sort().join(' '); }
function sameHouse(a, b) {
  const ta = new Set(addressTokens(a)); const tb = new Set(addressTokens(b));
  const na = [...ta].filter((t) => /\d/.test(t)); const nb = [...tb].filter((t) => /\d/.test(t));
  if (!na.length || na.length !== nb.length || !na.every((t) => tb.has(t))) return false;
  const wa = [...ta].filter((t) => !/\d/.test(t)); const wb = [...tb].filter((t) => !/\d/.test(t));
  if (!wa.length || !wb.length) return false;
  return wa.length <= wb.length ? wa.every((t) => tb.has(t)) : wb.every((t) => ta.has(t));
}
 // отметка дальше этого от адреса — показываем предупреждение
const ONLINE_MINUTES = 3;

/* ===================================================================
 *  Утилиты
 * =================================================================== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const uuid = () => (crypto.randomUUID ? crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  }));

function store(key, val) {
  try {
    if (val === undefined) return JSON.parse(localStorage.getItem(key) || 'null');
    if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(val));
  } catch (e) { /* приватный режим и т.п. */ }
  return null;
}

function pad2(n) { return String(n).padStart(2, '0'); }
function dateStr(d = new Date()) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function parseDate(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function addDays(s, n) { const d = parseDate(s); d.setDate(d.getDate() + n); return dateStr(d); }
function dateLabel(s) {
  const t = dateStr();
  if (s === t) return 'Сегодня';
  if (s === addDays(t, -1)) return 'Вчера';
  if (s === addDays(t, 1)) return 'Завтра';
  return new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' }).format(parseDate(s));
}
function dateLong(s) { return new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(parseDate(s)); }
function timeOf(ts) { if (!ts) return ''; const d = new Date(ts); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }
function dateTimeOf(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return dateStr(d) === dateStr() ? `сегодня ${timeOf(ts)}`
    : `${new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(d)} ${timeOf(ts)}`;
}
function rel(ts) {
  if (!ts) return 'нет данных';
  const s = (Date.now() - new Date(ts).getTime()) / 1000;
  if (s < 60) return 'только что';
  if (s < 3600) return `${Math.floor(s / 60)} мин назад`;
  if (s < 86400) return `${Math.floor(s / 3600)} ч назад`;
  return dateTimeOf(ts);
}
function initials(name) {
  const p = String(name || '?').trim().split(/\s+/);
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || '?';
}
function firstName(name) { return String(name || '').trim().split(/\s+/)[0] || 'Курьер'; }
function distM(a, b) {
  if (a?.lat == null || b?.lat == null) return null;
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
function fmtDist(m) { return m < 1000 ? `${Math.round(m)} м` : `${(m / 1000).toFixed(1).replace('.', ',')} км`; }
function plural(n, one, few, many) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many; if (b > 1 && b < 5) return few; if (b === 1) return one; return many;
}
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
function isPhone(s) { return /^\+?[\d\s()-]{10,}$/.test(String(s).trim()); }
function telHref(p) { return 'tel:' + String(p).replace(/[^\d+]/g, ''); }

const ICONS = {
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6.5 7-6.5s7 2.5 7 6.5"/><path d="M16 4.3a4 4 0 0 1 0 7.4M22 21c0-3.3-2-5.6-5-6.3"/>',
  more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  up: '<path d="m18 15-6-6-6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  fit: '<path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  route: '<circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8M21 3v5h-5"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
  pin: '<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
  dots: '<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
  clip: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15v3M12 10v8M17 6v12"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  userPlus: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6.5 7-6.5s7 2.5 7 6.5M19 8v6M16 11h6"/>',
};
const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

function toast(text, kind = 'info', ms = 4200) {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  const sym = { ok: '✓', bad: '!', info: 'i' }[kind] || 'i';
  el.innerHTML = `<div class="ti">${sym}</div><div>${esc(text)}</div>`;
  el.onclick = () => el.remove();
  $('#toasts').appendChild(el);
  while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove();
  setTimeout(() => el.remove(), ms);
  if (kind !== 'info' && navigator.vibrate) { try { navigator.vibrate(60); } catch (e) { /* */ } }
}

function errText(e) {
  const m = String(e?.message || e || 'Ошибка');
  const map = [
    [/Failed to fetch|NetworkError|Load failed|network/i, 'Нет связи с сервером. Проверьте интернет.'],
    [/Invalid login credentials/i, 'Неверный e-mail или пароль.'],
    [/Email not confirmed/i, 'E-mail не подтверждён — откройте ссылку из письма.'],
    [/already registered/i, 'Этот e-mail уже зарегистрирован — просто войдите.'],
    [/Password should be at least/i, 'Пароль слишком короткий — минимум 6 символов.'],
    [/Unable to validate email|invalid format/i, 'Проверьте e-mail — похоже, в нём опечатка.'],
    [/bad_code/, 'Код не найден. Проверьте и попробуйте ещё раз.'],
    [/rate limit/i, 'Слишком много попыток. Подождите минуту.'],
    [/JWT|token is expired/i, 'Сессия истекла — войдите заново.'],
  ];
  for (const [re, t] of map) if (re.test(m)) return t;
  return m;
}

function loadScript(urls) {
  return urls.reduce((p, url) => p.catch(() => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = url; s.async = true; s.onload = res; s.onerror = () => { s.remove(); rej(new Error('load ' + url)); };
    document.head.appendChild(s);
  })), Promise.reject());
}
function loadCss(urls) {
  return urls.reduce((p, url) => p.catch(() => new Promise((res, rej) => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = url; l.onload = res; l.onerror = () => { l.remove(); rej(); };
    document.head.appendChild(l);
  })), Promise.reject());
}

/* ===================================================================
 *  Настройки
 * =================================================================== */
const cfg = window.DISPATCH_CONFIG || {};
const settings = Object.assign({
  supabaseUrl: '', supabaseKey: '', demo: false, city: '',
}, store('dm.settings') || {});
if (!settings.supabaseUrl && cfg.supabaseUrl) settings.supabaseUrl = cfg.supabaseUrl;
if (!settings.supabaseKey && cfg.supabaseAnonKey) settings.supabaseKey = cfg.supabaseAnonKey;
const saveSettings = () => store('dm.settings', settings);
if ('yandexKey' in settings) { delete settings.yandexKey; saveSettings(); } // поиск через Яндекс убран — стираем старый ключ

/* ===================================================================
 *  Сервер: Supabase
 * =================================================================== */
function chk(error) { if (error) throw error; }

function makeSupabaseApi(url, key) {
  const sb = window.supabase.createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'dm-auth' },
    realtime: { params: { eventsPerSecond: 10 } },
  });
  const sortStops = (r) => { r.stops = (r.stops || []).sort((a, b) => a.seq - b.seq); return r; };
  const STOP_COLS = ['id', 'route_id', 'team_id', 'seq', 'address', 'lat', 'lng', 'client_name', 'client_phone', 'note', 'time_from', 'time_to'];
  const CLIENT_COLS = ['client_legal', 'client_place', 'client_ref']; // из 012 — отправляем, только если они заполнены

  return {
    kind: 'supabase',
    async check() {
      const { error } = await sb.rpc('courier_me', { p_token: 'check' });
      if (!error) return;
      if (/bad_token/.test(error.message)) return; // схема установлена
      if (/Could not find|does not exist|PGRST202/i.test(error.message + error.code)) throw new Error('На сервере нет таблиц приложения. Выполните файл schema.sql в SQL Editor Supabase.');
      throw error;
    },
    async session() { const { data } = await sb.auth.getSession(); return data.session; },
    async signIn(email, password) { const { data, error } = await sb.auth.signInWithPassword({ email, password }); chk(error); return data.session; },
    async signUp(email, password) { const { data, error } = await sb.auth.signUp({ email, password }); chk(error); return data.session; },
    async signOut() { await sb.auth.signOut(); },
    async userEmail() { const { data } = await sb.auth.getSession(); return data.session?.user?.email || ''; },
    onAuth(cb) { sb.auth.onAuthStateChange((ev) => cb(ev)); },

    async myTeam() {
      const { data, error } = await sb.from('teams').select('*').order('created_at').limit(1);
      chk(error); return data[0] || null;
    },
    async createTeam(name) { const { data, error } = await sb.rpc('create_team', { p_name: name }); chk(error); return data; },
    async joinTeam(code) { const { data, error } = await sb.rpc('join_team_as_dispatcher', { p_code: code }); chk(error); return data; },
    async updateTeam(id, patch) { const { data, error } = await sb.from('teams').update(patch).eq('id', id).select().single(); chk(error); return data; },
    async regenCode(teamId) { const { data, error } = await sb.rpc('regenerate_join_code', { p_team: teamId }); chk(error); return data; },

    async couriers(teamId) {
      const { data, error } = await sb.from('couriers').select('*').eq('team_id', teamId).order('name');
      chk(error); return data;
    },
    async updateCourier(id, patch) { const { error } = await sb.from('couriers').update(patch).eq('id', id); chk(error); },
    async recallCourierRoutes(id) {
      const { error } = await sb.from('routes').update({ status: 'draft' }).eq('courier_id', id).in('status', ['sent', 'accepted', 'in_progress']);
      chk(error);
    },
    async deleteCourier(id) { const { error } = await sb.from('couriers').delete().eq('id', id); chk(error); },
    async report(teamId, from, to, tz) {
      const { data, error } = await sb.rpc('report_routes', { p_team: teamId, p_from: from, p_to: to, p_tz: tz });
      if (error && /report_routes|PGRST202|Could not find/i.test(error.message + error.code)) {
        throw new Error('Сервер не обновлён: выполните в Supabase файл 004_report.sql');
      }
      chk(error);
      return data || [];
    },

    async routes(teamId, date) {
      const q1 = sb.from('routes').select('*, stops(*)').eq('team_id', teamId).eq('route_date', date).order('created_at');
      const q2 = sb.from('routes').select('*, stops(*)').eq('team_id', teamId).in('status', ['sent', 'accepted', 'in_progress']);
      const [a, b] = await Promise.all([q1, q2]);
      chk(a.error); chk(b.error);
      const byId = new Map();
      [...a.data, ...b.data].forEach((r) => byId.set(r.id, sortStops(r)));
      return [...byId.values()];
    },
    async saveRoute(route, stops, removedIds) {
      const { data, error } = await sb.from('routes').upsert(route).select().single();
      chk(error);
      if (removedIds.length) { const r = await sb.from('stops').delete().in('id', removedIds); chk(r.error); }
      if (stops.length) {
        const cols = stops.some((s) => CLIENT_COLS.some((k) => s[k] != null)) ? [...STOP_COLS, ...CLIENT_COLS] : STOP_COLS;
        const rows = stops.map((s) => Object.fromEntries(cols.map((k) => [k, s[k] ?? null])))
          .map((s) => ({ ...s, route_id: data.id, team_id: data.team_id }));
        const r = await sb.from('stops').upsert(rows); chk(r.error);
      }
      return data;
    },
    async updateRoute(id, patch) { const { error } = await sb.from('routes').update(patch).eq('id', id); chk(error); },
    async deleteRoute(id) { const { error } = await sb.from('routes').delete().eq('id', id); chk(error); },
    /** Трек курьера за период. Сервер отдаёт не больше 1000 строк за раз — забираем частями. */
    async track(courierId, fromIso, toIso) {
      const PAGE = 1000;
      const out = [];
      let from = fromIso;
      for (let page = 0; page < 40; page++) {
        const { data, error } = await sb.from('locations').select('lat,lng,recorded_at,speed')
          .eq('courier_id', courierId).gte('recorded_at', from).lte('recorded_at', toIso)
          .order('recorded_at').limit(PAGE);
        chk(error);
        const lastMs = out.length ? Date.parse(out[out.length - 1].recorded_at) : -Infinity;
        out.push(...data.filter((p) => Date.parse(p.recorded_at) > lastMs));
        if (data.length < PAGE) break;
        from = data[data.length - 1].recorded_at;
      }
      return out;
    },
    /** Уведомления «уехал, не отметив» за сутки (таблица из 006). null — таблицы нет. */
    async alerts(teamId) {
      const since = new Date(Date.now() - 864e5).toISOString();
      const { data, error } = await sb.from('alerts').select('*').eq('team_id', teamId)
        .is('resolved_at', null).is('seen_at', null).gte('created_at', since).order('created_at');
      if (error && /alerts|PGRST205|42P01|does not exist|schema cache/i.test(`${error.message} ${error.code}`)) return null;
      chk(error); return data;
    },
    async seeAlert(id) { const { error } = await sb.from('alerts').update({ seen_at: new Date().toISOString() }).eq('id', id); chk(error); },
    /** Подписка устройства на уведомления (013). false — таблицы ещё нет. */
    async savePushSub(teamId, sub, tz) {
      const j = sub.toJSON();
      const { error } = await sb.from('push_subs').upsert({ endpoint: j.endpoint, team_id: teamId, p256dh: j.keys.p256dh, auth: j.keys.auth, tz });
      if (error && /push_subs|PGRST205|42P01|does not exist|schema cache/i.test(`${error.message} ${error.code}`)) return false;
      chk(error); return true;
    },
    async deletePushSub(endpoint) { await sb.from('push_subs').delete().eq('endpoint', endpoint); },
    subscribeAlerts(teamId, cb) {
      const ch = sb.channel('alerts-' + teamId)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts', filter: `team_id=eq.${teamId}` }, cb)
        .subscribe();
      return () => sb.removeChannel(ch);
    },
    /** Общая база адресов (011). null — таблицы ещё нет. */
    async notes(teamId) {
      const out = [];
      for (let from = 0; from < 20000; from += 1000) {
        const { data, error } = await sb.from('address_notes').select('*').eq('team_id', teamId).eq('deleted', false)
          .order('address').range(from, from + 999);
        if (error && /address_notes|PGRST205|42P01|does not exist|schema cache/i.test(`${error.message} ${error.code}`)) return null;
        chk(error);
        out.push(...data);
        if (data.length < 1000) break;
      }
      return out;
    },
    async saveNote(teamId, n) {
      const row = { team_id: teamId, key: n.key, address: n.address, lat: n.lat ?? null, lng: n.lng ?? null, note: n.note || '',
        phone: n.phone || null, unload_minutes: n.unload_minutes ?? null, photos: n.photos || [], author: 'Диспетчер', deleted: false };
      const { data, error } = await sb.from('address_notes').upsert(row, { onConflict: 'team_id,key' }).select().single();
      chk(error); return data;
    },
    async deleteNote(teamId, key) {
      const { error } = await sb.from('address_notes').update({ deleted: true, author: 'Диспетчер' }).eq('team_id', teamId).eq('key', key);
      chk(error);
    },
    /** Справочник клиентов (012). null — таблицы ещё нет. */
    async clients(teamId) {
      const out = [];
      for (let from = 0; from < 50000; from += 1000) {
        const { data, error } = await sb.from('clients').select('*').eq('team_id', teamId).eq('deleted', false)
          .order('address').range(from, from + 999);
        if (error && /clients|PGRST205|42P01|does not exist|schema cache/i.test(`${error.message} ${error.code}`)) return null;
        chk(error);
        out.push(...data);
        if (data.length < 1000) break;
      }
      return out;
    },
    async saveClients(teamId, list) {
      const out = [];
      for (let i = 0; i < list.length; i += 200) {
        const rows = list.slice(i, i + 200).map((c) => ({ id: c.id || uuid(), team_id: teamId, legal_name: c.legal_name || '', trade_name: c.trade_name || '',
          address: c.address || '', key: c.address ? addressKey(c.address) : null, lat: c.lat ?? null, lng: c.lng ?? null,
          place: c.place || null, inn: c.inn || null, aliases: c.aliases || null, deleted: false }));
        const { data, error } = await sb.from('clients').upsert(rows).select();
        chk(error); out.push(...data);
      }
      return out;
    },
    async deleteClient(id) { const { error } = await sb.from('clients').update({ deleted: true }).eq('id', id); chk(error); },
    async notePhotos(teamId, files) {
      if (!files.length) return [];
      const { data, error } = await sb.from('address_photos').select('file,data').eq('team_id', teamId).in('file', files);
      chk(error); return data;
    },
    /** История отметок точек (таблица из 006_stop_events.sql). */
    async stopEvents(stopIds) {
      const out = [];
      for (let i = 0; i < stopIds.length; i += 100) {
        const { data, error } = await sb.from('stop_events').select('*').in('stop_id', stopIds.slice(i, i + 100)).order('at');
        if (error && /stop_events|PGRST205|42P01|does not exist|schema cache/i.test(`${error.message} ${error.code}`)) {
          const e = new Error('no_events'); e.code = 'no_events'; throw e;
        }
        chk(error);
        out.push(...data);
      }
      return out;
    },
    /** Маршруты прошедшего дня (кроме черновиков): на эту дату или начатые в этот день. */
    async dayRoutes(teamId, day) {
      const s = parseDate(day).toISOString();
      const e = parseDate(addDays(day, 1)).toISOString();
      const base = () => sb.from('routes').select('*, stops(*)').eq('team_id', teamId).neq('status', 'draft');
      const [a, b] = await Promise.all([base().eq('route_date', day), base().gte('started_at', s).lt('started_at', e)]);
      chk(a.error); chk(b.error);
      const byId = new Map();
      [...a.data, ...b.data].forEach((r) => byId.set(r.id, sortStops(r)));
      return [...byId.values()];
    },
    subscribe(teamId, onEvent, onStatus) {
      const ch = sb.channel('team-' + teamId);
      ['couriers', 'routes', 'stops'].forEach((t) => {
        ch.on('postgres_changes', { event: '*', schema: 'public', table: t, filter: `team_id=eq.${teamId}` }, (p) => onEvent(t, p));
      });
      ch.subscribe((s) => onStatus(s));
      return () => sb.removeChannel(ch);
    },
  };
}

/* ===================================================================
 *  Демо-режим: всё в памяти, курьеры «ездят» сами
 * =================================================================== */
function makeDemoApi() {
  const now = Date.now();
  const today = dateStr();
  const team = { id: 'demo-team', name: 'Демо-доставка', join_code: 'DEMO42', dispatcher_code: 'DEMODISP' };
  const C = (id, name, phone, lat, lng, onShift, battery, minAgo) => ({
    id, team_id: team.id, name, phone, active: true, on_shift: onShift, last_lat: lat, last_lng: lng,
    last_accuracy: 12, last_speed: onShift ? 6 : 0, last_battery: battery,
    last_seen: new Date(now - minAgo * 60000).toISOString(), app_version: '1.0.0', created_at: new Date(now - 864e5 * 5).toISOString(),
  });
  const couriers = [
    C('c1', 'Алексей Смирнов', '+79001234501', 55.7570, 37.6150, true, 81, 0.2),
    C('c2', 'Дмитрий Козлов', '+79001234502', 55.7445, 37.6050, true, 54, 0.4),
    C('c3', 'Сергей Иванов', '+79001234503', 55.7700, 37.5800, false, 33, 190),
  ];
  const S = (seq, address, lat, lng, extra = {}) => ({
    id: uuid(), seq, address, lat, lng, client_name: null, client_phone: null, note: null, time_from: null, time_to: null,
    status: 'pending', done_at: null, done_lat: null, done_lng: null, result_comment: null, ...extra,
  });
  const ago = (m) => new Date(now - m * 60000).toISOString();
  const routes = [
    {
      id: 'r1', team_id: team.id, courier_id: 'c1', title: 'Центр, утро', route_date: today, status: 'in_progress', comment: 'Хрупкое в 3-й точке',
      created_at: ago(180), sent_at: ago(170), accepted_at: ago(160), started_at: ago(120), finished_at: null,
      stops: [
        S(1, 'Тверская ул., 7', 55.7578, 37.6127, { status: 'done', done_at: ago(95), done_lat: 55.7579, done_lng: 37.6129, client_name: 'Ольга', client_phone: '+79161112233' }),
        S(2, 'ул. Покровка, 17', 55.7590, 37.6467, { status: 'done', done_at: ago(60), done_lat: 55.7591, done_lng: 37.6462 }),
        S(3, 'Мясницкая ул., 24', 55.7647, 37.6359, { client_name: 'ООО «Вектор»', note: 'Офис 412, звонить за 10 минут', time_from: '12:00', time_to: '14:00' }),
        S(4, 'Сретенка, 20', 55.7690, 37.6316),
        S(5, 'Цветной бульвар, 15', 55.7716, 37.6206, { client_phone: '+79037778899' }),
        S(6, 'ул. Петровка, 26', 55.7678, 37.6143),
      ],
    },
    {
      id: 'r2', team_id: team.id, courier_id: 'c2', title: 'Замоскворечье', route_date: today, status: 'accepted', comment: null,
      created_at: ago(90), sent_at: ago(40), accepted_at: ago(35), started_at: null, finished_at: null,
      stops: [
        S(1, 'Пятницкая ул., 20', 55.7413, 37.6283),
        S(2, 'Большая Ордынка, 40', 55.7356, 37.6241, { time_from: '13:00', time_to: '15:00' }),
        S(3, 'ул. Большая Якиманка, 22', 55.7348, 37.6123),
        S(4, 'Ленинский пр-т, 9', 55.7279, 37.6097),
        S(5, 'ул. Шаболовка, 10', 55.7232, 37.6087),
      ],
    },
    {
      id: 'r3', team_id: team.id, courier_id: null, title: 'Вечер, запад', route_date: today, status: 'draft', comment: null,
      created_at: ago(20), sent_at: null, accepted_at: null, started_at: null, finished_at: null,
      stops: [
        S(1, 'Новый Арбат, 15', 55.7525, 37.5905),
        S(2, 'Садовая-Кудринская ул., 9', 55.7614, 37.5867),
        S(3, 'Кутузовский пр-т, 12', 55.7505, 37.5650),
      ],
    },
    {
      id: 'r4', team_id: team.id, courier_id: 'c3', title: 'Утренний развоз', route_date: today, status: 'done', comment: null,
      created_at: ago(400), sent_at: ago(390), accepted_at: ago(385), started_at: ago(370), finished_at: ago(200),
      stops: [
        S(1, 'Ленинградский пр-т, 37', 55.7900, 37.5320, { status: 'done', done_at: ago(330), done_lat: 55.7901, done_lng: 37.5322 }),
        S(2, 'ул. Правды, 24', 55.7860, 37.5800, { status: 'failed', done_at: ago(280), done_lat: 55.7858, done_lng: 37.5797, result_comment: 'Клиент не отвечает' }),
        S(3, 'Бутырская ул., 46', 55.7950, 37.5880, { status: 'done', done_at: ago(240), done_lat: 55.8040, done_lng: 37.5880 }),
      ],
    },
  ];
  routes.forEach((r) => r.stops.forEach((s) => { s.route_id = r.id; s.team_id = team.id; }));
  const tracks = {};
  // демо-история отметок: Бутырскую отметили у адреса, потом сняли и отметили снова за километр
  const demoEvents = [];
  const evPush = (st, status, at, lat, lng, comment = null) => demoEvents.push({
    id: demoEvents.length + 1, team_id: team.id, route_id: st.route_id, stop_id: st.id, courier_id: routes.find((r) => r.id === st.route_id)?.courier_id,
    status, at, lat, lng, comment, by_dispatcher: false, created_at: at,
  });
  routes.forEach((r) => r.stops.forEach((st) => {
    if (st.address.startsWith('Бутырская')) {
      evPush(st, 'done', ago(300), 55.7951, 37.5883);
      evPush(st, 'pending', ago(245), null, null);
    }
    if (st.status !== 'pending') evPush(st, st.status, st.done_at, st.done_lat, st.done_lng, st.result_comment);
  }));
  tracks.c3 = [[335, 55.7900, 37.5320], [320, 55.7880, 37.5500], [305, 55.7930, 37.5800], [301, 55.7949, 37.5879], [297, 55.7951, 37.5882],
    [290, 55.7952, 37.5878], [282, 55.7861, 37.5801], [270, 55.7950, 37.5950], [250, 55.8020, 37.5900], [240, 55.8040, 37.5880], [230, 55.8045, 37.5870]]
    .map(([m, lat, lng]) => ({ lat, lng, recorded_at: ago(m), speed: 5 }));
  // демо: общая база адресов
  const NB = (address, note, extra = {}) => ({ team_id: team.id, key: addressKey(address), address, note, phone: null, unload_minutes: null,
    photos: [], author: 'Алексей', rev: 1, deleted: false, updated_at: ago(60 * 24), ...extra });
  const demoNotes = [
    NB('Мясницкая ул., 24', 'Офис 412 | пропуск на охране, паспорт (Дмитрий)', { phone: '+79161234567', unload_minutes: 20 }),
    NB('Тверская ул., 7', 'Код домофона 15К | вход со двора, арка справа', { photos: [{ file: 'p_demo.jpg', target: [0.5, 0.62] }] }),
    NB('Пятницкая ул., 20', 'Шлагбаум — звонить на номер у въезда', { author: 'Дмитрий' }),
  ];
  const CL = (trade, legal, address, lat, lng, place, extra = {}) => ({ id: uuid(), team_id: team.id, trade_name: trade, legal_name: legal, address,
    key: addressKey(address), lat, lng, place, inn: null, aliases: null, deleted: false, ...extra });
  const demoClients = [
    CL('Вектор', 'ООО «Вектор»', 'Мясницкая ул., 24', 55.7647, 37.6359, 'офис 412, 4 этаж', { inn: '7701234567' }),
    CL('Кофейня «Зерно»', 'ИП Пупкин А.В.', 'Мясницкая ул., 24', 55.7647, 37.6359, '1 этаж, вход с улицы', { aliases: 'Пупкин Александр Владимирович' }),
    CL('Цветочный рай', 'ООО «Глазов и К»', 'Мясницкая ул., 24', 55.7647, 37.6359, 'во дворе, павильон 3'),
    CL('Радуга', 'ИП Рубашкин С.И.', 'Тверская ул., 7', 55.7578, 37.6127, 'вход с торца, синяя вывеска'),
  ];
  // демо-уведомление: Алексей постоял у Сретенки и уехал, не отметив
  let emitAlert = () => {};
  const sret = routes[0].stops.find((x) => x.address.startsWith('Сретенка'));
  const demoAlerts = [{ id: 1, team_id: team.id, courier_id: 'c1', route_id: 'r1', stop_id: sret.id, kind: 'left_unmarked',
    near_from: ago(52), near_to: ago(47), left_at: ago(45), created_at: ago(44), seen_at: null, resolved_at: null }];
  const pushTrack = (c) => { (tracks[c.id] ||= []).push({ lat: c.last_lat, lng: c.last_lng, recorded_at: new Date().toISOString(), speed: c.last_speed }); };
  // прошлый путь Алексея: по выполненным точкам
  tracks.c1 = [[55.7520, 37.6200], [55.7560, 37.6140], [55.7578, 37.6127], [55.7585, 37.6250], [55.7590, 37.6467], [55.7620, 37.6420], [55.7570, 37.6150]]
    .map(([lat, lng], i) => ({ lat, lng, recorded_at: ago(130 - i * 18), speed: 7 }));

  const clone = (o) => JSON.parse(JSON.stringify(o));
  let emit = () => {};
  let timer = null;
  let ticks = 0;

  function tick() {
    ticks++;
    couriers.filter((c) => c.on_shift && c.active).forEach((c) => {
      const r = routes.find((x) => x.courier_id === c.id && ['sent', 'accepted', 'in_progress'].includes(x.status));
      if (r && r.status === 'sent' && ticks % 3 === 0) {
        r.status = 'accepted'; r.accepted_at = new Date().toISOString();
        emit('routes', { eventType: 'UPDATE', new: clone({ ...r, stops: undefined }) });
      }
      const next = r && r.status !== 'sent' ? r.stops.find((s) => s.status === 'pending') : null;
      if (next) {
        const k = 0.35;
        c.last_lat += (next.lat - c.last_lat) * k + (Math.random() - 0.5) * 0.0004;
        c.last_lng += (next.lng - c.last_lng) * k + (Math.random() - 0.5) * 0.0004;
        c.last_speed = 4 + Math.random() * 6;
        if (distM({ lat: c.last_lat, lng: c.last_lng }, next) < 120 && Math.random() < 0.5) {
          const fail = Math.random() < 0.15;
          Object.assign(next, {
            status: fail ? 'failed' : 'done', done_at: new Date().toISOString(),
            done_lat: c.last_lat, done_lng: c.last_lng, result_comment: fail ? 'Не открыли дверь' : null,
          });
          evPush(next, next.status, next.done_at, next.done_lat, next.done_lng, next.result_comment);
          demoAlerts.filter((a) => a.stop_id === next.id && !a.resolved_at).forEach((a) => {
            a.resolved_at = new Date().toISOString(); emitAlert({ eventType: 'UPDATE', new: clone(a) });
          });
          emit('stops', { eventType: 'UPDATE', new: clone(next) });
          const left = r.stops.filter((s) => s.status === 'pending').length;
          const newStatus = left === 0 ? 'done' : 'in_progress';
          if (r.status !== newStatus) {
            r.status = newStatus;
            if (newStatus === 'in_progress') r.started_at ||= new Date().toISOString();
            if (newStatus === 'done') r.finished_at = new Date().toISOString();
            emit('routes', { eventType: 'UPDATE', new: clone({ ...r, stops: undefined }) });
          }
        }
      } else {
        c.last_lat += (Math.random() - 0.5) * 0.0002; c.last_lng += (Math.random() - 0.5) * 0.0002; c.last_speed = 0;
      }
      c.last_seen = new Date().toISOString();
      if (Math.random() < 0.05) c.last_battery = Math.max(5, c.last_battery - 1);
      pushTrack(c);
      emit('couriers', { eventType: 'UPDATE', new: clone(c) });
    });
  }

  return {
    kind: 'demo',
    async check() {},
    async session() { return { user: { email: 'demo@example.com' } }; },
    async signIn() {}, async signUp() {}, async signOut() {},
    async userEmail() { return 'демо-режим'; },
    onAuth() {},
    async myTeam() { return clone(team); },
    async createTeam() { return clone(team); },
    async joinTeam() { return clone(team); },
    async updateTeam(id, patch) { Object.assign(team, patch); return clone(team); },
    async regenCode() { team.join_code = Math.random().toString(36).slice(2, 8).toUpperCase(); return team.join_code; },
    async couriers() { return clone(couriers); },
    async updateCourier(id, patch) { Object.assign(couriers.find((c) => c.id === id), patch); },
    async recallCourierRoutes(id) {
      routes.filter((r) => r.courier_id === id && ['sent', 'accepted', 'in_progress'].includes(r.status))
        .forEach((r) => Object.assign(r, { status: 'draft', sent_at: null, accepted_at: null, started_at: null, finished_at: null }));
    },
    async report(teamId, from, to) {
      return routes.filter((r) => r.status !== 'draft' && r.route_date >= from && r.route_date <= to).map((r) => {
        const c = couriers.find((x) => x.id === r.courier_id);
        const st = r.stops;
        const deadline = (s) => (s.time_to ? atTime(s.time_to, r.route_date) : null);
        const done = st.filter((s) => s.status === 'done');
        const lateMin = done.filter((s) => deadline(s) && Date.parse(s.done_at) > deadline(s)).map((s) => (Date.parse(s.done_at) - deadline(s)) / 60000);
        const reasons = {};
        st.filter((s) => s.status === 'failed').forEach((s) => { const k = s.result_comment || 'Без причины'; reasons[k] = (reasons[k] || 0) + 1; });
        return {
          route_id: r.id, route_date: r.route_date, title: r.title, status: r.status, courier_id: r.courier_id, courier_name: c?.name || null,
          stops_total: st.length, stops_done: done.length, stops_failed: st.filter((s) => s.status === 'failed').length,
          stops_pending: st.filter((s) => s.status === 'pending').length,
          on_time: done.filter((s) => deadline(s) && Date.parse(s.done_at) <= deadline(s)).length,
          late: lateMin.length, no_deadline: done.filter((s) => !deadline(s)).length,
          late_minutes_avg: lateMin.length ? Math.round(lateMin.reduce((a, b) => a + b, 0) / lateMin.length) : null,
          fail_reasons: reasons,
          plan_km: st.length * 2.4, fact_km: r.status === 'done' ? st.length * 2.9 : null,
          plan_minutes: st.length * 22, fact_minutes: r.finished_at && r.accepted_at ? Math.round((Date.parse(r.finished_at) - Date.parse(r.accepted_at)) / 60000) : null,
          plan_finish: null, fact_start: r.accepted_at, fact_finish: r.finished_at,
          far_marks: st.filter((s) => s.status !== 'pending' && (distM({ lat: s.done_lat, lng: s.done_lng }, s) || 0) > FAR_METERS).length,
          remarks: st.filter((s) => demoEvents.filter((e) => e.stop_id === s.id && e.status !== 'pending').length > 1).length,
          unconfirmed: st.filter((s) => s.status === 'done' && (distM({ lat: s.done_lat, lng: s.done_lng }, s) || 0) > FAR_METERS
            && !demoEvents.some((e) => e.stop_id === s.id && e.status === 'done' && (distM(e, s) || 1e9) <= FAR_METERS)).length,
          left_unmarked: demoAlerts.filter((a) => a.route_id === r.id).length,
        };
      });
    },
    async deleteCourier(id) {
      couriers.splice(couriers.findIndex((c) => c.id === id), 1);
      routes.forEach((r) => { if (r.courier_id === id) r.courier_id = null; });
    },
    async routes(teamId, date) {
      return clone(routes.filter((r) => r.route_date === date || ['sent', 'accepted', 'in_progress'].includes(r.status)));
    },
    async saveRoute(route, stops, removedIds) {
      let r = routes.find((x) => x.id === route.id);
      if (!r) { r = { status: 'draft', created_at: new Date().toISOString(), stops: [], ...route }; routes.push(r); }
      Object.assign(r, route);
      r.stops = r.stops.filter((s) => !removedIds.includes(s.id));
      stops.forEach((s) => {
        const ex = r.stops.find((x) => x.id === s.id);
        const editable = (({ seq, address, lat, lng, client_name, client_phone, note, time_from, time_to }) =>
          ({ seq, address, lat, lng, client_name, client_phone, note, time_from, time_to,
            client_legal: s.client_legal ?? null, client_place: s.client_place ?? null, client_ref: s.client_ref ?? null }))(s);
        if (ex) Object.assign(ex, editable);
        else r.stops.push({ ...S(s.seq, s.address, s.lat, s.lng), ...editable, id: s.id, route_id: r.id, team_id: team.id });
      });
      r.stops.sort((a, b) => a.seq - b.seq);
      return clone({ ...r, stops: undefined });
    },
    async updateRoute(id, patch) {
      const r = routes.find((x) => x.id === id);
      Object.assign(r, patch);
      if (patch.status === 'draft') Object.assign(r, { sent_at: null, accepted_at: null, started_at: null, finished_at: null });
      if (patch.status === 'done' && !r.finished_at) r.finished_at = new Date().toISOString();
    },
    async deleteRoute(id) { routes.splice(routes.findIndex((x) => x.id === id), 1); },
    // История в демо: любой прошедший день — копия сегодняшнего, сдвинутая на нужное число дней
    async track(courierId, fromIso, toIso) {
      const f = Date.parse(fromIso || 0) || 0;
      const t = toIso ? Date.parse(toIso) : Infinity;
      const k = Math.max(0, Math.round((parseDate(today).getTime() - parseDate(dateStr(new Date(f))).getTime()) / 864e5));
      return (tracks[courierId] || []).map((p) => ({ ...p, recorded_at: new Date(Date.parse(p.recorded_at) - k * 864e5).toISOString() }))
        .filter((p) => { const ms = Date.parse(p.recorded_at); return ms >= f && ms <= t; });
    },
    async notes() { return clone(demoNotes.filter((n) => !n.deleted)); },
    async saveNote(teamId, n) {
      let x = demoNotes.find((v) => v.key === n.key);
      if (!x) { x = { team_id: team.id, rev: 0, deleted: false, photos: [] }; demoNotes.push(x); }
      Object.assign(x, n, { author: 'Диспетчер', deleted: false, rev: x.rev + 1, updated_at: new Date().toISOString() });
      return clone(x);
    },
    async deleteNote(teamId, key) { const x = demoNotes.find((v) => v.key === key); if (x) x.deleted = true; },
    async clients() { return clone(demoClients.filter((c) => !c.deleted)); },
    async saveClients(teamId, list) {
      return clone(list.map((c) => {
        let x = demoClients.find((v) => v.id === c.id);
        if (!x) { x = { id: c.id || uuid(), team_id: team.id, deleted: false }; demoClients.push(x); }
        Object.assign(x, c, { key: c.address ? addressKey(c.address) : null, deleted: false, updated_at: new Date().toISOString() });
        return x;
      }));
    },
    async deleteClient(id) { const x = demoClients.find((v) => v.id === id); if (x) x.deleted = true; },
    async notePhotos(teamId, files) { return files.filter((f) => f === 'p_demo.jpg').map((file) => ({ file, data: DEMO_DOOR })); },
    async alerts() { return clone(demoAlerts.filter((a) => !a.seen_at && !a.resolved_at)); },
    async seeAlert(id) { const a = demoAlerts.find((x) => x.id === id); if (a) a.seen_at = new Date().toISOString(); },
    subscribeAlerts(teamId, cb) { emitAlert = cb; return () => { emitAlert = () => {}; }; },
    async stopEvents(ids) { return clone(demoEvents.filter((e) => ids.includes(e.stop_id))).sort((a, b) => Date.parse(a.at) - Date.parse(b.at)); },
    async dayRoutes(teamId, day) {
      const k = Math.round((parseDate(today).getTime() - parseDate(day).getTime()) / 864e5);
      const sh = (v) => (v ? new Date(Date.parse(v) - k * 864e5).toISOString() : v);
      return clone(routes.filter((r) => r.status !== 'draft' && r.route_date === today)).map((r) => ({
        ...r, route_date: day, sent_at: sh(r.sent_at), accepted_at: sh(r.accepted_at), started_at: sh(r.started_at), finished_at: sh(r.finished_at),
        stops: r.stops.map((x) => ({ ...x, done_at: sh(x.done_at), eta: null, eta_at: null })),
      }));
    },
    subscribe(teamId, onEvent, onStatus) {
      emit = onEvent; onStatus('SUBSCRIBED');
      clearInterval(timer); timer = setInterval(tick, 3000);
      return () => clearInterval(timer);
    },
  };
}

/* ===================================================================
 *  Поиск координат по адресу
 * =================================================================== */
let lastNominatim = 0;
async function geocode(address) {
  const q = address.trim();
  if (!q) return null;
  const city = settings.city.trim();
  const full = city && !q.toLowerCase().includes(city.toLowerCase()) ? `${city}, ${q}` : q;
  try {
    const wait = 1100 - (Date.now() - lastNominatim); // правила OpenStreetMap: не чаще 1 запроса в секунду
    if (wait > 0) await sleep(wait);
    lastNominatim = Date.now();
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=ru&countrycodes=ru,by,kz&q=${encodeURIComponent(full)}`;
    const j = await (await fetch(url, { headers: { Accept: 'application/json' } })).json();
    if (!j?.[0]) return null;
    return { lat: +j[0].lat, lng: +j[0].lon };
  } catch (e) {
    return null;
  }
}

/* ===================================================================
 *  Состояние
 * =================================================================== */
const state = {
  api: null,
  team: null,
  email: '',
  couriers: new Map(),
  routes: new Map(),
  stops: new Map(),
  date: dateStr(),
  tab: store('dm.tab') || 'map',
  report: { period: 'today', from: dateStr(), to: dateStr(), courier: '', rows: null, loading: false, error: '' },
  showDisabled: false,
  conn: 'connecting',
  focusRouteId: null,
  track: null, // { courierId, points }
  installEvt: null,
  unsub: null,
  unsubAlerts: null,
  alerts: new Map(), // id → уведомление «уехал, не отметив»
  notes: null, // общая база адресов: [] после загрузки
  notesMissing: false,
  clients: null, // справочник клиентов: [] после загрузки
  clientsMissing: false,
  clientsAt: 0,
  notesAt: 0,
  loaded: false,
};
const sheetRefreshers = new Set();

function courierState(c) {
  if (!c) return 'off';
  if (!c.active) return 'disabled';
  const ageMin = c.last_seen ? (Date.now() - new Date(c.last_seen).getTime()) / 60000 : Infinity;
  if (c.on_shift && ageMin <= ONLINE_MINUTES) return 'online';
  if (c.on_shift) return 'stale';
  return 'off';
}
/** «В пути» — только если курьер уже отметил хоть одну точку. Курьер может отметить точку и вернуть её
 *  обратно — тогда маршрут снова считается принятым, а не начатым. */
function shownStatus(r) {
  if (r.status === 'in_progress' && !(r.stops || []).some((s) => s.status !== 'pending')) return 'accepted';
  return r.status;
}
function routeCounts(r) {
  const st = r.stops || [];
  const done = st.filter((s) => s.status === 'done').length;
  const failed = st.filter((s) => s.status === 'failed').length;
  return { total: st.length, done, failed, left: st.length - done - failed };
}
function routesForDate() {
  return [...state.routes.values()].filter((r) => r.route_date === state.date)
    .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
}
function activeRouteOf(courierId) {
  const list = [...state.routes.values()].filter((r) => r.courier_id === courierId && ['sent', 'accepted', 'in_progress'].includes(r.status));
  return list.find((r) => r.status === 'in_progress') || list.find((r) => r.status === 'accepted') || list[0] || null;
}

async function loadData() {
  if (!state.team) return;
  try {
    const [couriers, routes] = await Promise.all([
      state.api.couriers(state.team.id),
      state.api.routes(state.team.id, state.date),
    ]);
    state.couriers = new Map(couriers.map((c) => [c.id, c]));
    state.routes = new Map(routes.map((r) => [r.id, r]));
    state.stops = new Map();
    routes.forEach((r) => (r.stops || []).forEach((s) => state.stops.set(s.id, s)));
    state.loaded = true;
    renderAll();
  } catch (e) {
    if (state.loaded) setConn('offline'); else toast(errText(e), 'bad');
  }
  loadAlerts();
  if (Date.now() - state.notesAt > 5 * 60000) loadNotes();
  if (Date.now() - state.clientsAt > 5 * 60000) loadClients();
}
const scheduleReload = debounce(loadData, 400);

let renderQueued = false;
function renderAll() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    renderCurrentTab();
    drawMap();
    sheetRefreshers.forEach((f) => { try { f(); } catch (e) { console.error(e); } });
  });
}

function onDbEvent(table, p) {
  const n = p.new || {};
  if (table === 'couriers' && p.eventType === 'UPDATE') {
    state.couriers.set(n.id, { ...state.couriers.get(n.id), ...n });
    renderAll();
    return;
  }
  if (table === 'couriers' && p.eventType === 'INSERT') toast(`Подключился новый курьер: ${n.name}`, 'info');
  // маршрут, который курьер составил сам и отправил из приложения (диспетчерские создаются черновиками)
  if (table === 'routes' && p.eventType === 'INSERT' && n.courier_id && n.status !== 'draft') {
    toast(`${firstName(state.couriers.get(n.courier_id)?.name)} прислал свой маршрут «${n.title}»`, 'info', 6000);
  }
  if (table === 'stops' && p.eventType === 'UPDATE') {
    const old = state.stops.get(n.id);
    if (old && old.status === 'pending' && n.status !== 'pending') {
      const r = state.routes.get(n.route_id);
      const who = firstName(state.couriers.get(r?.courier_id)?.name);
      if (n.status === 'done') toast(`${who}: доставлено — ${n.address}`, 'ok');
      else toast(`${who}: не доставлено — ${n.address}${n.result_comment ? ` (${n.result_comment})` : ''}`, 'bad', 6000);
    }
    if (old) { Object.assign(old, n); renderAll(); }
  }
  if (table === 'routes' && p.eventType === 'UPDATE') {
    const old = state.routes.get(n.id);
    if (old && old.status !== n.status) {
      const who = firstName(state.couriers.get(n.courier_id)?.name);
      if (n.status === 'accepted') toast(`${who} принял маршрут «${n.title}»`, 'info');
      if (n.status === 'done') toast(`${who} завершил маршрут «${n.title}»`, 'ok');
    }
    if (old) { Object.assign(old, { ...n, stops: old.stops }); renderAll(); }
  }
  scheduleReload();
}

function setConn(s) {
  state.conn = s;
  const el = $('#conn');
  if (!el) return;
  const demo = state.api?.kind === 'demo';
  el.className = 'conn' + (demo ? ' demo' : s === 'online' ? '' : ' off');
  el.innerHTML = `<i></i>${demo ? 'демо' : s === 'online' ? 'онлайн' : s === 'connecting' ? 'подключение…' : 'нет связи'}`;
}

/* ===================================================================
 *  Действия по клику: data-act="имя"
 * =================================================================== */
const actions = {};
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el, e); }
});

/* ===================================================================
 *  Экран подключения к серверу
 * =================================================================== */
function renderSetup(errorMsg = '') {
  $('#app').innerHTML = `
  <div class="screen"><div class="screen-inner">
    <div class="logo-row"><img src="icons/icon-192.png" width="52" height="52" alt=""><div><b style="font-size:18px">Диспетчер</b><div style="color:#B9C2D6;font-size:13px">маршруты и курьеры</div></div></div>
    <h1>Подключение к серверу</h1>
    <p class="lead">Данные из Supabase: кнопка «Connect» или Settings → API Keys. Это нужно сделать один раз.</p>
    <form class="card" id="setup-form">
      <label class="field"><span>Project URL</span><input class="input" name="url" inputmode="url" autocomplete="off" autocapitalize="off" placeholder="https://xxxx.supabase.co" value="${esc(settings.supabaseUrl)}" required></label>
      <label class="field"><span>Publishable key</span><textarea class="input" name="key" rows="3" autocomplete="off" autocapitalize="off" spellcheck="false" style="min-height:84px" placeholder="sb_publishable_…" required>${esc(settings.supabaseKey)}</textarea></label>
      ${errorMsg ? `<div class="error">${esc(errorMsg)}</div>` : ''}
      <button class="btn primary block" type="submit">Подключить</button>
    </form>
    <div class="or">или</div>
    <button class="btn block" data-act="start-demo" style="background:rgba(255,255,255,.08);color:#fff;border-color:rgba(255,255,255,.18)">Посмотреть демо без сервера</button>
  </div></div>`;
  $('#setup-form').onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    const url = f.url.value.trim().replace(/\/+$/, '');
    const key = f.key.value.trim();
    const btn = f.querySelector('button');
    btn.disabled = true; btn.textContent = 'Проверяю…';
    try {
      if (!/^https:\/\//.test(url)) throw new Error('Адрес должен начинаться с https://');
      await loadScript(CDN.supabase);
      const api = makeSupabaseApi(url, key);
      await api.check();
      Object.assign(settings, { supabaseUrl: url, supabaseKey: key, demo: false });
      saveSettings();
      state.api = api;
      await afterApi();
    } catch (err) {
      renderSetup(errText(err));
    }
  };
}
actions['start-demo'] = async () => {
  settings.demo = true; saveSettings();
  state.api = makeDemoApi();
  await afterApi();
};

/* ===================================================================
 *  Вход / регистрация диспетчера
 * =================================================================== */
function renderAuth(mode = 'in', msg = '', isError = true) {
  $('#app').innerHTML = `
  <div class="screen"><div class="screen-inner">
    <div class="logo-row"><img src="icons/icon-192.png" width="52" height="52" alt=""><div><b style="font-size:18px">Диспетчер</b><div style="color:#B9C2D6;font-size:13px">маршруты и курьеры</div></div></div>
    <h1>${mode === 'in' ? 'Вход' : 'Регистрация'}</h1>
    <p class="lead">${mode === 'in' ? 'Войдите в аккаунт диспетчера.' : 'Создайте аккаунт диспетчера. Курьерам регистрироваться не нужно — они подключаются по коду.'}</p>
    <form class="card" id="auth-form">
      <label class="field"><span>E-mail</span><input class="input" name="email" type="email" autocomplete="email" autocapitalize="off" required></label>
      <label class="field"><span>Пароль</span><input class="input" name="pw" type="password" minlength="6" autocomplete="${mode === 'in' ? 'current-password' : 'new-password'}" required></label>
      ${msg ? `<div class="${isError ? 'error' : 'ok-text'}" style="margin-bottom:10px">${esc(msg)}</div>` : ''}
      <button class="btn primary block" type="submit">${mode === 'in' ? 'Войти' : 'Зарегистрироваться'}</button>
    </form>
    <div class="center"><button class="link-btn" data-act="auth-mode" data-mode="${mode === 'in' ? 'up' : 'in'}">${mode === 'in' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}</button></div>
    <div class="center" style="margin-top:18px"><button class="link-btn" style="color:#8E98B0;font-weight:400" data-act="reset-conn">Другой сервер</button></div>
  </div></div>`;
  $('#auth-form').onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target; const btn = f.querySelector('button');
    btn.disabled = true;
    try {
      if (mode === 'in') {
        await state.api.signIn(f.email.value.trim(), f.pw.value);
      } else {
        const session = await state.api.signUp(f.email.value.trim(), f.pw.value);
        if (!session) { renderAuth('in', 'Аккаунт создан. Подтвердите e-mail по ссылке из письма и войдите.', false); return; }
      }
      await afterAuth();
    } catch (err) {
      renderAuth(mode, errText(err));
    }
  };
}
actions['auth-mode'] = (el) => renderAuth(el.dataset.mode);
actions['reset-conn'] = async () => {
  if (state.api?.kind === 'supabase') { try { await state.api.signOut(); } catch (e) { /* */ } }
  if (state.unsub) state.unsub();
  Object.assign(settings, { supabaseUrl: '', supabaseKey: '', demo: false });
  saveSettings();
  location.reload();
};

/* ===================================================================
 *  Создание команды / подключение ко второй команде
 * =================================================================== */
function renderTeamSetup(msg = '') {
  $('#app').innerHTML = `
  <div class="screen"><div class="screen-inner">
    <h1>Ваше предприятие</h1>
    <p class="lead">Создайте команду — получите код, по которому курьеры подключатся из своего приложения.</p>
    <form class="card" id="team-form">
      <h2>Новая команда</h2>
      <label class="field"><span>Название</span><input class="input" name="name" placeholder="Например: Доставка «Север»" required></label>
      <button class="btn primary block" type="submit">Создать</button>
    </form>
    <div class="or">или</div>
    <form class="card" id="join-form">
      <h2>Присоединиться диспетчером</h2>
      <label class="field"><span>Код диспетчера (8 символов)</span><input class="input mono" name="code" autocapitalize="characters" autocomplete="off" required></label>
      <p class="hint">Код есть у первого диспетчера во вкладке «Ещё».</p>
      <button class="btn block" type="submit">Присоединиться</button>
    </form>
    ${msg ? `<div class="error" style="color:#FF9A9A">${esc(msg)}</div>` : ''}
    <div class="center"><button class="link-btn" style="color:#8E98B0;font-weight:400" data-act="logout">Выйти из аккаунта</button></div>
  </div></div>`;
  $('#team-form').onsubmit = async (e) => {
    e.preventDefault();
    try { state.team = await state.api.createTeam(e.target.name.value.trim()); renderMain(); } catch (err) { renderTeamSetup(errText(err)); }
  };
  $('#join-form').onsubmit = async (e) => {
    e.preventDefault();
    try { state.team = await state.api.joinTeam(e.target.code.value.trim()); renderMain(); } catch (err) { renderTeamSetup(errText(err)); }
  };
}
actions.logout = async () => {
  if (!confirm('Выйти из аккаунта?')) return;
  if (state.unsub) state.unsub();
  if (state.api.kind === 'demo') { settings.demo = false; saveSettings(); location.reload(); return; }
  await state.api.signOut();
  location.reload();
};

/* ===================================================================
 *  Основной экран
 * =================================================================== */
const TABS = [
  { id: 'map', label: 'Карта', icon: 'map' },
  { id: 'routes', label: 'Маршруты', icon: 'list' },
  { id: 'couriers', label: 'Курьеры', icon: 'users' },
  { id: 'report', label: 'Отчёт', icon: 'chart' },
  { id: 'more', label: 'Ещё', icon: 'more' },
];

function renderMain() {
  $('#app').innerHTML = `
    <header class="topbar">
      <div class="t-title"><div class="t-name" id="team-name">${esc(state.team.name)}</div><div class="t-sub">Диспетчерская</div></div>
      <span class="conn" id="conn"><i></i></span>
    </header>
    <div class="views">
      <section class="view map-view" id="view-map">
        <div id="map"></div>
        <div class="map-top"><div class="map-day" id="map-day"></div><div class="map-chips" id="map-chips"></div></div>
        <div class="map-tools"><button class="icon-btn" data-act="map-fit" aria-label="Показать всех">${icon('fit')}</button></div>
        <div class="map-player" id="map-player" hidden></div>
      </section>
      <section class="view" id="view-routes" hidden></section>
      <section class="view" id="view-couriers" hidden></section>
      <section class="view" id="view-report" hidden></section>
      <section class="view settings" id="view-more" hidden></section>
      <button class="fab" data-act="new-route" id="fab" hidden aria-label="Новый маршрут">${icon('plus')}</button>
    </div>
    <nav class="tabbar">
      ${TABS.map((t) => `<button data-act="tab" data-tab="${t.id}" id="tab-${t.id}">${icon(t.icon)}<span>${t.label}</span></button>`).join('')}
    </nav>`;
  setConn(state.conn);
  switchTab(state.tab);
  startSync();
}

function switchTab(id) {
  state.tab = id; store('dm.tab', id);
  TABS.forEach((t) => {
    $(`#view-${t.id}`).hidden = t.id !== id;
    $(`#tab-${t.id}`).classList.toggle('active', t.id === id);
  });
  $('#fab').hidden = id !== 'routes';
  if (id !== 'map') histPause();
  if (id === 'map') ensureMap();
  if (id === 'report' && state.report && !state.report.loading) { loadReport(); return; }
  renderCurrentTab();
}
actions.tab = (el) => switchTab(el.dataset.tab);

function renderCurrentTab() {
  if (!$('#view-map')) return;
  if (state.tab === 'routes') renderRoutes();
  if (state.tab === 'couriers') renderCouriers();
  if (state.tab === 'more') renderMore();
  if (state.tab === 'report') renderReport();
  if (state.tab === 'map') renderMapChips();
}

function startSync() {
  if (state.unsub) state.unsub();
  setConn('connecting');
  state.unsub = state.api.subscribe(state.team.id, onDbEvent, (s) => {
    if (s === 'SUBSCRIBED') { setConn('online'); scheduleReload(); } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') setConn('offline');
  });
  if (state.unsubAlerts) state.unsubAlerts();
  state.unsubAlerts = state.api.subscribeAlerts ? state.api.subscribeAlerts(state.team.id, onAlertEvent) : null;
  if (settings.notify) ensurePush(false);
  loadData();
}
setInterval(() => { if (state.team && document.visibilityState === 'visible') loadData(); }, 30000);
setInterval(() => { if (state.team && document.visibilityState === 'visible') renderAll(); }, 20000); // «N мин назад»
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && state.team) loadData(); });
window.addEventListener('online', () => { if (state.team) startSync(); });
window.addEventListener('offline', () => setConn('offline'));

/* ===================================================================
 *  Вкладка «Маршруты»
 * =================================================================== */
function routeCardHtml(r) {
  const c = state.couriers.get(r.courier_id);
  const k = routeCounts(r);
  const pDone = k.total ? (k.done / k.total) * 100 : 0;
  const pFail = k.total ? (k.failed / k.total) * 100 : 0;
  return `
  <div class="card tap" data-act="open-route" data-id="${r.id}">
    <div class="r-head">
      <div style="flex:1;min-width:0">
        <div class="r-title">${esc(r.title)}</div>
        <div class="r-meta">${c ? esc(c.name) : '<i>курьер не назначен</i>'}${r.route_date !== state.date ? ` · ${dateLabel(r.route_date)}` : ''}</div>
      </div>
      <span class="chip ${shownStatus(r)}">${STATUS[shownStatus(r)]}</span>
    </div>
    <div class="progress"><i class="p-done" style="width:${pDone}%"></i><i class="p-failed" style="width:${pFail}%"></i></div>
    <div class="p-label"><span>${k.done} из ${k.total} доставлено${k.failed ? ` · ${k.failed} не доставлено` : ''}</span><span>${r.status === 'draft' ? '' : esc(rel(r.updated_at || r.sent_at))}</span></div>
  </div>`;
}

function renderRoutes() {
  const v = $('#view-routes');
  const list = routesForDate();
  const otherActive = [...state.routes.values()].filter((r) => r.route_date !== state.date && ['sent', 'accepted', 'in_progress'].includes(r.status));
  const inWork = list.filter((r) => ['sent', 'accepted', 'in_progress'].includes(r.status)).length;
  const done = list.filter((r) => r.status === 'done').length;
  const drafts = list.filter((r) => r.status === 'draft').length;
  v.innerHTML = `<div class="wrap">
    <div class="datebar">
      <button class="icon-btn" data-act="date-shift" data-d="-1" aria-label="Предыдущий день">${icon('left')}</button>
      <div class="d-label">${dateLabel(state.date)}<small>${esc(dateLong(state.date))}</small><input type="date" id="date-pick" value="${state.date}" aria-label="Выбрать дату"></div>
      <button class="icon-btn" data-act="date-shift" data-d="1" aria-label="Следующий день">${icon('right')}</button>
    </div>
    ${!navigator.onLine ? '<div class="banner offline">Нет интернета — показаны последние загруженные данные.</div>' : ''}
    ${state.api.kind === 'demo' ? '<div class="banner">Демо-режим: данные ненастоящие, курьеры двигаются сами. Подключите Supabase во вкладке «Ещё».</div>' : ''}
    <div class="stats">
      <div class="stat"><b>${inWork}</b><span>в работе</span></div>
      <div class="stat"><b>${done}</b><span>завершено</span></div>
      <div class="stat"><b>${drafts}</b><span>черновики</span></div>
    </div>
    <div class="row" style="margin-bottom:12px"><button class="btn block" data-act="import-orders">${icon('download')}Заказы из Excel / CSV</button></div>
    ${list.length ? list.map(routeCardHtml).join('') : `
      <div class="empty"><b>${state.date === dateStr() ? 'На сегодня маршрутов нет' : 'На этот день маршрутов нет'}</b>Нажмите «+», чтобы создать маршрут, или загрузите заказы из Excel.</div>`}
    ${otherActive.length ? `<div class="section-title">В работе с других дней</div>${otherActive.map(routeCardHtml).join('')}` : ''}
  </div>`;
  $('#date-pick').onchange = (e) => { if (e.target.value) { state.date = e.target.value; renderRoutes(); loadData(); } };
}
actions['date-shift'] = (el) => { state.date = addDays(state.date, +el.dataset.d); renderRoutes(); loadData(); };
actions['open-route'] = (el) => openRouteSheet(el.dataset.id);
actions['new-route'] = () => openEditor(null);

/* ===================================================================
 *  Нижняя шторка
 * =================================================================== */
const sheets = [];
function openSheet({ title, body = '', foot = null, tall = false, onClose }) {
  const back = document.createElement('div');
  back.className = 'sheet-backdrop';
  const el = document.createElement('div');
  el.className = 'sheet' + (tall ? ' tall' : '');
  el.setAttribute('role', 'dialog');
  el.innerHTML = `<div class="sheet-grip"></div>
    <div class="sheet-head"><h3>${esc(title)}</h3><button class="icon-btn" data-close aria-label="Закрыть">${icon('x')}</button></div>
    <div class="sheet-body">${body}</div>${foot != null ? `<div class="sheet-foot">${foot}</div>` : ''}`;
  $('#sheet-root').append(back, el);
  requestAnimationFrame(() => { back.classList.add('open'); el.classList.add('open'); });
  const sh = {
    el,
    body: $('.sheet-body', el),
    setTitle(t) { $('.sheet-head h3', el).textContent = t; },
    setBody(html) { const st = sh.body.scrollTop; sh.body.innerHTML = html; sh.body.scrollTop = st; },
    setFoot(html) { const f = $('.sheet-foot', el); if (f) f.innerHTML = html; },
    close() {
      if (sh.closed) return; sh.closed = true;
      back.classList.remove('open'); el.classList.remove('open');
      setTimeout(() => { back.remove(); el.remove(); }, 260);
      sheets.splice(sheets.indexOf(sh), 1);
      if (sh.refresh) sheetRefreshers.delete(sh.refresh);
      if (onClose) onClose();
    },
  };
  back.onclick = () => sh.close();
  $('[data-close]', el).onclick = () => sh.close();
  sheets.push(sh);
  return sh;
}
function closeAllSheets() { [...sheets].forEach((s) => s.close()); }
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sheets.length) sheets[sheets.length - 1].close(); });

function confirmSheet(title, text, okLabel, danger = false) {
  return new Promise((resolve) => {
    let done = false;
    const sh = openSheet({
      title,
      body: `<p style="margin:0">${esc(text)}</p>`,
      foot: `<button class="btn" data-no>Отмена</button><button class="btn ${danger ? 'danger' : 'primary'}" data-yes>${esc(okLabel)}</button>`,
      onClose: () => { if (!done) resolve(false); },
    });
    $('[data-no]', sh.el).onclick = () => sh.close();
    $('[data-yes]', sh.el).onclick = () => { done = true; resolve(true); sh.close(); };
  });
}

/* ===================================================================
 *  Карточка маршрута
 * =================================================================== */
function stopHtml(s, i) {
  const d = s.status !== 'pending' ? distM({ lat: s.done_lat, lng: s.done_lng }, s) : null;
  const extra = [
    clientHtml(s),
    s.client_phone ? `<a href="${telHref(s.client_phone)}">${esc(s.client_phone)}</a>` : '',
    s.time_from || s.time_to ? `${esc(s.time_from || '…')}–${esc(s.time_to || '…')}` : '',
  ].filter(Boolean).join(' · ');
  return `<div class="stop">
    <div class="num ${s.status}">${i + 1}</div>
    <div class="s-main">
      <div class="s-addr">${esc(s.address)}</div>
      ${extra ? `<div class="s-sub">${extra}</div>` : ''}
      ${s.note ? `<div class="s-sub">${esc(s.note)}</div>` : ''}
      ${bookLine(s)}
      ${s.lat == null ? '<div class="warn">Адрес не найден на карте</div>' : ''}
      ${s.status !== 'pending' ? `<div class="s-res ${s.status}" data-head="${s.id}">${headText(s, null, true)}</div>` : ''}
      <div class="s-check" data-stop="${s.id}">${checkHtml(s, evCache.get(s.id), null) || (d != null && d > FAR_METERS ? `<div class="warn">⚠ Отмечено в ${fmtDist(d)} от адреса</div>` : '')}</div>
    </div>
  </div>`;
}

function routeSheetBody(r) {
  const c = state.couriers.get(r.courier_id);
  const k = routeCounts(r);
  const pDone = k.total ? (k.done / k.total) * 100 : 0;
  const pFail = k.total ? (k.failed / k.total) * 100 : 0;
  const A = (act, label, ic, cls = '') => `<button class="btn small ${cls}" data-act="${act}" data-id="${r.id}">${icon(ic)}${label}</button>`;
  let acts = '';
  if (r.status === 'draft') acts = A('route-send', 'Отправить', 'send', 'primary') + A('route-edit', 'Изменить', 'edit') + A('route-map', 'На карте', 'map') + A('route-delete', 'Удалить', 'trash', 'danger');
  else if (['sent', 'accepted', 'in_progress'].includes(r.status)) acts = A('route-map', 'На карте', 'map', 'primary') + A('route-edit', 'Изменить', 'edit') + A('route-send', 'Другому курьеру', 'send') + A('route-recall', 'Отозвать', 'undo') + A('route-cancel', 'Отменить', 'ban', 'danger');
  else if (r.status === 'done') acts = A('route-map', 'На карте', 'map', 'primary') + A('route-repeat', 'Повторить', 'repeat') + A('route-delete', 'Удалить', 'trash', 'danger');
  else acts = A('route-recall', 'В черновик', 'undo') + A('route-repeat', 'Повторить', 'repeat') + A('route-delete', 'Удалить', 'trash', 'danger');

  const times = [
    ['Отправлен', r.sent_at], ['Принят', r.accepted_at], ['Начат', r.started_at], ['Завершён', r.finished_at],
  ].filter(([, t]) => t);
  return `
    <div class="r-head">
      <div style="flex:1;min-width:0">
        <div class="r-meta">${esc(dateLabel(r.route_date))}${c ? ` · <a href="#" data-act="open-courier" data-id="${c.id}">${esc(c.name)}</a>` : ' · курьер не назначен'}</div>
      </div>
      <span class="chip ${shownStatus(r)}">${STATUS[shownStatus(r)]}</span>
    </div>
    <div class="progress"><i class="p-done" style="width:${pDone}%"></i><i class="p-failed" style="width:${pFail}%"></i></div>
    <div class="p-label"><span>${k.done} из ${k.total} доставлено${k.failed ? ` · ${k.failed} не доставлено` : ''}</span><span>${k.left ? `осталось ${k.left}` : ''}</span></div>
    <div class="actions">${acts}</div>
    ${r.comment ? `<div class="banner" style="margin-top:6px">${esc(r.comment)}</div>` : ''}
    <div class="section-title">Точки · ${k.total}</div>
    <div class="card" style="padding:2px 14px">${(r.stops || []).map(stopHtml).join('') || '<div class="empty">Точек нет</div>'}</div>
    ${times.length ? `<div class="section-title">История</div><div class="card"><dl class="kv">${times.map(([l, t]) => `<dt>${l}</dt><dd>${dateTimeOf(t)}</dd>`).join('')}</dl></div>` : ''}`;
}

function openRouteSheet(id) {
  const r = state.routes.get(id);
  if (!r) return;
  const sh = openSheet({ title: r.title, body: routeSheetBody(r), tall: true });
  sh.refresh = () => {
    const cur = state.routes.get(id);
    if (!cur) { sh.close(); return; }
    sh.setTitle(cur.title);
    sh.setBody(routeSheetBody(cur));
    fillRouteChecks(cur);
  };
  sheetRefreshers.add(sh.refresh);
  fillRouteChecks(r);
}

actions['route-edit'] = (el) => openEditor(el.dataset.id);
actions['route-map'] = (el) => {
  const r = state.routes.get(el.dataset.id);
  closeAllSheets();
  if (r && !mapRoutes().includes(r) && r.route_date < dateStr()) { openHistory(r.route_date, r.id); return; }
  if (hist.day) setMapDay(null);
  state.focusRouteId = el.dataset.id; switchTab('map'); setTimeout(fitFocus, 80);
};
actions['route-send'] = (el) => openSendPicker(el.dataset.id);
actions['route-recall'] = async (el) => {
  const r = state.routes.get(el.dataset.id);
  if (r.status !== 'cancelled' && !(await confirmSheet('Отозвать маршрут?', 'Маршрут вернётся в черновики и пропадёт у курьера. Отметки о доставке сохранятся.', 'Отозвать'))) return;
  await runWrite(() => state.api.updateRoute(r.id, { status: 'draft' }), 'Маршрут в черновиках');
};
actions['route-cancel'] = async (el) => {
  if (!(await confirmSheet('Отменить маршрут?', 'Маршрут пропадёт у курьера и будет помечен как отменённый.', 'Отменить маршрут', true))) return;
  await runWrite(() => state.api.updateRoute(el.dataset.id, { status: 'cancelled' }), 'Маршрут отменён');
};
actions['route-delete'] = async (el) => {
  if (!(await confirmSheet('Удалить маршрут?', 'Маршрут и все его точки будут удалены без возможности восстановления.', 'Удалить', true))) return;
  closeAllSheets();
  await runWrite(() => state.api.deleteRoute(el.dataset.id), 'Маршрут удалён');
};
actions['route-repeat'] = (el) => {
  const r = state.routes.get(el.dataset.id);
  closeAllSheets();
  openEditor(null, {
    title: r.title, courier_id: r.courier_id, comment: r.comment, route_date: dateStr(),
    stops: (r.stops || []).map((s) => ({ ...s, id: uuid(), status: 'pending', done_at: null, done_lat: null, done_lng: null, result_comment: null })),
  });
};

async function runWrite(fn, okText) {
  try {
    await fn();
    if (okText) toast(okText, 'ok', 2500);
    await loadData();
    return true;
  } catch (e) {
    toast(errText(e), 'bad', 6000);
    return false;
  }
}

/* ---------- выбор курьера для отправки ---------- */
function openSendPicker(routeId, afterSend) {
  const r = state.routes.get(routeId);
  if (!r) return;
  if (!(r.stops || []).length) { toast('В маршруте нет точек', 'bad'); return; }
  const list = [...state.couriers.values()].filter((c) => c.active)
    .sort((a, b) => ['online', 'stale', 'off'].indexOf(courierState(a)) - ['online', 'stale', 'off'].indexOf(courierState(b)) || a.name.localeCompare(b.name));
  if (!list.length) { toast('Пока нет курьеров — дайте им код из вкладки «Курьеры»', 'bad', 6000); return; }
  let sel = r.courier_id && list.some((c) => c.id === r.courier_id) ? r.courier_id : list[0].id;
  const body = () => list.map((c) => {
    const st = courierState(c);
    const busy = activeRouteOf(c.id);
    return `<div class="pick ${c.id === sel ? 'sel' : ''}" data-pick="${c.id}">
      <div class="avatar">${esc(initials(c.name))}<span class="dot ${st}"></span></div>
      <div class="c-main"><div class="c-name">${esc(c.name)}</div>
      <div class="c-sub">${COURIER_STATE[st]}${busy && busy.id !== r.id ? ` · в работе: ${esc(busy.title)}` : ''}</div></div>
    </div>`;
  }).join('');
  const sh = openSheet({
    title: 'Кому отправить',
    body: body(),
    foot: '<button class="btn primary" data-go>' + icon('send') + 'Отправить</button>',
  });
  sh.body.onclick = (e) => { const p = e.target.closest('[data-pick]'); if (p) { sel = p.dataset.pick; sh.setBody(body()); } };
  $('[data-go]', sh.el).onclick = async () => {
    const c = state.couriers.get(sel);
    sh.close();
    const ok = await runWrite(() => state.api.updateRoute(routeId, {
      courier_id: sel, status: 'sent', sent_at: new Date().toISOString(), accepted_at: null,
    }), `Маршрут отправлен: ${c.name}`);
    if (ok && afterSend) afterSend();
  };
}

/* ===================================================================
 *  Редактор маршрута
 * =================================================================== */
function openEditor(routeId, preset = null) {
  const src = routeId ? state.routes.get(routeId) : null;
  const base = src || preset || {};
  const n = routesForDate().length + 1;
  const ed = {
    isNew: !src,
    route: {
      id: src?.id || uuid(),
      team_id: state.team.id,
      title: base.title || `Маршрут ${n}`,
      route_date: base.route_date || state.date,
      courier_id: base.courier_id || null,
      comment: base.comment || '',
    },
    stops: (base.stops || []).map((s) => ({ ...s, _orig: s.lat != null || src ? s.address : null, _geo: s.lat != null ? 'ok' : src ? 'miss' : null })),
    removed: [],
    bulk: false,
  };
  if (!ed.stops.length) ed.stops.push(newStop());

  const sh = openSheet({ title: src ? 'Изменить маршрут' : 'Новый маршрут', body: '', tall: true, foot: '' });

  function newStop(address = '') { return { id: uuid(), address, _orig: null, _geo: null, _open: false, status: 'pending' }; }

  function render() {
    const couriers = [...state.couriers.values()].filter((c) => c.active || c.id === ed.route.courier_id);
    const canSend = !src || ['draft', 'cancelled'].includes(src.status);
    sh.setBody(`
      <label class="field"><span>Название</span><input class="input" data-f="title" value="${esc(ed.route.title)}"></label>
      <div class="row">
        <label class="field"><span>Дата</span><input class="input" type="date" data-f="route_date" value="${esc(ed.route.route_date)}"></label>
        <label class="field"><span>Курьер</span><select class="input" data-f="courier_id">
          <option value="">— не назначен —</option>
          ${couriers.map((c) => `<option value="${c.id}" ${c.id === ed.route.courier_id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
        </select></label>
      </div>
      <label class="field"><span>Комментарий для курьера</span><input class="input" data-f="comment" value="${esc(ed.route.comment || '')}" placeholder="Необязательно"></label>

      <div class="section-title" style="display:flex;align-items:center;justify-content:space-between">
        <span>Точки · ${ed.stops.length}</span>
        <span><button class="link-btn" data-e="import" style="text-transform:none;letter-spacing:0;margin-right:12px">Из Excel</button><button class="link-btn" data-e="bulk" style="text-transform:none;letter-spacing:0">${ed.bulk ? 'Скрыть' : 'Вставить списком'}</button></span>
      </div>
      ${ed.bulk ? `
        <div class="card">
          <textarea class="input" data-bulk placeholder="Каждый адрес с новой строки.&#10;Можно через «;» добавить телефон и комментарий:&#10;ул. Ленина, 10, кв 5; +7 900 123-45-67; домофон 5К"></textarea>
          <div class="row" style="margin-top:10px"><button class="btn primary" data-e="bulk-add">Добавить</button></div>
        </div>` : ''}
      ${ed.stops.map((s, i) => `
        <div class="ed-stop" data-i="${i}">
          <div class="ed-top">
            <div class="num ${s.status && s.status !== 'pending' ? s.status : ''}">${i + 1}</div>
            <input class="input" data-s="address" value="${esc(s.address)}" placeholder="Адрес">
            <div class="ed-tools">
              <button class="icon-btn" data-e="more" aria-label="Подробнее">${icon('dots')}</button>
            </div>
          </div>
          ${edClientHtml(s)}
          ${s._open ? `
          <div class="ed-more">
            <input class="input" data-s="client_name" value="${esc(s.client_name || '')}" placeholder="Получатель">
            <input class="input" data-s="client_phone" type="tel" value="${esc(s.client_phone || '')}" placeholder="Телефон">
            <input class="input" data-s="time_from" type="time" value="${esc(s.time_from || '')}" aria-label="С">
            <input class="input" data-s="time_to" type="time" value="${esc(s.time_to || '')}" aria-label="До">
            <input class="input full" data-s="note" value="${esc(s.note || '')}" placeholder="Комментарий к точке">
            <div class="full ed-tools" style="justify-content:flex-end">
              <button class="icon-btn" data-e="up" aria-label="Выше" ${i === 0 ? 'disabled' : ''}>${icon('up')}</button>
              <button class="icon-btn" data-e="down" aria-label="Ниже" ${i === ed.stops.length - 1 ? 'disabled' : ''}>${icon('down')}</button>
              <button class="icon-btn" data-e="del" aria-label="Удалить" style="color:var(--red)">${icon('trash')}</button>
            </div>
          </div>` : ''}
          ${s._geo === 'ok' && s.address === s._orig ? '<div class="geo"><span class="found">● на карте</span></div>' : ''}
          ${s._geo === 'miss' && s.address === s._orig ? '<div class="geo"><span class="miss">● не найден на карте — уточните адрес</span></div>' : ''}
        </div>`).join('')}
      <button class="btn block" data-e="add" style="margin-top:4px">${icon('plus')}Добавить точку</button>
      ${settings.city ? '' : '<p class="hint" style="margin-top:12px">Совет: укажите город во вкладке «Ещё» — тогда адреса можно писать без города.</p>'}
    `);
    sh.setFoot(canSend
      ? `<button class="btn" data-e="save">Сохранить</button><button class="btn primary" data-e="save-send">${icon('send')}Сохранить и отправить</button>`
      : '<button class="btn primary" data-e="save">Сохранить изменения</button>');
  }

  sh.el.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.f) ed.route[t.dataset.f] = t.value;
    if (t.dataset.s) {
      const i = +t.closest('[data-i]').dataset.i;
      ed.stops[i][t.dataset.s] = t.value;
    }
  });
  sh.el.addEventListener('change', (e) => {
    if (e.target.dataset.f === 'courier_id') ed.route.courier_id = e.target.value || null;
    const box = e.target.closest('[data-i]');
    if (!box) return;
    const s = ed.stops[+box.dataset.i];
    if (e.target.dataset.client != null) {
      const c = (state.clients || []).find((x) => x.id === e.target.value);
      if (c) applyClient(s, c);
      else { applyClient(s, null); s.client_name = null; }
      render();
    }
    // адрес поменяли: клиент из справочника — по новому адресу
    if (e.target.dataset.s === 'address' && state.clients?.length) {
      if (s.client_ref && !clientsAt(s.address).some((c) => c.id === s.client_ref)) { applyClient(s, null); s.client_name = null; }
      if (!s.client_ref) { const m = matchClient(s.client_name, s.address); if (m.client) applyClient(s, m.client); }
      render();
    }
  });
  sh.el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.dataset.s === 'address') {
      e.preventDefault();
      const i = +e.target.closest('[data-i]').dataset.i;
      ed.stops.splice(i + 1, 0, newStop());
      render();
      $$('[data-s="address"]', sh.el)[i + 1]?.focus();
    }
  });
  sh.el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-e]');
    if (!b) return;
    const box = b.closest('[data-i]');
    const i = box ? +box.dataset.i : -1;
    const act = b.dataset.e;
    if (act === 'more') { ed.stops[i]._open = !ed.stops[i]._open; render(); }
    if (act === 'up' && i > 0) { [ed.stops[i - 1], ed.stops[i]] = [ed.stops[i], ed.stops[i - 1]]; render(); }
    if (act === 'down' && i < ed.stops.length - 1) { [ed.stops[i + 1], ed.stops[i]] = [ed.stops[i], ed.stops[i + 1]]; render(); }
    if (act === 'del') {
      const [s] = ed.stops.splice(i, 1);
      if (src && (src.stops || []).some((x) => x.id === s.id)) ed.removed.push(s.id);
      if (!ed.stops.length) ed.stops.push(newStop());
      render();
    }
    if (act === 'add') {
      ed.stops.push(newStop()); render();
      const inputs = $$('[data-s="address"]', sh.el); inputs[inputs.length - 1]?.focus();
    }
    if (act === 'bulk') { ed.bulk = !ed.bulk; render(); if (ed.bulk) $('[data-bulk]', sh.el)?.focus(); }
    if (act === 'import') {
      pickOrdersFile((rows) => {
        ed.stops = ed.stops.filter((x) => x.address.trim() || x.status !== 'pending' || (src && (src.stops || []).some((y) => y.id === x.id)));
        rows.forEach((r) => ed.stops.push({ ...newStop(r.address), ...r, _orig: r.lat != null ? r.address : null, _geo: r.lat != null ? 'ok' : null }));
        if (!ed.stops.length) ed.stops.push(newStop());
        render();
        toast(`Добавлено ${rows.length} ${plural(rows.length, 'адрес', 'адреса', 'адресов')}`, 'ok', 2500);
      });
    }
    if (act === 'bulk-add') {
      const lines = $('[data-bulk]', sh.el).value.split('\n').map((l) => l.trim()).filter(Boolean);
      if (!lines.length) return;
      ed.stops = ed.stops.filter((s) => s.address.trim() || s.status !== 'pending' || (src && (src.stops || []).some((x) => x.id === s.id)));
      lines.forEach((line) => {
        const parts = line.split(/\s*[;\t|]\s*/).filter(Boolean);
        const s = newStop(parts.shift());
        const notes = [];
        parts.forEach((p) => { if (!s.client_phone && isPhone(p)) s.client_phone = p; else notes.push(p); });
        if (notes.length) s.note = notes.join('; ');
        ed.stops.push(s);
      });
      ed.bulk = false;
      render();
      toast(`Добавлено ${lines.length} ${plural(lines.length, 'адрес', 'адреса', 'адресов')}`, 'ok', 2000);
    }
    if (act === 'save' || act === 'save-send') await save(act === 'save-send');
  });

  async function save(andSend) {
    ed.stops = ed.stops.filter((s) => {
      if (s.address.trim()) return true;
      if (src && (src.stops || []).some((x) => x.id === s.id)) ed.removed.push(s.id);
      return false;
    });
    if (!ed.stops.length) { ed.stops.push(newStop()); render(); toast('Добавьте хотя бы один адрес', 'bad'); return; }
    if (!ed.route.title.trim()) ed.route.title = 'Маршрут';
    const foot = $('.sheet-foot', sh.el);
    ed.stops.forEach((s) => {
      if (s.client_ref || !state.clients?.length) return;
      const m = matchClient(s.client_name, s.address);
      if (m.client) { applyClient(s, m.client); if (s.lat != null) s._orig = s.address; }
    });
    const todo = ed.stops.filter((s) => s.address !== s._orig || s.lat == null);
    const btns = $$('button', foot); btns.forEach((x) => { x.disabled = true; });
    let k = 0;
    for (const s of todo) {
      k++;
      foot.firstElementChild.textContent = `Ищу адреса на карте ${k}/${todo.length}…`;
      const g = await geocode(s.address);
      s.lat = g?.lat ?? null; s.lng = g?.lng ?? null;
      s._orig = s.address; s._geo = g ? 'ok' : 'miss';
    }
    ed.stops.forEach((s, i) => { s.seq = i + 1; s.address = s.address.trim(); });
    const routeRow = { ...ed.route, comment: ed.route.comment?.trim() || null };
    if (ed.isNew) routeRow.status = 'draft';
    try {
      await state.api.saveRoute(routeRow, ed.stops, ed.removed);
      ed.isNew = false; ed.removed = [];
      await loadData();
      const missed = ed.stops.filter((s) => s.lat == null).length;
      if (missed) toast(`${missed} ${plural(missed, 'адрес не найден', 'адреса не найдены', 'адресов не найдено')} на карте — курьер увидит их только текстом`, 'bad', 7000);
      if (andSend) {
        if (ed.route.courier_id) {
          const c = state.couriers.get(ed.route.courier_id);
          await runWrite(() => state.api.updateRoute(ed.route.id, { status: 'sent', sent_at: new Date().toISOString(), accepted_at: null }), `Маршрут отправлен: ${c?.name || ''}`);
          sh.close();
        } else {
          sh.close();
          openSendPicker(ed.route.id);
        }
      } else {
        toast('Маршрут сохранён', 'ok', 2000);
        sh.close();
      }
    } catch (e) {
      toast(errText(e), 'bad', 6000);
      render();
    }
  }

  render();
  if (ed.isNew && !preset) setTimeout(() => $('[data-s="address"]', sh.el)?.focus(), 300);
}

/* ===================================================================
 *  Заказы из Excel / CSV
 * =================================================================== */
const IMPORT_FIELDS = [
  ['address', 'Адрес *', /адрес|address|куда|пункт доставки|место доставки/i],
  ['client_name', 'Получатель', /получат|клиент|фио|имя|контакт|организац|магазин|покупат|заказчик/i],
  ['client_phone', 'Телефон', /тел|phone|моб/i],
  ['time_from', 'Время с', /^(время\s*)?(с|от|from|начало)$|окно\s*с|время\s*с|доставка\s*с/i],
  ['time_to', 'Время до', /^(время\s*)?(до|to|deadline|срок|конец)$|окно\s*до|время\s*до|доставить\s*до|доставка\s*до/i],
  ['window', 'Интервал «10:00–14:00»', /интервал|окно|время доставки|время$/i],
  ['note', 'Комментарий', /коммент|примеч|заметк|note|описан|инфо|товар|состав/i],
  ['courier', 'Курьер', /курьер|водител|исполнит|экспедит/i],
];

function pickOrdersFile(onRows) {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.xlsx,.xls,.csv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv';
  inp.style.display = 'none';
  inp.id = 'orders-file';
  document.body.appendChild(inp);
  inp.onchange = async () => {
    const f = inp.files?.[0];
    inp.remove();
    if (!f) return;
    try {
      const table = await readTable(f);
      if (!table.length) { toast('В файле нет строк', 'bad'); return; }
      openImportSheet(table, f.name, onRows);
    } catch (e) {
      toast(e.message || 'Не удалось прочитать файл', 'bad', 6000);
    }
  };
  inp.click();
}
actions['import-orders'] = () => pickOrdersFile(null);

/** Файл → массив строк (массивов ячеек-строк). */
async function readTable(file) {
  const name = file.name.toLowerCase();
  const buf = await file.arrayBuffer();
  if (/\.(xlsx|xls)$/.test(name)) {
    try { await loadScript(CDN.xlsx); } catch (e) { throw new Error('Не удалось загрузить модуль Excel — проверьте интернет'); }
    const wb = window.XLSX.read(buf, { type: 'array', cellDates: false });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = window.XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
    return cleanTable(rows);
  }
  // CSV: UTF-8, а если в нём «кракозябры» — Windows-1251 (так сохраняет Excel)
  let text = new TextDecoder('utf-8').decode(buf);
  if ((text.match(/�/g) || []).length > 2) text = new TextDecoder('windows-1251').decode(buf);
  text = text.replace(/^﻿/, '');
  const first = text.split(/\r?\n/).slice(0, 5).join('\n');
  const delim = [';', '\t', ','].map((d) => [d, first.split(d).length]).sort((a, b) => b[1] - a[1])[0][0];
  return cleanTable(parseCsv(text, delim));
}
function parseCsv(text, d) {
  const rows = []; let row = []; let cell = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === d) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
function cleanTable(rows) {
  const out = rows.map((r) => (r || []).map((c) => String(c ?? '').replace(/\s+/g, ' ').trim())).filter((r) => r.some(Boolean));
  const w = Math.max(0, ...out.map((r) => r.length));
  return out.map((r) => [...r, ...Array(w - r.length).fill('')]);
}

/** Строка заголовков: первая из первых 5, где узнаётся колонка адреса. */
function detectHeader(table) {
  for (let i = 0; i < Math.min(5, table.length); i++) {
    if (table[i].some((c) => IMPORT_FIELDS[0][2].test(c) && c.length < 40)) return i;
  }
  return -1;
}
function guessMapping(table, hdr) {
  const map = {};
  const used = new Set();
  if (hdr >= 0) {
    IMPORT_FIELDS.forEach(([f, , re]) => {
      const j = table[hdr].findIndex((c, k) => !used.has(k) && c && re.test(c));
      if (j >= 0) { map[f] = j; used.add(j); }
    });
  }
  // без заголовков — по содержимому
  const body = table.slice(hdr + 1, hdr + 31);
  const w = table[0]?.length || 0;
  const share = (k, re) => body.filter((r) => re.test(r[k] || '')).length / Math.max(1, body.length);
  if (map.address == null) {
    let best = -1; let bs = 0;
    for (let k = 0; k < w; k++) {
      if (used.has(k)) continue;
      const sc = share(k, /[а-яa-z]{3,}.*\d|\d.*[а-яa-z]{3,}/i) + share(k, /ул\.?|улица|пр-т|проспект|д\.|дом|бульвар|шоссе/i);
      if (sc > bs) { bs = sc; best = k; }
    }
    if (best >= 0 && bs > 0.3) { map.address = best; used.add(best); }
  }
  if (map.client_phone == null) {
    for (let k = 0; k < w; k++) if (!used.has(k) && share(k, /^\+?[\d\s()-]{10,18}$/) > 0.5) { map.client_phone = k; used.add(k); break; }
  }
  if (map.window == null && map.time_from == null && map.time_to == null) {
    for (let k = 0; k < w; k++) if (!used.has(k) && share(k, /\d{1,2}[:.]\d{2}\s*[-–—]\s*\d{1,2}[:.]\d{2}/) > 0.5) { map.window = k; used.add(k); break; }
  }
  return map;
}
function hhmm(v) {
  const m = /(\d{1,2})[:.](\d{2})/.exec(v || '');
  if (m && +m[1] < 24 && +m[2] < 60) return `${m[1].padStart(2, '0')}:${m[2]}`;
  const h = /^(?:с|до|c)?\s*(\d{1,2})$/i.exec(String(v || '').trim());
  return h && +h[1] < 24 ? `${h[1].padStart(2, '0')}:00` : '';
}
function importRows(table, hdr, map) {
  const get = (r, f) => (map[f] != null ? r[map[f]] || '' : '');
  return table.slice(hdr + 1).map((r) => {
    const address = get(r, 'address');
    if (!address) return null;
    let from = hhmm(get(r, 'time_from'));
    let to = hhmm(get(r, 'time_to'));
    const win = get(r, 'window');
    if (win) {
      const t = win.match(/\d{1,2}[:.]\d{2}|\b\d{1,2}\b/g) || [];
      const before = /^\s*до/i.test(win);
      if (t.length >= 2) { from = from || hhmm(t[0]); to = to || hhmm(t[1]); } else if (t.length === 1) { if (before) to = to || hhmm(t[0]); else from = from || hhmm(t[0]); }
    }
    let phone = get(r, 'client_phone');
    if (/^\d{10}$/.test(phone)) phone = '+7' + phone;
    if (/^[78]\d{10}$/.test(phone)) phone = '+7' + phone.slice(1);
    const book = typeof noteFor === 'function' ? noteFor(address) : null;
    const recipient = get(r, 'client_name');
    const m = matchClient(recipient, address, book?.lat, book?.lng);
    return applyClient({
      address,
      _recipient: recipient,
      _cl: m.client ? 'ok' : m.many ? 'many' : recipient ? 'none' : '',
      client_name: recipient || null,
      client_phone: phone || book?.phone || null,
      note: get(r, 'note') || null,
      time_from: from || null,
      time_to: to || null,
      courier: get(r, 'courier'),
      lat: book?.lat ?? null,
      lng: book?.lng ?? null,
    }, m.client);
  }).filter(Boolean);
}
/** Строка клиента под адресом в редакторе: выбор, если на адресе есть клиенты справочника. */
function edClientHtml(s) {
  const at = s.address ? clientsAt(s.address, s.address === s._orig ? s.lat : null, s.lng) : [];
  const cur = s.client_ref && !at.some((c) => c.id === s.client_ref) ? (state.clients || []).find((c) => c.id === s.client_ref) : null;
  const list = cur ? [cur, ...at] : at;
  if (!list.length) return '';
  return `<div class="ed-client${!s.client_ref && list.length > 1 ? ' warn' : ''}">🏪 <select class="input" data-client>
    <option value="">${list.length > 1 ? `— на адресе ${list.length} ${plural(list.length, 'клиент', 'клиента', 'клиентов')}, выберите —` : '— клиент не указан —'}</option>
    ${list.map((c) => `<option value="${esc(c.id)}" ${c.id === s.client_ref ? 'selected' : ''}>${esc(clientTitle(c))}${c.legal_name && c.trade_name ? ` · ${esc(c.legal_name)}` : ''}${c.place ? ` · ${esc(c.place)}` : ''}</option>`).join('')}
  </select></div>`;
}
/** Сколько получателей узнано по справочнику клиентов. */
function clientsSummary(rows) {
  if (state.clientsMissing || !rows.some((r) => r._recipient || r._cl)) return '';
  const ok = rows.filter((r) => r._cl === 'ok').length;
  const none = new Set(rows.filter((r) => r._cl === 'none').map((r) => `${legalTokens(r._recipient).join(' ')}|${addressKey(r.address)}`)).size;
  const many = rows.filter((r) => r._cl === 'many').length;
  if (!ok && !none && !many) return '';
  return `<div class="card imp-cl">🏪 Справочник клиентов: узнано <b>${ok}</b> из ${rows.length}
    ${none ? `<div>Нет в справочнике: <b>${none}</b> ${plural(none, 'получатель', 'получателя', 'получателей')} <button class="btn small" data-x="new-clients">Добавить вывески</button></div>` : ''}
    ${many ? `<div class="small-muted">${many} ${plural(many, 'адрес', 'адреса', 'адресов')} без получателя, а клиентов там несколько — курьер выберет по накладной.</div>` : ''}</div>`;
}
function courierByName(name) {
  const n = String(name || '').trim().toLowerCase();
  if (!n) return null;
  const list = [...state.couriers.values()].filter((c) => c.active);
  return list.find((c) => c.name.toLowerCase() === n)
    || list.find((c) => c.name.toLowerCase().startsWith(n) || n.startsWith(c.name.toLowerCase()))
    || list.find((c) => firstName(c.name).toLowerCase() === n.split(/\s+/)[0])
    || null;
}

function openImportSheet(table, fileName, onRows) {
  const hdr0 = detectHeader(table);
  const st = { hdr: hdr0, map: guessMapping(table, hdr0), date: state.date, busy: false };
  const cols = () => table[0].map((_, k) => (st.hdr >= 0 && table[st.hdr][k] ? table[st.hdr][k] : `Колонка ${k + 1}`));
  const sh = openSheet({ title: 'Заказы из файла', body: '', tall: true, foot: '' });
  function render() {
    const rows = importRows(table, st.hdr, st.map);
    const groups = new Map();
    if (!onRows && st.map.courier != null) rows.forEach((r) => { const k = r.courier || ''; groups.set(k, [...(groups.get(k) || []), r]); });
    const names = cols();
    sh.setBody(`
      <p class="hint" style="margin-top:0">${esc(fileName)} · строк: ${table.length - (st.hdr + 1)}. Проверьте, какая колонка что значит.</p>
      <label class="check"><input type="checkbox" id="imp-hdr" ${st.hdr >= 0 ? 'checked' : ''}> Первая строка — заголовки</label>
      <div class="imp-map">${IMPORT_FIELDS.filter(([f]) => !(onRows && f === 'courier')).map(([f, label]) => `
        <label class="field"><span>${label}</span><select class="input" data-map="${f}">
          <option value="">— нет —</option>
          ${names.map((nm, k) => `<option value="${k}" ${st.map[f] === k ? 'selected' : ''}>${esc(nm)}</option>`).join('')}
        </select></label>`).join('')}</div>
      ${onRows ? '' : `<label class="field"><span>Дата маршрутов</span><input class="input" type="date" id="imp-date" value="${st.date}"></label>`}
      <div class="section-title">Получится · ${rows.length} ${plural(rows.length, 'точка', 'точки', 'точек')}</div>
      ${!onRows && groups.size ? `<div class="card" style="padding:10px 14px">${[...groups].map(([k, g]) => {
        const c = courierByName(k);
        return `<div class="imp-grp"><b>${esc(k || 'Без курьера')}</b> — ${g.length} ${plural(g.length, 'точка', 'точки', 'точек')}${k && !c ? ' <small class="red">курьер не найден — маршрут без курьера</small>' : c ? ` <small>→ ${esc(c.name)}</small>` : ''}</div>`;
      }).join('')}</div>` : ''}
      ${clientsSummary(rows)}
      <div class="card tbl"><table><thead><tr><th>Адрес</th><th>Получатель</th><th>Телефон</th><th>Окно</th><th>Комментарий</th></tr></thead>
        <tbody>${rows.slice(0, 8).map((r) => `<tr><td>${esc(r.address)}</td><td>${r.client_ref ? `🏪 <b>${esc(r.client_name)}</b>${r.client_place ? `<br><small>${esc(r.client_place)}</small>` : ''}` : esc(r.client_name || '')}</td><td>${esc(r.client_phone || '')}</td>
          <td>${r.time_from || r.time_to ? `${esc(r.time_from || '…')}–${esc(r.time_to || '…')}` : ''}</td><td>${esc(r.note || '')}</td></tr>`).join('')}</tbody></table></div>
      ${rows.length > 8 ? `<p class="hint">…и ещё ${rows.length - 8}</p>` : ''}
      ${st.map.address == null ? '<div class="banner" style="margin-top:8px">Выберите колонку с адресом.</div>' : ''}
      <p class="hint">Можно скачать <a href="#" data-act="import-template">шаблон таблицы</a>. Адреса ищутся на карте при сохранении маршрута; адреса из базы адресов — сразу с точкой.</p>`);
    const ok = rows.length && st.map.address != null && !st.busy;
    sh.setFoot(`<button class="btn" data-x="cancel">Отмена</button><button class="btn primary" data-x="go" ${ok ? '' : 'disabled'}>${
      onRows ? `Добавить ${rows.length}` : groups.size > 1 ? `Создать ${groups.size} ${plural(groups.size, 'маршрут', 'маршрута', 'маршрутов')}` : `Создать маршрут`}</button>`);
  }
  sh.el.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'imp-hdr') { st.hdr = t.checked ? Math.max(0, detectHeader(table)) : -1; st.map = guessMapping(table, st.hdr); render(); }
    if (t.dataset.map) { st.map[t.dataset.map] = t.value === '' ? undefined : +t.value; render(); }
    if (t.id === 'imp-date') st.date = t.value || state.date;
  });
  sh.el.addEventListener('click', async (e) => {
    if (e.target.closest('[data-x="new-clients"]')) { openNewRecipients(importRows(table, st.hdr, st.map), render); return; }
    const b = e.target.closest('[data-x]');
    if (!b) return;
    if (b.dataset.x === 'cancel') { sh.close(); return; }
    const rows = importRows(table, st.hdr, st.map).map(({ _recipient, _cl, ...r }) => r);
    if (onRows) { sh.close(); onRows(rows.map(({ courier, ...r }) => r)); return; }
    if (st.map.courier == null) {
      sh.close();
      openEditor(null, { title: fileName.replace(/\.[^.]+$/, ''), route_date: st.date, stops: rows.map(({ courier, ...r }) => ({ ...r, id: uuid(), status: 'pending' })) });
      return;
    }
    // по курьерам — сразу черновики
    st.busy = true; render();
    const groups = new Map();
    rows.forEach((r) => { const k = r.courier || ''; groups.set(k, [...(groups.get(k) || []), r]); });
    const total = rows.filter((r) => r.lat == null).length;
    let k = 0; let made = 0; let missed = 0;
    try {
      for (const [name, g] of groups) {
        const c = courierByName(name);
        for (const r of g) {
          if (r.lat != null) continue;
          k++;
          sh.setFoot(`<span class="hint">Ищу адреса на карте ${k}/${total}…</span>`);
          const p = await geocode(r.address);
          r.lat = p?.lat ?? null; r.lng = p?.lng ?? null;
          if (!p) missed++;
        }
        const route = { id: uuid(), team_id: state.team.id, title: `${c ? firstName(c.name) : name || 'Без курьера'} · ${dateLabel(st.date)}`,
          route_date: st.date, courier_id: c?.id || null, comment: null, status: 'draft' };
        const stops = g.map(({ courier, ...r }, i) => ({ ...r, id: uuid(), seq: i + 1, status: 'pending' }));
        await state.api.saveRoute(route, stops, []);
        made++;
      }
      sh.close();
      state.date = st.date;
      await loadData();
      switchTab('routes');
      toast(`Создано черновиков: ${made}. Проверьте и отправьте курьерам.${missed ? ` Не найдено на карте: ${missed}.` : ''}`, missed ? 'bad' : 'ok', 8000);
    } catch (err) {
      st.busy = false; render();
      toast(errText(err), 'bad', 6000);
    }
  });
  render();
}
actions['import-template'] = () => {
  const csv = '﻿' + ['Адрес;Получатель;Телефон;С;До;Комментарий;Курьер',
    'Тольятти, ул. Ленина, 5;ООО «Ромашка»;+79001234567;10:00;14:00;Домофон 15К;Павел',
    'Тольятти, Приморский б-р, 26;Иванов И.И.;+79007654321;;18:00;Позвонить за 30 минут;'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'shablon_zakazov.csv';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
};

/* ===================================================================
 *  Вкладка «Курьеры»
 * =================================================================== */
function courierSub(c) {
  const st = courierState(c);
  const bits = [COURIER_STATE[st]];
  if (st !== 'disabled') bits.push(rel(c.last_seen));
  if (c.last_battery != null && st !== 'disabled') bits.push(`🔋${c.last_battery}%`);
  return bits.join(' · ');
}

function renderCouriers() {
  const v = $('#view-couriers');
  const order = { online: 0, stale: 1, off: 2, disabled: 3 };
  const all = [...state.couriers.values()].sort((a, b) => order[courierState(a)] - order[courierState(b)] || a.name.localeCompare(b.name));
  // отключённые курьеры не мешают в списке — они в свёрнутом блоке внизу
  const list = all.filter((c) => c.active);
  const disabled = all.filter((c) => !c.active);
  const online = list.filter((c) => courierState(c) === 'online').length;
  v.innerHTML = `<div class="wrap">
    <div class="section-title" style="display:flex;align-items:center;justify-content:space-between;gap:10px">
      <span>Курьеры · ${list.length}${list.length ? ` · на связи ${online}` : ''}</span>
      <button class="btn small" data-act="invite" style="text-transform:none;letter-spacing:0">${icon('userPlus')}Пригласить</button>
    </div>
    ${list.length ? list.map(courierCardHtml).join('') : `<div class="empty"><b>${disabled.length ? 'Активных курьеров нет' : 'Курьеров пока нет'}</b>Отправьте им код подключения. Как только курьер введёт его, он появится здесь.
      <div style="margin-top:16px"><button class="btn primary" data-act="invite">${icon('userPlus')}Пригласить курьера</button></div></div>`}
    ${disabled.length ? `
      <div class="center" style="margin-top:14px"><button class="link-btn" data-act="toggle-disabled" style="color:var(--muted)">
        ${state.showDisabled ? 'Скрыть отключённых' : `Отключённые · ${disabled.length}`}</button></div>
      ${state.showDisabled ? disabled.map(courierCardHtml).join('') : ''}` : ''}
  </div>`;
}
actions['toggle-disabled'] = () => { state.showDisabled = !state.showDisabled; renderCouriers(); };
function courierCardHtml(c) {
    const st = courierState(c);
    const r = activeRouteOf(c.id);
    const k = r ? routeCounts(r) : null;
    return `<div class="card tap ${st === 'disabled' ? 'c-disabled' : ''}" data-act="open-courier" data-id="${c.id}">
        <div class="c-row">
          <div class="avatar">${esc(initials(c.name))}<span class="dot ${st}"></span></div>
          <div class="c-main"><div class="c-name">${esc(c.name)}</div><div class="c-sub">${esc(courierSub(c))}</div>
          ${r ? `<div class="c-sub" style="color:var(--text)">${esc(r.title)} · ${k.done + k.failed}/${k.total}</div>` : ''}</div>
          ${c.phone ? `<a class="icon-btn" href="${telHref(c.phone)}" onclick="event.stopPropagation()" aria-label="Позвонить">${icon('phone')}</a>` : ''}
        </div>
      </div>`;
}
actions['share-code'] = async () => {
  const text = `Подключение к «${state.team.name}»: откройте приложение «Маршруты» → «Работа в команде» и введите код ${state.team.join_code}`;
  try {
    if (navigator.share) { await navigator.share({ text }); return; }
  } catch (e) { if (e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(text); toast('Текст с кодом скопирован', 'ok', 2000); } catch (e) { prompt('Скопируйте текст:', text); }
};
actions['regen-code'] = async () => {
  if (!(await confirmSheet('Сменить код?', 'Старый код перестанет работать. Уже подключённые курьеры останутся в команде.', 'Сменить'))) return;
  try {
    state.team.join_code = await state.api.regenCode(state.team.id);
    renderAll(); toast('Новый код готов', 'ok', 2000);
  } catch (e) { toast(errText(e), 'bad'); }
};

/* ---------- приглашение курьера: код подключения в отдельной шторке ---------- */
function inviteSheetBody() {
  return `
    <div class="card invite" style="margin:0">
      <p>Код для подключения курьеров</p>
      <div class="code">${esc(state.team.join_code)}</div>
      <p style="margin-bottom:12px">Курьер вводит его в приложении «Маршруты» → кнопка с людьми вверху → «Работа в команде».</p>
      <div class="row">
        <button class="btn small primary" data-act="share-code">${icon('share')}Отправить</button>
        <button class="btn small" data-act="regen-code">${icon('refresh')}Новый код</button>
      </div>
    </div>
    <p class="hint" style="margin:12px 2px 0">Один код подходит для всех курьеров. «Новый код» отключает старый — уже подключённые курьеры останутся в команде.</p>`;
}
actions.invite = () => {
  const sh = openSheet({ title: 'Пригласить курьера', body: inviteSheetBody() });
  sh.refresh = () => sh.setBody(inviteSheetBody());
  sheetRefreshers.add(sh.refresh);
};

function courierSheetBody(c) {
  const st = courierState(c);
  const routes = [...state.routes.values()].filter((r) => r.courier_id === c.id && (r.route_date === dateStr() || ['sent', 'accepted', 'in_progress'].includes(r.status)));
  const speed = c.last_speed != null && st === 'online' ? `${Math.round(c.last_speed * 3.6)} км/ч` : '—';
  return `
    <div class="c-row" style="margin-bottom:12px">
      <div class="avatar" style="width:54px;height:54px;font-size:18px">${esc(initials(c.name))}<span class="dot ${st}"></span></div>
      <div class="c-main"><div class="c-name" style="font-size:18px">${esc(c.name)}</div><div class="c-sub">${esc(COURIER_STATE[st])}</div></div>
    </div>
    <div class="actions">
      ${c.phone ? `<a class="btn small primary" href="${telHref(c.phone)}">${icon('phone')}Позвонить</a>` : ''}
      ${c.last_lat != null ? `<button class="btn small" data-act="courier-map" data-id="${c.id}">${icon('pin')}На карте</button>` : ''}
      <button class="btn small" data-act="courier-track" data-id="${c.id}">${icon('route')}Трек и маршрут на карте</button>
    </div>
    <div class="card"><dl class="kv">
      <dt>Телефон</dt><dd>${c.phone ? esc(c.phone) : '—'}</dd>
      <dt>Связь</dt><dd>${esc(rel(c.last_seen))}</dd>
      <dt>Батарея</dt><dd>${c.last_battery != null ? c.last_battery + '%' : '—'}</dd>
      <dt>Скорость</dt><dd>${speed}</dd>
      <dt>Точность</dt><dd>${c.last_accuracy != null ? `±${Math.round(c.last_accuracy)} м` : '—'}</dd>
      <dt>Приложение</dt><dd>${c.app_version ? esc(c.app_version) : '—'}</dd>
    </dl></div>
    <div class="section-title">Маршруты</div>
    ${routes.length ? routes.map(routeCardHtml).join('') : '<div class="card small-muted">Сегодня маршрутов нет</div>'}
    <div class="section-title">Управление</div>
    <div class="card">
      <label class="field"><span>Имя</span>
        <div class="row"><input class="input" id="c-name" value="${esc(c.name)}"><button class="btn" style="flex:none" data-act="courier-rename" data-id="${c.id}">Сохранить</button></div>
      </label>
      <button class="btn block ${c.active ? 'danger' : ''}" data-act="courier-toggle" data-id="${c.id}">${c.active ? 'Отключить курьера' : 'Включить курьера'}</button>
      <p class="hint" style="margin:8px 0 0">${c.active ? 'Отключённый курьер не получает маршруты, не передаёт геопозицию и скрывается из списка.' : 'Курьер скрыт из списка. Его можно включить обратно или удалить совсем.'}</p>
      ${c.active ? '' : `<button class="btn block danger" style="margin-top:10px" data-act="courier-delete" data-id="${c.id}">${icon('trash')}Удалить навсегда</button>`}
    </div>`;
}
function openCourierSheet(id) {
  const c = state.couriers.get(id);
  if (!c) return;
  const sh = openSheet({ title: 'Курьер', body: courierSheetBody(c), tall: true });
  sh.refresh = () => {
    const cur = state.couriers.get(id);
    if (!cur) { sh.close(); return; }
    if (document.activeElement?.id === 'c-name') return; // не мешаем редактировать имя
    sh.setBody(courierSheetBody(cur));
  };
  sheetRefreshers.add(sh.refresh);
}
actions['open-courier'] = (el) => openCourierSheet(el.dataset.id);
actions['courier-rename'] = async (el) => {
  const name = $('#c-name').value.trim();
  if (!name) return;
  document.activeElement?.blur();
  await runWrite(() => state.api.updateCourier(el.dataset.id, { name }), 'Имя сохранено');
};
actions['courier-toggle'] = async (el) => {
  const c = state.couriers.get(el.dataset.id);
  if (c.active && !(await confirmSheet('Отключить курьера?', `${c.name} пропадёт из списка и перестанет получать маршруты. Его маршруты в работе вернутся в черновики — их можно отправить другому курьеру. Включить обратно можно в любой момент.`, 'Отключить', true))) return;
  const wasActive = c.active;
  const ok = await runWrite(async () => {
    await state.api.updateCourier(c.id, { active: !wasActive, on_shift: false });
    if (wasActive) await state.api.recallCourierRoutes(c.id);
  }, wasActive ? 'Курьер отключён' : 'Курьер снова в работе');
  if (ok && wasActive) closeAllSheets();
};
actions['courier-delete'] = async (el) => {
  const c = state.couriers.get(el.dataset.id);
  if (!(await confirmSheet('Удалить курьера?', `${c.name} будет удалён вместе с треками. Маршруты останутся, но без курьера. Если он снова введёт код, то появится как новый.`, 'Удалить', true))) return;
  closeAllSheets();
  await runWrite(async () => {
    await state.api.recallCourierRoutes(c.id);
    await state.api.deleteCourier(c.id);
  }, 'Курьер удалён');
};
actions['courier-map'] = (el) => {
  const c = state.couriers.get(el.dataset.id);
  closeAllSheets(); switchTab('map');
  setTimeout(() => { if (mapCtx.map && c?.last_lat != null) mapCtx.map.setView([c.last_lat, c.last_lng], 16); }, 80);
};
actions['courier-track'] = async (el) => {
  const id = el.dataset.id;
  closeAllSheets(); switchTab('map');
  await loadTracks();
  setTimeout(() => fitCourier(id), 80);
};

/* ===================================================================
 *  Вкладка «Ещё»
 * =================================================================== */
/* ===================================================================
 *  Вкладка «Отчёт»: план / факт
 * =================================================================== */
const PERIODS = [['today', 'Сегодня'], ['yesterday', 'Вчера'], ['week', '7 дней'], ['month', '30 дней'], ['custom', 'Период']];
function periodRange(p) {
  const t = dateStr();
  if (p === 'today') return [t, t];
  if (p === 'yesterday') return [addDays(t, -1), addDays(t, -1)];
  if (p === 'week') return [addDays(t, -6), t];
  if (p === 'month') return [addDays(t, -29), t];
  return [state.report.from, state.report.to];
}
async function loadReport() {
  const rp = state.report;
  const [from, to] = periodRange(rp.period);
  rp.from = from; rp.to = to;
  if (to < from) { rp.error = 'Дата «по» раньше даты «с»'; renderReport(); return; }
  rp.loading = true; rp.error = ''; renderReport();
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow';
    rp.rows = await state.api.report(state.team.id, from, to, tz);
  } catch (e) {
    rp.rows = null;
    rp.error = /bad_period/.test(e.message) ? 'Слишком длинный период — не больше 3 месяцев' : errText(e);
  }
  rp.loading = false;
  renderReport();
}
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—');
const num = (v, d = 0) => (v == null || Number.isNaN(+v) ? '—' : (+v).toFixed(d).replace('.', ','));
function hm(min) {
  if (min == null) return '—';
  const m = Math.round(Math.abs(min));
  return `${min < 0 ? '−' : ''}${Math.floor(m / 60)}:${pad2(m % 60)}`;
}
function sumRows(rows) {
  const t = { routes: rows.length, total: 0, done: 0, failed: 0, pending: 0, onTime: 0, late: 0, noDl: 0, lateMin: 0,
    planKm: 0, factKm: 0, kmPairs: 0, planMin: 0, factMin: 0, minPairs: 0, finishDev: [], reasons: {},
    kmPlan: 0, kmPlanN: 0, kmFact: 0, kmFactN: 0, minPlan: 0, minPlanN: 0, minFact: 0, minFactN: 0, checked: false, far: 0, remarks: 0, unconf: 0, left: 0 };
  rows.forEach((r) => {
    t.total += r.stops_total; t.done += r.stops_done; t.failed += r.stops_failed; t.pending += r.stops_pending;
    t.onTime += r.on_time; t.late += r.late; t.noDl += r.no_deadline;
    if (r.late && r.late_minutes_avg != null) t.lateMin += r.late * +r.late_minutes_avg;
    // маршрут, отправленный уже выполненным, длится 0 минут — такой «факт» не считаем
    const factMin = r.fact_minutes != null && +r.fact_minutes >= 1 ? +r.fact_minutes : null;
    const factKm = r.fact_km != null && factMin != null ? +r.fact_km : r.fact_km != null && +r.fact_km > 0 ? +r.fact_km : null;
    if (r.plan_km != null) { t.kmPlan += +r.plan_km; t.kmPlanN++; }
    if (factKm != null) { t.kmFact += factKm; t.kmFactN++; }
    if (r.plan_minutes != null) { t.minPlan += +r.plan_minutes; t.minPlanN++; }
    if (factMin != null) { t.minFact += factMin; t.minFactN++; }
    if (r.plan_km != null && factKm != null) { t.planKm += +r.plan_km; t.factKm += factKm; t.kmPairs++; }
    if (r.plan_minutes != null && factMin != null) { t.planMin += +r.plan_minutes; t.factMin += factMin; t.minPairs++; }
    if (r.plan_finish && r.fact_finish) t.finishDev.push((Date.parse(r.fact_finish) - Date.parse(r.plan_finish)) / 60000);
    Object.entries(r.fail_reasons || {}).forEach(([k, n]) => { t.reasons[k] = (t.reasons[k] || 0) + n; });
    if (r.far_marks != null) { t.checked = true; t.far += +r.far_marks; t.remarks += +r.remarks || 0; t.unconf += +r.unconfirmed || 0; t.left += +r.left_unmarked || 0; }
  });
  t.lateAvg = t.late ? t.lateMin / t.late : null;
  t.finishAvg = t.finishDev.length ? t.finishDev.reduce((a, b) => a + b, 0) / t.finishDev.length : null;
  return t;
}
function renderReport() {
  const v = $('#view-report');
  if (!v) return;
  const rp = state.report;
  if (rp.rows == null && !rp.loading && !rp.error) { loadReport(); return; }
  const all = rp.rows || [];
  const rows = rp.courier ? all.filter((r) => r.courier_id === rp.courier) : all;
  const t = sumRows(rows);
  const couriersInRows = [...new Map(all.filter((r) => r.courier_id).map((r) => [r.courier_id, r.courier_name || 'Курьер'])).entries()];
  const byCourier = couriersInRows.map(([id, name]) => [id, name, sumRows(all.filter((r) => r.courier_id === id))])
    .filter(([id]) => !rp.courier || id === rp.courier);
  const deadlineCnt = t.onTime + t.late;
  const kmDev = t.kmPairs ? t.factKm - t.planKm : null;
  const minDev = t.minPairs ? t.factMin - t.planMin : null;
  const reasons = Object.entries(t.reasons).sort((a, b) => b[1] - a[1]);

  v.innerHTML = `<div class="wrap">
    <div class="seg">${PERIODS.map(([k, l]) => `<button class="${rp.period === k ? 'on' : ''}" data-act="rep-period" data-p="${k}">${l}</button>`).join('')}</div>
    ${rp.period === 'custom' ? `<div class="row" style="margin-bottom:10px">
      <label class="field" style="margin:0"><span>с</span><input class="input" type="date" id="rep-from" value="${rp.from}"></label>
      <label class="field" style="margin:0"><span>по</span><input class="input" type="date" id="rep-to" value="${rp.to}"></label></div>` : ''}
    <div class="row" style="margin-bottom:12px;align-items:center">
      <select class="input" id="rep-courier" style="flex:1"><option value="">Все курьеры</option>
        ${couriersInRows.map(([id, name]) => `<option value="${id}" ${rp.courier === id ? 'selected' : ''}>${esc(name)}</option>`).join('')}</select>
      <button class="btn" style="flex:none" data-act="rep-csv" ${rows.length ? '' : 'disabled'}>${icon('download')}Excel</button>
    </div>
    ${rp.loading ? '<div class="empty"><div class="spinner dark" style="margin:0 auto"></div></div>' : ''}
    ${rp.error ? `<div class="banner offline">${esc(rp.error)}</div>` : ''}
    ${!rp.loading && !rp.error && !rows.length ? '<div class="empty"><b>За этот период маршрутов нет</b>Выберите другой период.</div>' : ''}
    ${!rp.loading && rows.length ? `
    <div class="kpis">
      <div class="kpi"><span>Точки</span><b>${t.done} из ${t.total}</b><small>выполнено ${pct(t.done, t.total)}${t.pending ? ` · не отмечено ${t.pending}` : ''}</small></div>
      <div class="kpi ${!deadlineCnt ? '' : t.late / deadlineCnt > 0.2 ? 'bad' : 'good'}"><span>Вовремя</span><b>${pct(t.onTime, deadlineCnt)}</b><small>${t.onTime} вовремя · ${t.late} с опозданием${t.lateAvg != null ? `, в среднем +${hm(t.lateAvg)}` : ''}</small></div>
      <div class="kpi ${t.failed ? 'bad' : ''}"><span>Не доставлено</span><b>${t.failed}</b><small>${pct(t.failed, t.total)} от всех точек</small></div>
      ${t.checked ? `<div class="kpi ${t.unconf || t.left ? 'bad' : t.far || t.remarks ? '' : 'good'}"><span>Проверка отметок</span><b>${t.unconf + t.left}</b><small>не у адреса ${t.unconf} · уехал без отметки ${t.left} · переотмечено ${t.remarks}${t.far ? ` · последняя отметка далеко ${t.far}` : ''}</small></div>` : ''}
      <div class="kpi"><span>Пробег, км</span><b>${t.kmFactN ? num(t.kmFact, 1) : '—'} <i>/ ${t.kmPlanN ? num(t.kmPlan, 1) : '—'}</i></b><small>факт / план${kmDev != null ? ` · ${kmDev >= 0 ? '+' : '−'}${num(Math.abs(kmDev), 1)} км` : !t.kmFactN && !t.kmPlanN ? ' · нет данных' : ''}</small></div>
      <div class="kpi"><span>Время в пути</span><b>${hm(t.minFactN ? t.minFact : null)} <i>/ ${hm(t.minPlanN ? t.minPlan : null)}</i></b><small>факт / план${minDev != null ? ` · ${minDev >= 0 ? '+' : '−'}${hm(Math.abs(minDev))}` : !t.minFactN && !t.minPlanN ? ' · нет данных' : ''}</small></div>
      <div class="kpi"><span>Завершение</span><b>${t.finishAvg == null ? '—' : `${t.finishAvg >= 0 ? '+' : '−'}${hm(Math.abs(t.finishAvg))}`}</b><small>в среднем относительно плана</small></div>
    </div>
    ${!rp.courier && byCourier.length > 1 ? `<div class="section-title">По курьерам</div>
    <div class="card tbl"><table>
      <thead><tr><th>Курьер</th><th>Маршр.</th><th>Точки</th><th>Вовремя</th><th>Опозд.</th><th>Не дост.</th><th>Км факт / план</th></tr></thead>
      <tbody>${byCourier.map(([id, name, c]) => `<tr data-act="rep-courier" data-id="${id}">
        <td><span class="cdot" style="background:${courierColor(id)}"></span>${esc(name)}</td><td>${c.routes}</td><td>${c.done}/${c.total}</td>
        <td>${pct(c.onTime, c.onTime + c.late)}</td><td>${c.late}${c.lateAvg != null ? ` <small>+${hm(c.lateAvg)}</small>` : ''}</td>
        <td>${c.failed}</td><td>${c.kmFactN ? num(c.kmFact, 1) : '—'} / ${c.kmPlanN ? num(c.kmPlan, 1) : '—'}</td></tr>`).join('')}</tbody></table></div>` : ''}
    ${reasons.length ? `<div class="section-title">Причины «не доставлено»</div>
    <div class="card">${reasons.map(([k, n]) => `<div class="reason"><span>${esc(k)}</span><b>${n}</b></div>`).join('')}</div>` : ''}
    <div class="section-title">Маршруты · ${rows.length}</div>
    <div class="card tbl"><table>
      <thead><tr><th>Дата</th><th>Маршрут</th><th>Курьер</th><th>Точки</th><th>Вовремя</th><th>Км факт / план</th><th>Время факт / план</th><th>Финиш план → факт</th></tr></thead>
      <tbody>${rows.map((r) => `<tr data-act="rep-route" data-id="${r.route_id}">
        <td>${esc(dateLabel(r.route_date))}</td><td>${esc(r.title)}</td><td>${esc(r.courier_name || '—')}</td>
        <td>${r.stops_done}/${r.stops_total}${r.stops_failed ? ` <small class="red">−${r.stops_failed}</small>` : ''}${r.far_marks ? ` <small class="red" title="Отмечено далеко от адреса">⚠${r.far_marks}</small>` : ''}${r.remarks ? ` <small class="red" title="Переотмечено">↺${r.remarks}</small>` : ''}${r.unconfirmed ? ` <small class="red" title="Отмечено не у адреса">?${r.unconfirmed}</small>` : ''}${r.left_unmarked ? ` <small class="red" title="Уехал без отметки">⇥${r.left_unmarked}</small>` : ''}</td>
        <td>${pct(r.on_time, r.on_time + r.late)}${r.late ? ` <small class="red">${r.late} опозд.</small>` : ''}</td>
        <td>${num(r.fact_km, 1)} / ${num(r.plan_km, 1)}</td>
        <td>${hm(r.fact_minutes != null && +r.fact_minutes >= 1 ? r.fact_minutes : null)} / ${hm(r.plan_minutes)}</td>
        <td>${r.plan_finish ? timeOf(r.plan_finish) : '—'} → ${r.fact_finish ? timeOf(r.fact_finish) : '—'}</td></tr>`).join('')}</tbody></table></div>
    <p class="hint" style="margin-top:10px">«Вовремя» — первая отметка «доставлено», сделанная у адреса (по месту отметки или по треку ±15 минут), не позже окна «до», а если окна нет — не позже плана курьера + 15 минут.
      План — первый расчёт маршрута в приложении курьера. Факт км — по треку.
      Нажмите на маршрут прошлого дня — откроется карта за тот день.
      «Проверка отметок»: ⚠ — точку отметили дальше ${FAR_METERS} м от адреса, ↺ — отметку снимали и ставили заново.</p>` : ''}
  </div>`;
  const f = $('#rep-from'); const tt = $('#rep-to');
  if (f) f.onchange = () => { rp.from = f.value; loadReport(); };
  if (tt) tt.onchange = () => { rp.to = tt.value; loadReport(); };
  $('#rep-courier').onchange = (e) => { rp.courier = e.target.value; renderReport(); };
}
actions['rep-period'] = (el) => { state.report.period = el.dataset.p; loadReport(); };
actions['rep-courier'] = (el) => { state.report.courier = el.dataset.id; renderReport(); };
actions['rep-route'] = (el) => {
  const row = (state.report.rows || []).find((x) => x.route_id === el.dataset.id);
  if (row && row.route_date < dateStr()) { openHistory(row.route_date, row.route_id); return; }
  if (state.routes.has(el.dataset.id)) openRouteSheet(el.dataset.id);
  else toast('Маршрут за другой день — откройте его во вкладке «Маршруты»', 'info');
};
actions['rep-csv'] = () => {
  const rp = state.report;
  const rows = (rp.rows || []).filter((r) => !rp.courier || r.courier_id === rp.courier);
  const head = ['Дата', 'Маршрут', 'Курьер', 'Статус', 'Точек', 'Выполнено', 'Не доставлено', 'Не отмечено', 'Вовремя', 'С опозданием',
    'Без срока', 'Среднее опоздание, мин', 'Км план', 'Км факт', 'Время план, мин', 'Время факт, мин', 'Финиш план', 'Финиш факт', 'Причины',
    'Отмечено далеко от адреса', 'Переотмечено', 'Отмечено не у адреса', 'Уехал без отметки'];
  const cell = (v) => { const x = v == null ? '' : String(v); return /[";\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x; };
  const dt = (ts) => (ts ? `${dateStr(new Date(ts))} ${timeOf(ts)}` : '');
  const lines = [head, ...rows.map((r) => [r.route_date, r.title, r.courier_name, STATUS[r.status] || r.status, r.stops_total, r.stops_done,
    r.stops_failed, r.stops_pending, r.on_time, r.late, r.no_deadline, r.late_minutes_avg,
    r.plan_km == null ? '' : num(r.plan_km, 1), r.fact_km == null ? '' : num(r.fact_km, 1),
    r.plan_minutes, r.fact_minutes, dt(r.plan_finish), dt(r.fact_finish),
    Object.entries(r.fail_reasons || {}).map(([k, n]) => `${k}: ${n}`).join(', '), r.far_marks, r.remarks, r.unconfirmed, r.left_unmarked])];
  const csv = '﻿' + lines.map((l) => l.map(cell).join(';')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `otchet_${rp.from}_${rp.to}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
};

function renderMore() {
  const v = $('#view-more');
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  v.innerHTML = `<div class="wrap">
    <div class="section-title">Команда</div>
    <div class="card"><div class="set-pad">
      <label class="field"><span>Название</span>
        <div class="row"><input class="input" id="set-team" value="${esc(state.team.name)}"><button class="btn" style="flex:none" data-act="save-team">Сохранить</button></div>
      </label>
      <div class="small-muted">Код для второго диспетчера</div>
      <div class="row" style="align-items:center;margin-top:4px">
        <b class="mono" style="font-size:18px">${esc(state.team.dispatcher_code || '—')}</b>
        <button class="btn small" style="flex:none" data-act="copy" data-text="${esc(state.team.dispatcher_code || '')}">${icon('copy')}Копировать</button>
      </div>
      <p class="hint" style="margin:8px 0 0">Второй диспетчер регистрируется и вводит этот код — видит тех же курьеров и маршруты.</p>
    </div></div>

    <div class="section-title">Клиенты</div>
    <div class="card"><div class="set-row"><div class="sr-main"><b>Справочник клиентов${state.clients ? ` · ${state.clients.length}` : ''}</b>
      <div class="sr-sub">${state.clientsMissing ? 'Выполните в Supabase файл 012_clients.sql.' : 'Юридическое название из накладной → вывеска и адрес. Курьеры «Маршрутов Про» видят вывеску и выбирают клиента по накладной.'}</div></div>
      <button class="btn small primary" data-act="clients-open">Открыть</button></div></div>

    <div class="section-title">База адресов</div>
    <div class="card"><div class="set-row"><div class="sr-main"><b>Заметки к адресам${state.notes ? ` · ${state.notes.length}` : ''}</b>
      <div class="sr-sub">${state.notesMissing ? 'Выполните в Supabase файл 011_address_notes.sql.' : 'Коды домофонов, входы, телефоны и фото подъездов от курьеров «Маршрутов Про» — общие для всей команды.'}</div></div>
      <button class="btn small primary" data-act="notes-open">Открыть</button></div></div>

    <div class="section-title">Поиск адресов</div>
    <div class="card"><div class="set-pad">
      <label class="field"><span>Город по умолчанию</span><input class="input" id="set-city" value="${esc(settings.city)}" placeholder="Например: Самара"></label>
      <p class="hint">Адреса ищутся на карте OpenStreetMap. С городом по умолчанию их можно писать без города.</p>
      <button class="btn block" data-act="save-geo">Сохранить</button>
    </div></div>

    <div class="section-title">Приложение</div>
    <div class="card">
      ${standalone ? '' : `<div class="set-row"><div class="sr-main"><b>Установить на телефон</b><div class="sr-sub">${isIOS
    ? 'В Safari нажмите «Поделиться» → «На экран „Домой“».'
    : state.installEvt ? 'Иконка появится рядом с другими приложениями.' : 'Меню браузера (⋮) → «Установить приложение» или «Добавить на главный экран».'}</div></div>
        ${state.installEvt ? '<button class="btn small primary" data-act="install">Установить</button>' : ''}</div>`}
      <div class="set-row"><div class="sr-main"><b>Уведомления</b><div class="sr-sub">Звук и сообщение, когда курьер постоял у адреса и уехал без отметки.${!settings.notify ? ' Сейчас — только звук и сообщение внутри открытой диспетчерской.' : state.pushOk ? ' <b class="green">Включены на этом устройстве — придут, даже когда диспетчерская закрыта.</b> <a href="#" data-act="notify-test">Проверить</a>' : ' Включены, но только пока диспетчерская открыта на экране.'}</div></div>
        ${settings.notify ? '<button class="btn small" data-act="notify-off">Выключить</button>' : '<button class="btn small primary" data-act="notify-on">Включить</button>'}</div>
      <div class="set-row"><div class="sr-main"><b>Сервер</b><div class="sr-sub">${state.api.kind === 'demo' ? 'Демо-режим, данные в памяти телефона' : esc(settings.supabaseUrl)}</div></div>
        <button class="btn small" data-act="reset-conn">${state.api.kind === 'demo' ? 'Подключить' : 'Сменить'}</button></div>
      <div class="set-row"><div class="sr-main"><b>Аккаунт</b><div class="sr-sub">${esc(state.email)}</div></div>
        <button class="btn small danger" data-act="logout">Выйти</button></div>
      <div class="set-row"><div class="sr-main"><b>Версия</b><div class="sr-sub">${APP_VERSION}</div></div>
        <button class="btn small" data-act="reload">${icon('refresh')}Обновить</button></div>
    </div>
    <p class="small-muted center" style="margin-top:16px">Карта © участники OpenStreetMap</p>
  </div>`;
}
actions['save-team'] = async () => {
  const name = $('#set-team').value.trim();
  if (!name) return;
  try {
    state.team = await state.api.updateTeam(state.team.id, { name });
    $('#team-name').textContent = state.team.name;
    toast('Название сохранено', 'ok', 2000);
  } catch (e) { toast(errText(e), 'bad'); }
};
actions['save-geo'] = () => {
  settings.city = $('#set-city').value.trim();
  saveSettings();
  toast('Сохранено', 'ok', 2000);
};
actions.copy = async (el) => {
  try { await navigator.clipboard.writeText(el.dataset.text); toast('Скопировано', 'ok', 1500); } catch (e) { prompt('Скопируйте:', el.dataset.text); }
};
actions.install = async () => {
  if (!state.installEvt) return;
  state.installEvt.prompt();
  await state.installEvt.userChoice.catch(() => {});
  state.installEvt = null;
  renderMore();
};
actions.reload = () => location.reload();
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); state.installEvt = e; if (state.tab === 'more' && $('#view-more')) renderMore(); });

/* ===================================================================
 *  Карта (Leaflet + OpenStreetMap)
 * =================================================================== */
const mapCtx = { map: null, loading: null, failed: false, courierLayer: null, routeLayer: null, trackLayer: null, markers: new Map(), fitted: false };

function ensureMap() {
  if (mapCtx.map) { setTimeout(() => mapCtx.map.invalidateSize(), 50); loadTracks(); return; }
  if (mapCtx.loading || mapCtx.failed) return;
  mapCtx.loading = Promise.all([loadCss(CDN.leafletCss).catch(() => {}), loadScript(CDN.leafletJs)])
    .then(() => {
      const center = store('dm.mapView') || { lat: 55.751, lng: 37.618, z: 11 };
      const map = L.map('map', { zoomControl: false, attributionControl: true }).setView([center.lat, center.lng], center.z);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '© OpenStreetMap',
      }).addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      map.attributionControl.setPrefix(false);
      mapCtx.trackLayer = L.layerGroup().addTo(map);
      mapCtx.routeLayer = L.layerGroup().addTo(map);
      mapCtx.courierLayer = L.layerGroup().addTo(map);
      map.on('moveend', () => { const c = map.getCenter(); store('dm.mapView', { lat: c.lat, lng: c.lng, z: map.getZoom() }); });
      mapCtx.map = map;
      drawMap();
      loadTracks();
    })
    .catch(() => {
      mapCtx.failed = true;
      $('#map').innerHTML = '<div class="map-fallback"><div><b>Карта не загрузилась</b><br>Проверьте интернет и нажмите «Обновить» во вкладке «Ещё». Остальные вкладки работают.</div></div>';
    });
}

/* ---------- цвета курьеров: у каждого свой, точки и трек — его цветом ---------- */
const COURIER_COLORS = ['#2F6FED', '#8B5CF6', '#0891B2', '#DB2777', '#4F46E5', '#B45309', '#9333EA', '#0369A1', '#C026D3', '#475569'];
function courierColor(id) {
  const ids = [...state.couriers.values()]
    .sort((a, b) => ((a.created_at || '') < (b.created_at || '') ? -1 : 1))
    .map((c) => c.id);
  const i = Math.max(0, ids.indexOf(id));
  return COURIER_COLORS[i % COURIER_COLORS.length];
}

/* ---------- маршруты на карте: всё, что в работе, и завершённые сегодня ---------- */
function mapRoutes() {
  const today = dateStr();
  return [...state.routes.values()].filter((r) => r.courier_id && state.couriers.get(r.courier_id)?.active
    && (['sent', 'accepted', 'in_progress'].includes(r.status) || (r.status === 'done' && r.route_date === today)));
}

/* ---------- прогноз: успевает / опаздывает ----------
 * 1) Прогноз из приложения курьера (по реальным дорогам, с пробками и разгрузкой) — если он свежий.
 * 2) Иначе оценка: короткие отрезки — городская скорость (фактическая скорость курьера по треку,
 *    иначе 25 км/ч), длинные за городом — 65 км/ч; на точке 10 минут.
 */
const CITY_KMH = 25;
const ROAD_KMH = 65;
const CITY_KM = 10; // первые 10 км отрезка — как по городу, дальше — как по трассе
const ROAD_K = 1.3; // дорога длиннее прямой
const STOP_MIN = 10;
const ETA_FRESH_MIN = 30; // прогноз курьера старше 30 минут не используем
function atTime(hhmm, day) {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm || '');
  if (!m) return null;
  const d = parseDate(day || dateStr());
  d.setHours(+m[1], +m[2], 0, 0);
  return d.getTime();
}
/** Городская скорость курьера по треку за последние 2 часа (медиана скоростей в движении), км/ч. */
function courierCityKmh(id) {
  const pts = tracks.get(id)?.points || [];
  const since = Date.now() - 2 * 3600000;
  const v = pts.filter((p) => p.speed != null && p.speed > 2 && Date.parse(p.recorded_at) > since).map((p) => p.speed * 3.6);
  if (v.length < 10) return CITY_KMH;
  v.sort((a, b) => a - b);
  return Math.min(50, Math.max(15, v[Math.floor(v.length / 2)]));
}
function legMs(km, cityKmh) {
  const city = Math.min(km, CITY_KM);
  const road = Math.max(0, km - CITY_KM);
  return (city / cityKmh + road / ROAD_KMH) * 3600000;
}
/** Порядок объезда, как у курьера: закрытые — по времени отметки, дальше — по его прогнозу прибытия
 *  (курьер мог переоптимизировать маршрут у себя), без прогноза — в порядке маршрута. */
function courierOrder(r) {
  const now = Date.now();
  const fresh = (s) => s.eta && s.eta_at && now - Date.parse(s.eta_at) < ETA_FRESH_MIN * 60000;
  const stops = r.stops || [];
  const closed = stops.filter((s) => s.status !== 'pending')
    .sort((a, b) => (Date.parse(a.done_at || 0) || 0) - (Date.parse(b.done_at || 0) || 0) || a.seq - b.seq);
  const pending = stops.filter((s) => s.status === 'pending');
  const withEta = pending.filter(fresh).sort((a, b) => Date.parse(a.eta) - Date.parse(b.eta));
  const noEta = pending.filter((s) => !fresh(s)).sort((a, b) => a.seq - b.seq);
  return [...closed, ...withEta, ...noEta];
}
/** Map id точки → { st: 'done' | 'failed' | 'ok' | 'late', eta, src: 'courier' | 'estimate' } */
function routeForecast(r) {
  const out = new Map();
  const stops = courierOrder(r);
  const now = Date.now();
  const isFuture = r.route_date > dateStr();
  const c = state.couriers.get(r.courier_id);
  const cityKmh = courierCityKmh(r.courier_id);
  let pos = null;
  if (c?.last_lat != null && c.last_seen && now - Date.parse(c.last_seen) < 20 * 60000) pos = { lat: c.last_lat, lng: c.last_lng };
  if (!pos) {
    const last = [...stops].reverse().find((s) => s.status !== 'pending' && (s.done_lat ?? s.lat) != null);
    if (last) pos = { lat: last.done_lat ?? last.lat, lng: last.done_lng ?? last.lng };
  }
  let t = now;
  let first = true;
  stops.forEach((s) => {
    if (s.status === 'done' || s.status === 'failed') { out.set(s.id, { st: s.status }); return; }
    let eta = null;
    let src = 'estimate';
    const fresh = s.eta && s.eta_at && now - Date.parse(s.eta_at) < ETA_FRESH_MIN * 60000;
    if (!isFuture && fresh) {
      eta = Math.max(Date.parse(s.eta), now);
      src = 'courier';
      t = eta;
      if (s.lat != null) pos = { lat: s.lat, lng: s.lng };
      first = false;
    } else if (!isFuture && pos && s.lat != null) {
      if (!first) t += STOP_MIN * 60000;
      t += legMs((distM(pos, s) * ROAD_K) / 1000, cityKmh);
      const from = atTime(s.time_from, r.route_date);
      if (from && t < from) t = from; // приехал раньше окна — ждёт
      pos = { lat: s.lat, lng: s.lng };
      first = false;
      eta = t;
    }
    const to = atTime(s.time_to, r.route_date);
    const late = !isFuture && to != null && (now > to || (eta != null && eta > to));
    out.set(s.id, { st: late ? 'late' : 'ok', eta, src });
  });
  return out;
}

/* ---------- треки курьеров за сегодня (подгружаются частями) ---------- */
const tracks = new Map(); // id курьера → { day, points: [{lat,lng,recorded_at}] }
let tracksBusy = false;
async function loadTracks() {
  if (!state.api || !state.team || tracksBusy || hist.day) return;
  tracksBusy = true;
  try {
    const day = dateStr();
    const ids = new Set(mapRoutes().map((r) => r.courier_id));
    state.couriers.forEach((c) => { if (c.active && (c.on_shift || ids.has(c.id))) ids.add(c.id); });
    const start = parseDate(day).toISOString();
    for (const id of ids) {
      let t = tracks.get(id);
      if (!t || t.day !== day) { t = { day, points: [] }; tracks.set(id, t); }
      const last = t.points.length ? t.points[t.points.length - 1].recorded_at : start;
      const pts = await state.api.track(id, last, new Date().toISOString());
      const lastMs = Date.parse(last);
      const fresh = t.points.length ? pts.filter((p) => Date.parse(p.recorded_at) > lastMs) : pts;
      if (fresh.length) t.points.push(...fresh);
    }
    drawMap();
  } catch (e) { /* нет связи — попробуем в следующий раз */ }
  tracksBusy = false;
}
setInterval(() => { if (state.tab === 'map' && document.visibilityState === 'visible') loadTracks(); }, 30000);

/* ---------- рисование ---------- */
function courierIconHtml(c) {
  const st = courierState(c);
  return `<div class="cmark ${st}"><div class="cm-dot" style="background:${courierColor(c.id)}">${esc(initials(c.name))}</div><div class="cm-name">${esc(firstName(c.name))}</div></div>`;
}
const STOP_TEXT = { done: 'выполнено', failed: 'не доставлено', ok: 'успевает', late: 'опаздывает' };

function drawMap() {
  renderMapDay();
  if (!mapCtx.map || !window.L) return;
  if (hist.day) { drawHistory(); return; }
  const routes = mapRoutes();

  // треки: пройденный путь цветом курьера
  mapCtx.trackLayer.clearLayers();
  tracks.forEach((t, id) => {
    const c = state.couriers.get(id);
    if (!c || !c.active || t.day !== dateStr()) return;
    const ll = t.points.map((p) => [p.lat, p.lng]);
    if (c.last_lat != null && c.on_shift) ll.push([c.last_lat, c.last_lng]); // до текущей точки
    if (ll.length > 1) {
      let m = 0;
      for (let i = 1; i < ll.length; i++) m += distM({ lat: ll[i - 1][0], lng: ll[i - 1][1] }, { lat: ll[i][0], lng: ll[i][1] });
      L.polyline(ll, { color: courierColor(id), weight: 5, opacity: 0.75, lineJoin: 'round' })
        .bindPopup(`<b>${esc(firstName(c.name))}</b><br>Пройденный путь за сегодня · ${fmtDist(m)}`)
        .addTo(mapCtx.trackLayer);
    }
  });

  // точки маршрутов: круг цвета курьера, кольцо — статус
  mapCtx.routeLayer.clearLayers();
  routes.forEach((r) => {
    const c = state.couriers.get(r.courier_id);
    const color = courierColor(r.courier_id);
    const fc = routeForecast(r);
    const stops = courierOrder(r);
    // впереди — пунктиром от курьера через оставшиеся точки
    const ahead = stops.filter((s) => s.status === 'pending' && s.lat != null).map((s) => [s.lat, s.lng]);
    if (ahead.length && c?.last_lat != null && ['accepted', 'in_progress'].includes(r.status)) ahead.unshift([c.last_lat, c.last_lng]);
    if (ahead.length > 1) L.polyline(ahead, { color, weight: 3, opacity: 0.55, dashArray: '2 8', lineCap: 'round' }).addTo(mapCtx.routeLayer);
    const nextId = stops.find((s) => s.status === 'pending')?.id;
    stops.forEach((s, i) => {
      if (s.lat == null) return;
      const f = fc.get(s.id) || { st: 'ok' };
      const big = s.id === nextId;
      const size = big ? 26 : 20;
      const mk = L.marker([s.lat, s.lng], {
        icon: L.divIcon({
          html: `<div class="smark st-${f.st}${big ? ' next' : ''}" style="background:${color}"></div><span class="snum" style="border-color:${color}">${i + 1}</span>`,
          className: 'smark-wrap', iconSize: [size, size], iconAnchor: [size / 2, size / 2],
        }),
        zIndexOffset: f.st === 'late' ? 600 : big ? 500 : 0,
      });
      const lines = [
        `<b>${esc(firstName(c?.name))} · точка ${i + 1} из ${stops.length}</b>`,
        `<span style="color:#64748B">${esc(r.title || 'Маршрут')} · ${esc(dateLabel(r.route_date))}</span>`,
        esc(s.address),
        clientHtml(s),
        s.time_from || s.time_to ? `окно ${esc(s.time_from || '…')}–${esc(s.time_to || '…')}` : '',
        s.status !== 'pending' ? `<span class="hd hd-${s.status}" data-head="${s.id}">${headText(s, null, false)}</span>` : '',
        f.st === 'late' ? `<span style="color:#E11D48">опаздывает${f.eta ? ` · ${f.src === 'courier' ? 'прогноз курьера' : 'оценка'} ~${timeOf(f.eta)}` : ''}</span>` : '',
        f.st === 'ok' && f.eta ? `<span style="color:#A16207">${f.src === 'courier' ? 'прогноз курьера' : 'оценка'} ~${timeOf(f.eta)}</span>` : '',
      ].filter(Boolean);
      mk.bindPopup(lines.join('<br>') + `<div class="pp-check" data-stop="${s.id}"></div>`, { maxWidth: 280 });
      mk.on('popupopen', () => fillPopupCheck(r, s, mk));
      mk.addTo(mapCtx.routeLayer);
    });
  });

  // курьеры: текущее местоположение
  const seen = new Set();
  state.couriers.forEach((c) => {
    if (c.last_lat == null || !c.active) return;
    seen.add(c.id);
    const html = courierIconHtml(c);
    let m = mapCtx.markers.get(c.id);
    if (!m) {
      m = L.marker([c.last_lat, c.last_lng], { icon: L.divIcon({ html, className: '', iconSize: [70, 54], iconAnchor: [35, 20] }), zIndexOffset: 1000 });
      m.on('click', () => openCourierSheet(c.id));
      m.addTo(mapCtx.courierLayer);
      m._html = html;
      mapCtx.markers.set(c.id, m);
    } else {
      m.setLatLng([c.last_lat, c.last_lng]);
      if (m._html !== html) { m.setIcon(L.divIcon({ html, className: '', iconSize: [70, 54], iconAnchor: [35, 20] })); m._html = html; }
    }
  });
  mapCtx.markers.forEach((m, id) => { if (!seen.has(id)) { mapCtx.courierLayer.removeLayer(m); mapCtx.markers.delete(id); } });

  if (!mapCtx.fitted && (seen.size || routes.length)) { mapCtx.fitted = true; if (!store('dm.mapView')) fitAll(); }
  renderMapChips();
}

/* ---------- легенда: курьеры на карте ---------- */
function renderMapChips() {
  const box = $('#map-chips');
  if (!box) return;
  if (hist.day) { box.innerHTML = histChips(); return; }
  const alertChip = state.alerts.size ? `<button class="map-chip alert" data-act="alerts-open">⚠ ${state.alerts.size} без отметки</button>` : '';
  const routes = mapRoutes();
  const ids = [...new Set(routes.map((r) => r.courier_id))];
  state.couriers.forEach((c) => { if (c.active && courierState(c) === 'online' && !ids.includes(c.id)) ids.push(c.id); });
  // есть трек за сегодня, но маршрутов в работе нет — тоже показать, чтобы было понятно, чья линия
  tracks.forEach((t, id) => {
    const c = state.couriers.get(id);
    if (c?.active && t.day === dateStr() && t.points.length > 1 && !ids.includes(id)) ids.push(id);
  });
  const chips = ids.map((id) => {
    const c = state.couriers.get(id);
    const mine = routes.filter((r) => r.courier_id === id);
    let done = 0; let total = 0; let late = 0;
    mine.forEach((r) => {
      const k = routeCounts(r); done += k.done + k.failed; total += k.total;
      routeForecast(r).forEach((f) => { if (f.st === 'late') late++; });
    });
    const st = courierState(c);
    return `<button class="map-chip${st === 'online' ? '' : ' dim'}" data-act="map-courier" data-id="${id}">
      <i style="background:${courierColor(id)}"></i>${esc(firstName(c?.name))}${total ? ` · ${done}/${total}` : ' · без маршрута'}${late ? `<b class="late">${late}</b>` : ''}</button>`;
  });
  if (!chips.length && state.loaded) {
    chips.push('<span class="map-chip" style="padding-right:12px">Нет маршрутов в работе</span>');
  }
  box.innerHTML = alertChip + chips.join('');
}
actions['map-courier'] = (el) => fitCourier(el.dataset.id);
actions['map-fit'] = () => fitAll();

function boundsOf(points) {
  if (!points.length || !mapCtx.map) return;
  if (points.length === 1) mapCtx.map.setView(points[0], 15);
  else mapCtx.map.fitBounds(L.latLngBounds(points), { padding: [60, 60], maxZoom: 16 });
}
function courierPoints(id) {
  if (hist.day) return histCourierPoints(id);
  const pts = [];
  const c = state.couriers.get(id);
  if (c?.last_lat != null) pts.push([c.last_lat, c.last_lng]);
  mapRoutes().filter((r) => r.courier_id === id).forEach((r) => (r.stops || []).forEach((s) => { if (s.lat != null) pts.push([s.lat, s.lng]); }));
  (tracks.get(id)?.points || []).forEach((p) => pts.push([p.lat, p.lng]));
  return pts;
}
function fitAll() {
  if (!mapCtx.map || !window.L) return;
  if (hist.day) { boundsOf(histAllPoints()); return; }
  const pts = [];
  state.couriers.forEach((c) => { if (c.active) pts.push(...courierPoints(c.id)); });
  boundsOf(pts);
}
function fitCourier(id) {
  if (!mapCtx.map || !window.L) return;
  const pts = courierPoints(id);
  if (pts.length) boundsOf(pts); else toast('У курьера пока нет точек на карте', 'info');
}
function fitFocus() {
  const r = state.focusRouteId && state.routes.get(state.focusRouteId);
  if (!mapCtx.map || !window.L || !r) { ensureMap(); return; }
  drawMap();
  const pts = (r.stops || []).filter((s) => s.lat != null).map((s) => [s.lat, s.lng]);
  const c = state.couriers.get(r.courier_id);
  if (c?.last_lat != null) pts.push([c.last_lat, c.last_lng]);
  if (pts.length) boundsOf(pts); else toast('У точек маршрута нет координат', 'info');
}

/* ===================================================================
 *  Общая база адресов: заметки курьеров «Маршрутов Про» для всей команды
 * =================================================================== */
async function loadNotes() {
  if (!state.api?.notes || !state.team) return;
  state.notesAt = Date.now();
  try {
    const rows = await state.api.notes(state.team.id);
    state.notesMissing = rows == null;
    state.notes = rows || [];
    renderAll();
  } catch (e) { /* нет связи — в следующий раз */ }
}
/** Заметка базы для адреса: тот же ключ, тот же дом, записанный иначе, или точка ближе 12 м. */
function noteFor(address, lat, lng) {
  const list = state.notes || [];
  if (!list.length || !address) return null;
  const key = addressKey(address);
  return list.find((n) => n.key === key)
    || list.find((n) => sameHouse(address, n.address))
    || (lat != null ? list.find((n) => n.lat != null && distM({ lat, lng }, n) < 12) : null)
    || null;
}
function bookLine(s) {
  const n = noteFor(s.address, s.lat, s.lng);
  if (!n) return '';
  const bits = [
    n.note && n.note !== s.note ? esc(n.note) : '',
    n.phone && n.phone !== s.client_phone ? `<a href="${telHref(n.phone)}">${esc(n.phone)}</a>` : '',
    (n.photos || []).length ? `фото подъезда: ${n.photos.length}` : '',
  ].filter(Boolean);
  return bits.length ? `<div class="s-book" data-act="note-edit" data-key="${esc(n.key)}">📝 ${bits.join(' · ')}</div>` : '';
}
function noteMeta(n) {
  return [
    n.phone ? `☎ ${esc(n.phone)}` : '',
    n.unload_minutes ? `разгрузка ${n.unload_minutes} мин` : '',
    (n.photos || []).length ? `📷 ${n.photos.length}` : '',
    n.author ? esc(n.author) : '',
    n.updated_at ? esc(dateLabel(dateStr(new Date(n.updated_at)))) : '',
  ].filter(Boolean).join(' · ');
}
function notesListHtml(q) {
  const t = q.trim().toLowerCase();
  const list = (state.notes || []).filter((n) => !t || n.address.toLowerCase().includes(t) || (n.note || '').toLowerCase().includes(t)
    || (n.phone || '').includes(t));
  if (!list.length) return `<div class="empty">${state.notes?.length ? 'Ничего не нашлось' : 'Пока пусто. Заметки появятся, когда курьеры «Маршрутов Про» подключатся к команде.'}</div>`;
  return list.slice(0, 300).map((n) => `<div class="card tap nt" data-act="note-edit" data-key="${esc(n.key)}">
      <div class="nt-addr">${esc(n.address)}</div>
      ${n.note ? `<div class="nt-note">${esc(n.note)}</div>` : ''}
      <div class="nt-meta">${noteMeta(n)}</div></div>`).join('')
    + (list.length > 300 ? `<p class="hint">Показаны первые 300 — уточните поиск.</p>` : '');
}
function openNotesSheet() {
  if (state.notesMissing) { toast('Сначала выполните в Supabase файл 011_address_notes.sql', 'info', 7000); return; }
  let q = '';
  const sh = openSheet({
    title: `База адресов · ${(state.notes || []).length}`,
    body: `<div class="row" style="margin-bottom:10px">
        <input class="input" id="notes-q" type="search" placeholder="Поиск: адрес, код, телефон">
        <button class="btn primary" style="flex:none" data-act="note-new">${icon('plus')}Адрес</button></div>
      <p class="hint" style="margin:0 0 10px">Коды домофонов, входы, телефоны и фото подъездов. Курьеры «Маршрутов Про» видят базу у себя
        и дополняют её; правки отсюда приходят им в течение нескольких минут.</p>
      <div id="notes-list">${notesListHtml('')}</div>`,
    tall: true,
  });
  const inp = $('#notes-q', sh.el);
  inp.oninput = () => { q = inp.value; $('#notes-list', sh.el).innerHTML = notesListHtml(q); };
  sh.refresh = () => { sh.setTitle(`База адресов · ${(state.notes || []).length}`); const l = $('#notes-list', sh.el); if (l) l.innerHTML = notesListHtml(q); };
  sheetRefreshers.add(sh.refresh);
  loadNotes();
}
actions['notes-open'] = () => openNotesSheet();
actions['note-new'] = () => openNoteEditor(null);
actions['note-edit'] = (el) => openNoteEditor((state.notes || []).find((n) => n.key === el.dataset.key) || null);

function openNoteEditor(n) {
  const isNew = !n;
  const opts = ['', 5, 10, 15, 20, 30, 45, 60];
  const sh = openSheet({
    title: isNew ? 'Новый адрес в базе' : 'Заметка к адресу',
    body: `
      <label class="field"><span>Адрес</span><input class="input" id="nt-addr" value="${esc(n?.address || '')}" ${isNew ? '' : 'readonly'} placeholder="Город, улица, дом"></label>
      <label class="field"><span>Заметка</span><textarea class="input" id="nt-note" style="min-height:90px" placeholder="Код домофона, вход со двора, 3 этаж без лифта…">${esc(n?.note || '')}</textarea></label>
      <label class="field"><span>Телефон приёмки</span><input class="input" id="nt-phone" type="tel" value="${esc(n?.phone || '')}"></label>
      <label class="field"><span>Разгрузка на этой точке</span><select class="input" id="nt-unload">
        ${opts.map((v) => `<option value="${v}" ${String(n?.unload_minutes ?? '') === String(v) ? 'selected' : ''}>${v === '' ? 'обычная' : `${v} мин`}</option>`).join('')}
      </select></label>
      ${(n?.photos || []).length ? `<div class="field"><span>Фото подъезда</span><div class="nt-photos" id="nt-photos">${n.photos.map(() => '<div class="nt-ph loading"></div>').join('')}</div></div>` : ''}
      ${n ? `<p class="hint">${noteMeta(n)}</p>` : ''}`,
    foot: `${isNew ? '' : '<button class="btn danger" data-del>Удалить</button>'}<button class="btn primary" data-save>Сохранить</button>`,
  });
  if ((n?.photos || []).length) {
    state.api.notePhotos(state.team.id, n.photos.map((p) => p.file)).then((rows) => {
      const box = $('#nt-photos', sh.el);
      if (!box) return;
      box.innerHTML = n.photos.map((p) => {
        const r = rows.find((x) => x.file === p.file);
        if (!r) return '<div class="nt-ph">нет фото</div>';
        const tg = Array.isArray(p.target) ? `<i class="nt-target" style="left:${p.target[0] * 100}%;top:${p.target[1] * 100}%"></i>` : '';
        return `<a class="nt-ph" href="data:image/jpeg;base64,${r.data}" target="_blank" rel="noopener"><img src="data:image/jpeg;base64,${r.data}" alt="">${tg}</a>`;
      }).join('');
    }).catch(() => {});
  }
  $('[data-save]', sh.el).onclick = async () => {
    const address = $('#nt-addr', sh.el).value.trim();
    if (!address) { toast('Введите адрес', 'bad'); return; }
    const same = isNew ? noteFor(address) : null;
    const base = n || same;
    const u = $('#nt-unload', sh.el).value;
    const row = {
      ...(base || {}),
      key: base?.key || addressKey(address),
      address: base?.address || address,
      note: $('#nt-note', sh.el).value.trim(),
      phone: $('#nt-phone', sh.el).value.trim() || null,
      unload_minutes: u ? +u : null,
      photos: base?.photos || [],
    };
    if (isNew && !row.lat) {
      const c = await geocode(address).catch(() => null);
      if (c) { row.lat = c.lat; row.lng = c.lng; }
    }
    try {
      const saved = await state.api.saveNote(state.team.id, row);
      state.notes = [...(state.notes || []).filter((x) => x.key !== saved.key), saved].sort((a, b) => a.address.localeCompare(b.address, 'ru'));
      sh.close(); toast('Сохранено — курьеры получат в течение нескольких минут', 'ok'); renderAll();
    } catch (e) { toast(errText(e), 'bad'); }
  };
  const del = $('[data-del]', sh.el);
  if (del) del.onclick = async () => {
    if (!(await confirmSheet('Удалить заметку?', 'Заметка пропадёт у всех курьеров команды.', 'Удалить', true))) return;
    try {
      await state.api.deleteNote(state.team.id, n.key);
      state.notes = (state.notes || []).filter((x) => x.key !== n.key);
      sh.close(); toast('Удалено', 'ok'); renderAll();
    } catch (e) { toast(errText(e), 'bad'); }
  };
}

/* ===================================================================
 *  Справочник клиентов: юр. название из накладной → вывеска, адрес, «где именно»
 * =================================================================== */
async function loadClients() {
  if (!state.api?.clients || !state.team) return;
  state.clientsAt = Date.now();
  try {
    const rows = await state.api.clients(state.team.id);
    state.clientsMissing = rows == null;
    state.clients = rows || [];
    renderAll();
  } catch (e) { /* нет связи — в следующий раз */ }
}

const LEGAL_LONG = ['индивидуальный предприниматель', 'общество с ограниченной ответственностью', 'закрытое акционерное общество',
  'открытое акционерное общество', 'публичное акционерное общество', 'непубличное акционерное общество', 'акционерное общество',
  'автономная некоммерческая организация', 'крестьянское фермерское хозяйство', 'потребительский кооператив'];
const LEGAL_SHORT = new Set(['ип', 'ооо', 'оао', 'зао', 'пао', 'ао', 'нао', 'ано', 'нко', 'чп', 'тоо', 'кфх', 'гк', 'пк', 'ип.']);
/** «ИП Пупкин А.В.» → ['пупкин', 'а', 'в']; «ООО "Глазов и К"» → ['глазов', 'и', 'к'] */
function legalTokens(name) {
  let t = ` ${String(name || '').toLowerCase().replace(/ё/g, 'е').replace(/["«»'“”„`]/g, ' ').replace(/[.,;:()№–—-]/g, ' ').replace(/\s+/g, ' ')} `;
  LEGAL_LONG.forEach((p) => { t = t.split(` ${p} `).join(' '); });
  return t.split(' ').filter((x) => x && !LEGAL_SHORT.has(x));
}
/** Насколько имя из накладной похоже на клиента: 4 — ИНН, 3 — то же название, 2 — фамилия и инициалы, 1 — только фамилия. */
function nameScore(name, c) {
  const inn = String(name || '').match(/(?<!\d)(\d{10}|\d{12})(?!\d)/);
  if (inn && c.inn && c.inn.replace(/\D/g, '') === inn[1]) return 4;
  const a = legalTokens(String(name || '').replace(/(?<!\d)\d{10,12}(?!\d)/g, ' '));
  if (!a.length) return 0;
  let best = 0;
  [c.legal_name, c.trade_name, ...String(c.aliases || '').split(/[;\n]/)].forEach((v) => {
    const b = legalTokens(v);
    if (!b.length) return;
    if (a.join(' ') === b.join(' ')) { best = Math.max(best, 3); return; }
    if (a[0] !== b[0] || a[0].length < 3) return;
    const n = Math.min(a.length, b.length);
    for (let k = 1; k < n; k++) if (a[k][0] !== b[k][0]) return;
    best = Math.max(best, n > 1 ? 2 : 1);
  });
  return best;
}
function clientAt(c, address, lat, lng) {
  if (!c.address && c.lat == null) return false;
  if (address && c.address && (c.key === addressKey(address) || sameHouse(address, c.address))) return true;
  return lat != null && c.lat != null && distM({ lat, lng }, c) < 15;
}
/** Клиенты на адресе (по ключу, тому же дому или точке ближе 15 м). */
function clientsAt(address, lat, lng) {
  if (!address && lat == null) return [];
  return (state.clients || []).filter((c) => clientAt(c, address, lat, lng));
}
/**
 * Клиент для заказа: по имени из накладной (и адресу, если имён несколько) или, без имени, — единственный на адресе.
 * { client } — нашёлся; { many: [...] } — на адресе несколько, по накладной не понять; {} — нет в справочнике.
 */
function matchClient(name, address, lat, lng) {
  const list = state.clients || [];
  if (!list.length) return {};
  if (String(name || '').trim()) {
    const cands = list.map((c) => [c, nameScore(name, c)]).filter(([, sc]) => sc > 0).sort((x, y) => y[1] - x[1]);
    if (!cands.length) return {};
    const here = cands.filter(([c]) => clientAt(c, address, lat, lng));
    if (here.length) return { client: here[0][0] };
    if (!address && lat == null) {
      if (cands.length === 1 || cands[0][1] > cands[1][1]) return { client: cands[0][0] };
      return { many: cands.map(([c]) => c) };
    }
    if (cands.length === 1 && !cands[0][0].address) return { client: cands[0][0] };
    return {}; // такое имя есть, но по другому адресу — это другой магазин
  }
  const at = clientsAt(address, lat, lng);
  if (at.length === 1) return { client: at[0] };
  return at.length ? { many: at } : {};
}
function applyClient(s, c) {
  if (!c) { s.client_ref = null; s.client_legal = null; s.client_place = null; return s; }
  s.client_name = c.trade_name || c.legal_name || null;
  s.client_legal = c.legal_name || null;
  s.client_place = c.place || null;
  s.client_ref = c.id;
  if (s.lat == null && c.lat != null) { s.lat = c.lat; s.lng = c.lng; }
  return s;
}
function clientTitle(c) { return c.trade_name || c.legal_name || 'Без названия'; }
/** Получатель в карточке точки: вывеска, юр. название, где именно. */
function clientHtml(s) {
  if (!s.client_name && !s.client_legal) return '';
  const legal = s.client_legal && s.client_legal !== s.client_name ? ` <span class="s-legal">${esc(s.client_legal)}</span>` : '';
  return `<span class="s-client">${s.client_ref ? '🏪 ' : ''}${esc(s.client_name || s.client_legal)}</span>${legal}${s.client_place ? ` · ${esc(s.client_place)}` : ''}`;
}

function clientsListHtml(q) {
  const t = q.trim().toLowerCase();
  const all = state.clients || [];
  const list = all.filter((c) => !t || [c.trade_name, c.legal_name, c.address, c.place, c.inn, c.aliases].some((v) => String(v || '').toLowerCase().includes(t)));
  if (!list.length) return `<div class="empty">${all.length ? 'Ничего не нашлось' : 'Пока пусто. Добавьте клиентов по одному или загрузите таблицу: юридическое название, вывеска, адрес.'}</div>`;
  return list.slice(0, 300).map((c) => {
    const n = c.address ? all.filter((x) => x !== c && clientAt(x, c.address, c.lat, c.lng)).length : 0;
    return `<div class="card tap nt" data-act="client-edit" data-id="${esc(c.id)}">
      <div class="nt-addr">${esc(clientTitle(c))}${c.trade_name && c.legal_name ? ` <span class="s-legal">${esc(c.legal_name)}</span>` : ''}</div>
      <div class="nt-meta">${esc(c.address || 'адрес не указан')}${c.place ? ` · ${esc(c.place)}` : ''}${n ? ` · <span class="cl-many">на адресе ещё ${n}</span>` : ''}${c.address && c.lat == null ? ' · <span class="red">не найден на карте</span>' : ''}</div></div>`;
  }).join('') + (list.length > 300 ? `<p class="hint">Показаны первые 300 — уточните поиск.</p>` : '');
}
function openClientsSheet() {
  if (state.clientsMissing) { toast('Сначала выполните в Supabase файл 012_clients.sql', 'info', 7000); return; }
  let q = '';
  const sh = openSheet({
    title: `Клиенты · ${(state.clients || []).length}`,
    body: `<div class="row" style="margin-bottom:10px">
        <input class="input" id="cl-q" type="search" placeholder="Поиск: вывеска, ИП, ООО, адрес, ИНН">
        <button class="btn primary" style="flex:none" data-act="client-new">${icon('plus')}Клиент</button></div>
      <p class="hint" style="margin:0 0 10px">Юридическое название — как пишут в накладных, вывеска — что курьер видит на месте.
        На одном адресе может быть несколько клиентов: курьер выберет нужного по накладной.
        <a href="#" data-act="clients-import">Загрузить из Excel/CSV</a></p>
      <div id="cl-list">${clientsListHtml('')}</div>`,
    tall: true,
  });
  const inp = $('#cl-q', sh.el);
  inp.oninput = () => { q = inp.value; $('#cl-list', sh.el).innerHTML = clientsListHtml(q); };
  sh.refresh = () => { sh.setTitle(`Клиенты · ${(state.clients || []).length}`); const l = $('#cl-list', sh.el); if (l) l.innerHTML = clientsListHtml(q); };
  sheetRefreshers.add(sh.refresh);
  loadClients();
}
actions['clients-open'] = () => openClientsSheet();
actions['client-new'] = () => openClientEditor(null);
actions['client-edit'] = (el) => openClientEditor((state.clients || []).find((c) => c.id === el.dataset.id) || null);
actions['clients-import'] = () => pickTableFile(openClientsImport);

function storeClients(saved) {
  const ids = new Set(saved.map((c) => c.id));
  state.clients = [...(state.clients || []).filter((c) => !ids.has(c.id)), ...saved]
    .sort((a, b) => (a.address || '').localeCompare(b.address || '', 'ru') || clientTitle(a).localeCompare(clientTitle(b), 'ru'));
  renderAll();
}
/** Координаты клиента: из базы адресов или поиском по карте. */
async function locateClient(c) {
  if (!c.address) { c.lat = null; c.lng = null; return; }
  const book = noteFor(c.address);
  const p = book?.lat != null ? book : await geocode(c.address).catch(() => null);
  c.lat = p?.lat ?? null; c.lng = p?.lng ?? null;
}

function openClientEditor(c, preset = null) {
  const isNew = !c;
  const v = c || preset || {};
  const sh = openSheet({
    title: isNew ? 'Новый клиент' : 'Клиент',
    body: `
      <label class="field"><span>Вывеска — что курьер видит на месте</span><input class="input" id="cl-trade" value="${esc(v.trade_name || '')}" placeholder="Радуга"></label>
      <label class="field"><span>Юридическое название — как в накладной</span><input class="input" id="cl-legal" value="${esc(v.legal_name || '')}" placeholder="ИП Пупкин А.В."></label>
      <label class="field"><span>Адрес</span><input class="input" id="cl-addr" value="${esc(v.address || '')}" placeholder="Город, улица, дом"></label>
      <div id="cl-near" class="hint" style="margin:-4px 0 10px"></div>
      <label class="field"><span>Где именно</span><input class="input" id="cl-place" value="${esc(v.place || '')}" placeholder="ТЦ «Мега», 1 этаж, павильон 14"></label>
      <label class="field"><span>ИНН <small>(курьеру не передаётся)</small></span><input class="input" id="cl-inn" inputmode="numeric" value="${esc(v.inn || '')}"></label>
      <label class="field"><span>Другие написания в накладных <small>(через «;»)</small></span><input class="input" id="cl-alias" value="${esc(v.aliases || '')}" placeholder="Пупкин Александр Владимирович; ИП Пупкин"></label>`,
    foot: `${isNew ? '' : '<button class="btn danger" data-del>Удалить</button>'}<button class="btn primary" data-save>Сохранить</button>`,
  });
  const near = () => {
    const a = $('#cl-addr', sh.el).value.trim();
    const others = a ? clientsAt(a).filter((x) => x.id !== c?.id) : [];
    $('#cl-near', sh.el).innerHTML = others.length
      ? `На этом адресе уже: ${others.map((x) => `<b>${esc(clientTitle(x))}</b>${x.place ? ` (${esc(x.place)})` : ''}`).join(', ')}. Укажите «где именно», чтобы курьер не перепутал.` : '';
  };
  $('#cl-addr', sh.el).addEventListener('change', near);
  near();
  $('[data-save]', sh.el).onclick = async (e) => {
    const row = {
      ...(c || {}),
      trade_name: $('#cl-trade', sh.el).value.trim(),
      legal_name: $('#cl-legal', sh.el).value.trim(),
      address: $('#cl-addr', sh.el).value.trim(),
      place: $('#cl-place', sh.el).value.trim() || null,
      inn: $('#cl-inn', sh.el).value.replace(/\D/g, '') || null,
      aliases: $('#cl-alias', sh.el).value.trim() || null,
    };
    if (!row.trade_name && !row.legal_name) { toast('Введите вывеску или юридическое название', 'bad'); return; }
    if (!row.address) { toast('Введите адрес', 'bad'); return; }
    e.target.disabled = true;
    if (!c || c.address !== row.address || c.lat == null) await locateClient(row);
    try {
      storeClients(await state.api.saveClients(state.team.id, [row]));
      sh.close();
      toast(row.address && row.lat == null ? 'Сохранено, но адрес не найден на карте — уточните его' : 'Сохранено — курьеры получат в течение нескольких минут', row.lat == null ? 'bad' : 'ok', 5000);
    } catch (err) { e.target.disabled = false; toast(errText(err), 'bad'); }
  };
  const del = $('[data-del]', sh.el);
  if (del) del.onclick = async () => {
    if (!(await confirmSheet('Удалить клиента?', 'Он пропадёт из справочника у курьеров. В уже созданных маршрутах название останется.', 'Удалить', true))) return;
    try {
      await state.api.deleteClient(c.id);
      state.clients = (state.clients || []).filter((x) => x.id !== c.id);
      sh.close(); toast('Удалено', 'ok'); renderAll();
    } catch (err) { toast(errText(err), 'bad'); }
  };
  if (isNew) setTimeout(() => $(v.legal_name ? '#cl-trade' : '#cl-legal', sh.el)?.focus(), 300);
}

/* ---------- загрузка справочника из таблицы ---------- */
const CLIENT_FIELDS = [
  ['legal_name', 'Юридическое название', /юр|наименован|контрагент|организац|получат|покупат|грузополуч|клиент|фирма/i],
  ['trade_name', 'Вывеска (торговое название)', /вывеск|торгов|магазин|точка|бренд|назван/i],
  ['address', 'Адрес *', /адрес|address|куда/i],
  ['place', 'Где именно', /где|место|павильон|этаж|ориентир|вход|уточн/i],
  ['inn', 'ИНН', /инн|inn/i],
  ['aliases', 'Другие написания', /друг|синоним|алиас|написан/i],
];
function pickTableFile(onTable) {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.xlsx,.xls,.csv,.txt';
  inp.style.display = 'none';
  inp.id = 'table-file';
  document.body.appendChild(inp);
  inp.onchange = async () => {
    const f = inp.files?.[0];
    inp.remove();
    if (!f) return;
    try {
      const table = await readTable(f);
      if (!table.length) { toast('В файле нет строк', 'bad'); return; }
      onTable(table, f.name);
    } catch (e) { toast(e.message || 'Не удалось прочитать файл', 'bad', 6000); }
  };
  inp.click();
}
function openClientsImport(table, fileName) {
  let hdr = -1;
  for (let i = 0; i < Math.min(5, table.length) && hdr < 0; i++) if (table[i].some((c) => c.length < 40 && /адрес|наименован|юр|вывеск/i.test(c))) hdr = i;
  const map = {};
  if (hdr >= 0) {
    const used = new Set();
    CLIENT_FIELDS.forEach(([f, , re]) => {
      const j = table[hdr].findIndex((c, k) => !used.has(k) && c && re.test(c));
      if (j >= 0) { map[f] = j; used.add(j); }
    });
  }
  const st = { hdr, map, busy: false };
  const sh = openSheet({ title: 'Клиенты из файла', body: '', tall: true, foot: '' });
  const rows = () => table.slice(st.hdr + 1).map((r) => {
    const g = (f) => (st.map[f] != null ? r[st.map[f]] || '' : '').trim();
    const c = { legal_name: g('legal_name'), trade_name: g('trade_name'), address: g('address'), place: g('place') || null,
      inn: g('inn').replace(/\D/g, '') || null, aliases: g('aliases') || null };
    return c.address && (c.legal_name || c.trade_name) ? c : null;
  }).filter(Boolean);
  const existing = (c) => (state.clients || []).find((x) => clientAt(x, c.address)
    && ((c.inn && x.inn === c.inn) || (c.legal_name && nameScore(c.legal_name, x) >= 2) || (!c.legal_name && x.trade_name === c.trade_name)));
  function render() {
    const list = rows();
    const upd = list.filter(existing).length;
    const cols = table[0].map((_, k) => (st.hdr >= 0 && table[st.hdr][k] ? table[st.hdr][k] : `Колонка ${k + 1}`));
    sh.setBody(`
      <p class="hint" style="margin-top:0">${esc(fileName)} · строк: ${table.length - (st.hdr + 1)}. Проверьте, какая колонка что значит.</p>
      <label class="check"><input type="checkbox" id="ci-hdr" ${st.hdr >= 0 ? 'checked' : ''}> Первая строка — заголовки</label>
      <div class="imp-map">${CLIENT_FIELDS.map(([f, label]) => `
        <label class="field"><span>${label}</span><select class="input" data-cmap="${f}">
          <option value="">— нет —</option>
          ${cols.map((nm, k) => `<option value="${k}" ${st.map[f] === k ? 'selected' : ''}>${esc(nm)}</option>`).join('')}
        </select></label>`).join('')}</div>
      <div class="section-title">Получится · ${list.length} ${plural(list.length, 'клиент', 'клиента', 'клиентов')}${upd ? ` (${upd} уже есть — обновятся)` : ''}</div>
      <div class="card tbl"><table><thead><tr><th>Вывеска</th><th>Юр. название</th><th>Адрес</th><th>Где именно</th></tr></thead>
        <tbody>${list.slice(0, 8).map((c) => `<tr><td>${esc(c.trade_name)}</td><td>${esc(c.legal_name)}</td><td>${esc(c.address)}</td><td>${esc(c.place || '')}</td></tr>`).join('')}</tbody></table></div>
      ${list.length > 8 ? `<p class="hint">…и ещё ${list.length - 8}</p>` : ''}
      ${st.map.address == null ? '<div class="banner" style="margin-top:8px">Выберите колонку с адресом.</div>' : ''}`);
    sh.setFoot(`<button class="btn" data-x="cancel">Отмена</button><button class="btn primary" data-x="go" ${list.length && !st.busy ? '' : 'disabled'}>Загрузить ${list.length}</button>`);
  }
  sh.el.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'ci-hdr') { st.hdr = t.checked ? 0 : -1; render(); }
    if (t.dataset.cmap) { st.map[t.dataset.cmap] = t.value === '' ? undefined : +t.value; render(); }
  });
  sh.el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-x]');
    if (!b) return;
    if (b.dataset.x === 'cancel') { sh.close(); return; }
    st.busy = true; render();
    const list = rows().map((c) => { const x = existing(c); return x ? { ...x, ...c, inn: c.inn || x.inn, aliases: c.aliases || x.aliases, place: c.place || x.place } : c; });
    const todo = list.filter((c) => c.lat == null);
    let k = 0;
    try {
      for (const c of todo) {
        k++;
        sh.setFoot(`<span class="hint">Ищу адреса на карте ${k}/${todo.length}…</span>`);
        await locateClient(c);
      }
      storeClients(await state.api.saveClients(state.team.id, list));
      sh.close();
      const miss = list.filter((c) => c.lat == null).length;
      toast(`В справочнике ${list.length} ${plural(list.length, 'клиент', 'клиента', 'клиентов')}.${miss ? ` Не найдено на карте: ${miss} — уточните адреса.` : ''}`, miss ? 'bad' : 'ok', 7000);
    } catch (err) { st.busy = false; render(); toast(errText(err), 'bad', 6000); }
  });
  render();
}

/** Получатели заказов, которых нет в справочнике: вписать вывеску и сохранить. */
function openNewRecipients(rows, onDone) {
  const seen = new Map();
  rows.filter((r) => r._cl === 'none' && r._recipient).forEach((r) => {
    const k = `${legalTokens(r._recipient).join(' ')}|${addressKey(r.address)}`;
    if (!seen.has(k)) seen.set(k, { legal_name: r._recipient, address: r.address, lat: r.lat, lng: r.lng, trade_name: '', place: '' });
  });
  const list = [...seen.values()];
  const sh = openSheet({
    title: `Новые получатели · ${list.length}`,
    body: `<p class="hint" style="margin-top:0">Впишите вывеску — что курьер увидит на месте. Пустые строки не сохраняются.
        В следующий раз эти получатели подставятся сами.</p>
      ${list.map((c, i) => `<div class="card nr" data-i="${i}">
        <div class="nt-addr">${esc(c.legal_name)}</div><div class="nt-meta">${esc(c.address)}</div>
        <div class="row" style="margin-top:8px"><input class="input" data-k="trade_name" placeholder="Вывеска: Радуга">
          <input class="input" data-k="place" placeholder="Где именно: пав. 14"></div></div>`).join('')}`,
    foot: '<button class="btn" data-x="cancel">Позже</button><button class="btn primary" data-x="save">Сохранить в справочник</button>',
    tall: true,
  });
  sh.el.addEventListener('input', (e) => {
    const box = e.target.closest('[data-i]');
    if (box) list[+box.dataset.i][e.target.dataset.k] = e.target.value.trim();
  });
  sh.el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-x]');
    if (!b) return;
    if (b.dataset.x === 'cancel') { sh.close(); return; }
    const out = list.filter((c) => c.trade_name).map((c) => ({ ...c, place: c.place || null }));
    if (!out.length) { toast('Впишите хотя бы одну вывеску', 'bad'); return; }
    b.disabled = true;
    try {
      for (const c of out) if (c.lat == null) await locateClient(c);
      storeClients(await state.api.saveClients(state.team.id, out));
      sh.close();
      toast(`Добавлено в справочник: ${out.length}`, 'ok');
      onDone?.();
    } catch (err) { b.disabled = false; toast(errText(err), 'bad'); }
  });
}

/* ===================================================================
 *  Уведомления: курьер был у адреса, отметку не сделал и уехал
 * =================================================================== */
let alertsFirstLoad = true;
async function loadAlerts() {
  if (!state.api.alerts) return;
  try {
    const rows = await state.api.alerts(state.team.id);
    if (!rows) return; // база не обновлена (006)
    const fresh = rows.filter((a) => !state.alerts.has(a.id));
    state.alerts = new Map(rows.map((a) => [a.id, a]));
    // пропущенные, пока диспетчерская была закрыта, — одним сообщением
    if (alertsFirstLoad && fresh.length) toast(fresh.length === 1 ? alertText(fresh[0]) : `${fresh.length} точки: курьер был у адреса и уехал без отметки. Карта → «без отметки».`, 'bad', 10000);
    else fresh.forEach(notifyAlert);
    alertsFirstLoad = false;
    renderAll();
  } catch (e) { /* нет связи */ }
}
function onAlertEvent(p) {
  const a = p.new || {};
  if (!a.id) return;
  const open = !a.seen_at && !a.resolved_at;
  const had = state.alerts.has(a.id);
  if (open) state.alerts.set(a.id, { ...state.alerts.get(a.id), ...a }); else state.alerts.delete(a.id);
  if (open && !had) notifyAlert(a);
  if (had && a.resolved_at) toast(`${firstName(state.couriers.get(a.courier_id)?.name)} отметил точку ${stopName(a.stop_id)}`, 'ok');
  renderAll();
}
function stopName(id) { const s = state.stops.get(id); return s ? `«${s.address}»` : ''; }
function alertText(a) {
  const c = state.couriers.get(a.courier_id);
  const near = a.near_from ? ` (был у адреса ${timeOf(a.near_from)}–${timeOf(a.near_to)})` : '';
  return `${firstName(c?.name)} уехал от точки ${stopName(a.stop_id)} без отметки${near}`;
}
function beep() {
  try {
    const ctx = beep.ctx || (beep.ctx = new (window.AudioContext || window.webkitAudioContext)());
    [0, 0.25].forEach((d) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime + d);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d + 0.18);
      o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + 0.2);
    });
  } catch (e) { /* звук недоступен */ }
}
function notifyAlert(a) {
  const text = alertText(a);
  toast(text, 'bad', 12000);
  beep();
  // уведомление с сервера придёт само (тот же tag) — второе не показываем
  if (settings.notify && !state.pushOk && 'Notification' in window && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
    const opts = { body: text, tag: `alert-${a.id}`, icon: 'icons/icon-192.png' };
    (navigator.serviceWorker?.ready || Promise.reject())
      .then((reg) => reg.showNotification('Уехал без отметки', opts))
      .catch(() => { try { new Notification('Уехал без отметки', opts); } catch (e) { /* */ } });
  }
}
function openAlertsSheet() {
  const body = () => {
    const list = [...state.alerts.values()].sort((x, y) => Date.parse(y.created_at) - Date.parse(x.created_at));
    if (!list.length) return '<div class="empty">Всё отмечено</div>';
    return list.map((a) => {
      const c = state.couriers.get(a.courier_id);
      const st = state.stops.get(a.stop_id);
      const r = state.routes.get(a.route_id);
      return `<div class="card alert-card">
        <div class="al-head"><span class="cdot" style="background:${courierColor(a.courier_id)}"></span><b>${esc(c?.name || 'Курьер')}</b><span class="al-time">${timeOf(a.created_at)}</span></div>
        <div class="al-addr">${esc(st?.address || 'Точка')}${r ? ` <small>· ${esc(r.title)}</small>` : ''}</div>
        <div class="al-sub">Был у адреса ${timeOf(a.near_from)}–${timeOf(a.near_to)}${a.left_at ? `, уехал в ${timeOf(a.left_at)}` : ''}. Отметки нет.</div>
        <div class="actions">
          ${st?.lat != null ? `<button class="btn small" data-act="alert-map" data-id="${a.id}">${icon('map')}На карте</button>` : ''}
          ${c?.phone ? `<a class="btn small" href="${telHref(c.phone)}">${icon('phone')}Позвонить</a>` : ''}
          <button class="btn small primary" data-act="alert-seen" data-id="${a.id}">Понятно</button>
        </div></div>`;
    }).join('');
  };
  const sh = openSheet({ title: 'Уехал без отметки', body: body(), tall: true });
  sh.refresh = () => sh.setBody(body());
  sheetRefreshers.add(sh.refresh);
}
actions['alerts-open'] = () => openAlertsSheet();
actions['alert-seen'] = async (el) => {
  const id = +el.dataset.id;
  try { await state.api.seeAlert(id); state.alerts.delete(id); renderAll(); } catch (e) { toast(errText(e), 'bad'); }
};
actions['alert-map'] = (el) => {
  const a = state.alerts.get(+el.dataset.id);
  const st = a && state.stops.get(a.stop_id);
  closeAllSheets();
  if (hist.day) setMapDay(null);
  switchTab('map');
  if (st?.lat != null) setTimeout(() => mapCtx.map?.setView([st.lat, st.lng], 17), 120);
};
/* ---------- уведомления с сервера (Web Push): приходят, даже когда диспетчерская закрыта ---------- */
const VAPID_PUBLIC = 'BM6XRKPducPCAh_rgDbmFraR4MTd2qjx7jD2ea4JWg1VRxC1AeJ5rJ5bCbkk4J6U1aWujG5qOwS1xuJRF1B1P1w';
function b64uBytes(s) {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(b, (ch) => ch.charCodeAt(0));
}
/** Подписать это устройство. loud — показывать, что не получилось. */
async function ensurePush(loud) {
  state.pushOk = false;
  if (!state.api?.savePushSub || !state.team) return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    if (loud) toast(/iphone|ipad/i.test(navigator.userAgent) ? 'На iPhone уведомления работают, только если диспетчерская добавлена на экран «Домой»: «Поделиться» → «На экран Домой».' : 'Этот браузер не умеет получать уведомления с сервера — только пока диспетчерская открыта.', 'info', 9000);
    return;
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uBytes(VAPID_PUBLIC) });
    const ok = await state.api.savePushSub(state.team.id, sub, Intl.DateTimeFormat().resolvedOptions().timeZone || null);
    if (!ok) { if (loud) toast('Чтобы уведомления приходили при закрытой диспетчерской, выполните в Supabase файл 013_push.sql', 'info', 9000); return; }
    state.pushOk = true;
  } catch (e) {
    if (loud) toast(`Не удалось подписаться на уведомления: ${errText(e)}`, 'bad', 8000);
  }
  if (state.tab === 'more') renderMore();
}
actions['notify-on'] = async () => {
  if (!('Notification' in window)) { toast('Этот браузер не умеет показывать уведомления. На iPhone — установите диспетчерскую на экран «Домой».', 'info', 8000); return; }
  const res = await Notification.requestPermission();
  settings.notify = res === 'granted'; saveSettings();
  if (!settings.notify) { toast('Уведомления запрещены в настройках браузера', 'bad'); renderMore(); return; }
  await ensurePush(true);
  toast(state.pushOk ? 'Уведомления включены — придут, даже когда диспетчерская закрыта' : 'Уведомления включены, пока диспетчерская открыта', 'ok', 6000);
  renderMore();
};
actions['notify-off'] = async () => {
  settings.notify = false; saveSettings(); state.pushOk = false;
  try {
    const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
    if (sub) { await state.api.deletePushSub?.(sub.endpoint); await sub.unsubscribe(); }
  } catch (e) { /* */ }
  renderMore();
};
actions['notify-test'] = async () => {
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification('Проверка уведомлений', { body: 'Так будет выглядеть сообщение «уехал без отметки».', tag: 'test', icon: 'icons/icon-192.png' });
  } catch (e) { toast(`Телефон не показал уведомление: ${errText(e)}`, 'bad', 7000); }
};

/* ===================================================================
 *  Проверка отметок: история (stop_events) + был ли курьер у адреса по треку
 * =================================================================== */
const NEAR_TRACK = 150; // м — «у адреса» по треку
const CHECK_WIN = 15 * 60000; // отметка подтверждается треком в пределах ±15 минут
const evCache = new Map(); // id точки → события
let evMissing = false;
const trackCache = new Map();

async function loadEvents(ids) {
  if (!ids.length || evMissing || !state.api.stopEvents) return;
  try {
    const rows = await state.api.stopEvents(ids);
    const by = new Map(ids.map((id) => [id, []]));
    rows.forEach((e) => by.get(e.stop_id)?.push(e));
    by.forEach((v, k) => evCache.set(k, v));
  } catch (e) {
    if (e.code === 'no_events') evMissing = true; else throw e;
  }
}
/** Трек курьера за окно маршрута (кэш на минуту). */
async function trackRange(cid, fromMs, toMs) {
  const key = `${cid}|${Math.floor(fromMs / 60000)}|${Math.floor(toMs / 60000)}`;
  const c = trackCache.get(key);
  if (c && Date.now() - c.at < 60000) return c.pts;
  const pts = await state.api.track(cid, new Date(fromMs).toISOString(), new Date(toMs).toISOString());
  trackCache.set(key, { at: Date.now(), pts });
  return pts;
}
function routeWindow(r) {
  const times = [];
  (r.stops || []).forEach((s) => (evCache.get(s.id) || []).forEach((e) => times.push(Date.parse(e.at))));
  (r.stops || []).forEach((s) => { const t = Date.parse(s.done_at || ''); if (t) times.push(t); });
  let from = parseDate(r.route_date).getTime();
  let to = parseDate(addDays(r.route_date, 1)).getTime();
  times.forEach((t) => { from = Math.min(from, t - 3600000); to = Math.max(to, t + 3600000); });
  return [from, Math.min(to, Date.now())];
}
/** Когда курьер был у адреса: интервалы точек трека ближе NEAR_TRACK, плюс самое близкое приближение. */
function visitsNear(s, pts) {
  const out = [];
  let best = null;
  pts.forEach((p) => {
    const d = distM(p, s);
    const t = Date.parse(p.recorded_at);
    if (best == null || d < best.d) best = { d, t };
    if (d > NEAR_TRACK) return;
    const cur = out[out.length - 1];
    if (cur && t - cur.to <= 10 * 60000) cur.to = t; else out.push({ from: t, to: t });
  });
  return { visits: out, best };
}
function whenOf(ms, day) { return dateStr(new Date(ms)) === day ? timeOf(ms) : `${dateLabel(dateStr(new Date(ms))).toLowerCase()} ${timeOf(ms)}`; }

/** Строка «Доставлено в …» точки. info — результат проверки (null — ещё не проверено). */
function headText(s, info, cap) {
  const word = s.status === 'done' ? (cap ? 'Доставлено' : 'доставлено') : (cap ? 'Не доставлено' : 'не доставлено');
  const sym = s.status === 'done' ? '✓' : '✕';
  const why = s.status === 'failed' && s.result_comment ? `${cap ? ' — ' : ': '}${esc(s.result_comment)}` : '';
  if (s.done_by_track) return `${sym} ${word} ~${timeOf(s.done_at)} · время по треку${why}`;
  if (info?.warn) return `${sym} ${info.warn}${why}`;
  const at = info?.at || s.done_at;
  return `${sym} ${word}${at ? ` в ${timeOf(at)}` : ''}${why}`;
}
/** Проверка текущей отметки: { at — время первой отметки у адреса } или { warn — текст, если отмечено не у адреса }. */
function headInfo(s, evs, pts, day) {
  if (s.status === 'pending' || s.done_by_track || s.lat == null || !pts) return null;
  const vn = pts.length ? visitsNear(s, pts) : null;
  const near = (ms) => vn && vn.visits.some((v) => ms >= v.from - CHECK_WIN && ms <= v.to + CHECK_WIN);
  let list = (evs || []).filter((e) => e.status === s.status);
  if (!list.length) list = [{ status: s.status, at: s.done_at, lat: s.done_lat, lng: s.done_lng }];
  const ok = (e) => { const d = distM({ lat: e.lat, lng: e.lng }, s); return (d != null && d <= FAR_METERS) || near(Date.parse(e.at || '')); };
  const conf = list.find(ok);
  if (conf) return { at: conf.at };
  const last = list[list.length - 1];
  const hasEvidence = vn || list.some((e) => e.lat != null);
  if (!hasEvidence) return null;
  const vis = vn?.visits || [];
  const when = vis.length ? `у адреса был ${vis.map((v) => (v.to - v.from < 60000 ? whenOf(v.from, day) : `${whenOf(v.from, day)}–${timeOf(v.to)}`)).join(', ')}` : 'у адреса по треку не был';
  return { warn: `Отмечено в ${timeOf(last.at)} · ${when}` };
}
function applyHead(s, info) {
  document.querySelectorAll(`[data-head="${s.id}"]`).forEach((el) => {
    const cls = info?.warn ? 'warnres' : s.status;
    if (el.classList.contains('s-res')) { el.className = `s-res ${cls}`; el.innerHTML = headText(s, info, true); } else { el.className = `hd hd-${cls}`; el.innerHTML = headText(s, info, false); }
  });
}

/** HTML проверки отметок точки. evs — история (или undefined, пока не загружена), pts — трек (null — не загружен). */
function checkHtml(s, evs, pts, day) {
  day = day || dateStr();
  let list = evs ? [...evs] : [];
  if (!list.length && s.status !== 'pending') {
    list = [{ status: s.status, at: s.done_at, lat: s.done_lat, lng: s.done_lng, comment: s.result_comment, synthetic: true }];
  }
  const hasAddr = s.lat != null;
  const vn = pts && pts.length && hasAddr ? visitsNear(s, pts) : null;
  // был у адреса 2+ минуты, отметки нет, уехал дальше FAR_METERS
  let leftWarn = '';
  if (s.status === 'pending' && vn && vn.visits.length) {
    const lv = vn.visits[vn.visits.length - 1];
    const lp = pts[pts.length - 1];
    if (lv.to - lv.from >= 120000 && Date.parse(lp.recorded_at) > lv.to && distM(lp, s) > FAR_METERS) {
      leftWarn = `<div class="warn">⚠ Был у адреса ${whenOf(lv.from, day)}–${timeOf(lv.to)} и уехал без отметки</div>`;
    }
  }
  if (!list.length) return leftWarn;
  const near = (ms) => vn && vn.visits.some((v) => ms >= v.from - CHECK_WIN && ms <= v.to + CHECK_WIN);
  const evLine = (e) => {
    const ms = Date.parse(e.at || '');
    const when = ms ? whenOf(ms, day) : '—';
    if (e.status === 'pending') return `<div class="ev ev-undo">↺ ${when} · отметку сняли${e.by_dispatcher ? ' (диспетчер)' : ''}</div>`;
    if (s.done_by_track && e.status === s.status && ms === Date.parse(s.done_at || '')) {
      return `<div class="ev ev-${e.status}">${e.status === 'done' ? '✓' : '✕'} ~${when} · по треку (маршрут прислан уже выполненным)</div>`;
    }
    const d = hasAddr ? distM({ lat: e.lat, lng: e.lng }, s) : null;
    const place = !hasAddr ? '' : d == null ? ' · без координат' : d <= FAR_METERS ? ' · у адреса' : ` · в ${fmtDist(d)} от адреса`;
    const ok = (d != null && d <= FAR_METERS) || near(ms);
    const bad = hasAddr && !ok && (d != null || vn);
    return `<div class="ev ev-${e.status}${bad ? ' ev-bad' : ''}">${e.status === 'done' ? '✓' : '✕'} ${when}${place}${e.by_dispatcher ? ' (диспетчер)' : ''}${bad ? ' ⚠' : ''}</div>`;
  };
  const parts = [];
  if (list.length > 1) parts.push(`<div class="ev-title">История отметок</div>${list.map(evLine).join('')}`);
  else parts.push(list.map(evLine).join(''));
  if (vn) {
    parts.push(vn.visits.length
      ? `<div class="ev-track">По треку у адреса: ${vn.visits.map((v) => (v.to - v.from < 60000 ? whenOf(v.from, day) : `${whenOf(v.from, day)}–${timeOf(v.to)}`)).join(', ')}</div>`
      : `<div class="ev-track">По треку ближе ${fmtDist(vn.best.d)} к адресу не подъезжал</div>`);
  } else if (pts && !pts.length && hasAddr) {
    parts.push('<div class="ev-track">Трека за это время нет</div>');
  }
  // итог по текущей отметке
  const last = [...list].reverse().find((e) => e.status !== 'pending');
  if (s.done_by_track && s.status !== 'pending') parts.push('<div class="ev-ok">Маршрут прислан уже выполненным — время доставки взято по треку</div>');
  else if (s.status !== 'pending' && last && hasAddr) {
    const ms = Date.parse(last.at || '');
    const d = distM({ lat: last.lat, lng: last.lng }, s);
    if ((d != null && d <= FAR_METERS) || near(ms)) parts.push('<div class="ev-ok">Отметка подтверждена: курьер был у адреса</div>');
    else if (d != null || vn) parts.push(`<div class="warn">⚠ Отметка сделана не у адреса — время доставки по ней неточное</div>`);
  }
  if (leftWarn) parts.push(leftWarn);
  if (evMissing && evs !== undefined) parts.push(`<div class="hint">Полная история отметок появится после обновления базы (файл 006_stop_events.sql).</div>`);
  return parts.join('');
}

let routeCheckBusy = 0;
async function fillRouteChecks(r) {
  const my = ++routeCheckBusy;
  try {
    const stops = r.stops || [];
    await loadEvents(stops.map((s) => s.id));
    let pts = null;
    if (r.courier_id && r.status !== 'draft') {
      const [f, t] = routeWindow(r);
      pts = await trackRange(r.courier_id, f, t);
    }
    if (my !== routeCheckBusy) return;
    stops.forEach((s) => {
      const el = document.querySelector(`.s-check[data-stop="${s.id}"]`);
      if (el) el.innerHTML = checkHtml(s, evCache.get(s.id) || [], pts, r.route_date);
      applyHead(s, headInfo(s, evCache.get(s.id) || [], pts, r.route_date));
    });
  } catch (e) { /* нет связи — покажем, что есть */ }
}
async function fillPopupCheck(r, s, mk) {
  const el0 = document.querySelector(`.pp-check[data-stop="${s.id}"]`);
  if (el0 && s.status !== 'pending') el0.innerHTML = '<div class="ev-track">Проверяю отметку…</div>';
  try {
    await loadEvents([s.id]);
    let pts = null;
    if (r.courier_id && r.status !== 'draft') {
      const [f, t] = routeWindow(r);
      pts = await trackRange(r.courier_id, f, t);
    }
    const el = document.querySelector(`.pp-check[data-stop="${s.id}"]`);
    if (el) { el.innerHTML = checkHtml(s, evCache.get(s.id) || [], pts, r.route_date); applyHead(s, headInfo(s, evCache.get(s.id) || [], pts, r.route_date)); mk.getPopup?.()?.update?.(); }
  } catch (e) {
    const el = document.querySelector(`.pp-check[data-stop="${s.id}"]`);
    if (el) el.innerHTML = '';
  }
}

/* ===================================================================
 *  История: карта за прошедший день и проигрывание
 * =================================================================== */
const hist = {
  day: null, // null — карта «сейчас»
  loading: false, error: '', empty: false,
  routes: [], tracks: new Map(), // id курьера → { pts, ts }
  from: 0, to: 0, t: 0,
  playing: false, timer: null, speed: 300, focusRouteId: null, seq: 0,
};
const HIST_SPEEDS = [[60, '1 мин/с'], [300, '5 мин/с'], [900, '15 мин/с']];

function renderMapDay() {
  const box = $('#map-day');
  if (!box) return;
  const today = dateStr();
  const day = hist.day || today;
  const key = `${day}|${today}|${!!hist.day}`;
  if (box.dataset.key === key) { renderPlayer(); return; }
  box.dataset.key = key;
  box.innerHTML = `
    <button class="md-btn" data-act="map-day" data-d="-1" aria-label="Предыдущий день">${icon('left')}</button>
    <label class="md-label">${esc(dateLabel(day))}${!hist.day ? ' · сейчас' : day === today ? ' · запись' : ''}
      <input type="date" id="map-day-input" value="${day}" max="${today}" aria-label="Выбрать день"></label>
    ${hist.day ? '' : `<button class="md-btn md-play" data-act="map-replay" aria-label="Проиграть сегодняшний день" title="Проиграть день">${icon('play')}</button>`}
    <button class="md-btn" data-act="map-day" data-d="1" aria-label="${hist.day === today ? 'Вернуться к «сейчас»' : 'Следующий день'}"${hist.day ? '' : ' disabled'}>${icon('right')}</button>`;
  const inp = $('#map-day-input');
  inp.onchange = () => { if (inp.value) setMapDay(inp.value >= today ? null : inp.value); };
  renderPlayer();
}
// Сегодняшний день — тоже записью: пройденный путь и отметки с ползунком времени
actions['map-replay'] = () => setMapDay(dateStr(), null, true);
actions['map-day'] = (el) => {
  const day = addDays(hist.day || dateStr(), +el.dataset.d);
  setMapDay(day >= dateStr() ? null : day);
};

function openHistory(day, routeId) {
  closeAllSheets();
  switchTab('map');
  setMapDay(day, routeId);
}

function setMapDay(day, focusRouteId = null, force = false) {
  histPause();
  hist.focusRouteId = focusRouteId;
  if (!day || (day >= dateStr() && !force)) {
    hist.day = null; hist.routes = []; hist.tracks = new Map(); hist.error = ''; hist.empty = false;
    mapCtx.courierLayer?.clearLayers(); mapCtx.markers.clear();
    drawMap(); loadTracks();
    if (mapCtx.map) fitAll();
    return;
  }
  hist.day = day;
  loadHistory(day);
}

async function loadHistory(day) {
  const my = ++hist.seq;
  hist.loading = true; hist.error = ''; hist.empty = false; hist.routes = []; hist.tracks = new Map();
  drawMap();
  try {
    const startIso = parseDate(day).toISOString();
    const endIso = parseDate(addDays(day, 1)).toISOString();
    const routes = await state.api.dayRoutes(state.team.id, day);
    const tr = new Map();
    for (const c of state.couriers.values()) {
      const pts = await state.api.track(c.id, startIso, endIso);
      if (my !== hist.seq) return;
      if (pts.length) tr.set(c.id, { pts, ts: pts.map((p) => Date.parse(p.recorded_at)) });
    }
    if (my !== hist.seq) return;
    hist.routes = routes; hist.tracks = tr;
    const s = parseDate(day).getTime(); const e = parseDate(addDays(day, 1)).getTime();
    const times = [];
    tr.forEach((t) => { times.push(t.ts[0], t.ts[t.ts.length - 1]); });
    routes.forEach((r) => (r.stops || []).forEach((x) => { const ms = Date.parse(x.done_at || ''); if (ms >= s && ms < e) times.push(ms); }));
    hist.empty = !times.length && !routes.length;
    hist.from = times.length ? Math.min(...times) : s + 8 * 3600000;
    hist.to = times.length ? Math.max(...times) : s + 20 * 3600000;
    if (hist.to - hist.from < 60000) hist.to = hist.from + 60000;
    hist.t = hist.to;
  } catch (e) {
    if (my !== hist.seq) return;
    hist.error = errText(e);
  }
  hist.loading = false;
  drawMap();
  if (hist.focusRouteId) fitHistRoute(hist.focusRouteId); else fitAll();
}

/** Точки трека курьера до момента t. */
function histPts(id, t) {
  const tr = hist.tracks.get(id);
  if (!tr) return [];
  let lo = 0; let hi = tr.ts.length; // первый индекс с ts > t
  while (lo < hi) { const m = (lo + hi) >> 1; if (tr.ts[m] <= t) lo = m + 1; else hi = m; }
  return tr.pts.slice(0, lo);
}
/** Состояние точки на момент t: done | failed | ok (ещё не отмечена) | late (окно прошло) | idle (так и не отмечена). */
function histStopState(r, s, t) {
  const closedAt = s.status !== 'pending' ? (Date.parse(s.done_at || '') || hist.to) : null;
  if (closedAt != null && closedAt <= t) return s.status;
  const to = atTime(s.time_to, r.route_date);
  if (to != null && t > to) return 'late';
  if (t >= hist.to && closedAt == null && hist.day < dateStr()) return 'idle'; // сегодня точка ещё может быть впереди
  return 'ok';
}

function drawHistory() {
  const t = hist.t;
  mapCtx.trackLayer.clearLayers();
  mapCtx.routeLayer.clearLayers();
  mapCtx.courierLayer.clearLayers(); mapCtx.markers.clear();
  renderMapChips();
  if (hist.loading || hist.error) return;

  hist.tracks.forEach((tr, id) => {
    const c = state.couriers.get(id);
    const pts = histPts(id, t);
    if (pts.length > 1) {
      let m = 0;
      for (let i = 1; i < pts.length; i++) m += distM(pts[i - 1], pts[i]);
      L.polyline(pts.map((p) => [p.lat, p.lng]), { color: courierColor(id), weight: 5, opacity: 0.75, lineJoin: 'round' })
        .bindPopup(`<b>${esc(firstName(c?.name))}</b><br>Пройдено к ${timeOf(t)} · ${fmtDist(m)}`)
        .addTo(mapCtx.trackLayer);
    }
    const p = pts[pts.length - 1];
    if (p) {
      const fresh = t - Date.parse(p.recorded_at) < 10 * 60000;
      const html = `<div class="cmark hist${fresh ? '' : ' stale'}"><div class="cm-dot" style="background:${courierColor(id)}">${esc(initials(c?.name || '?'))}</div><div class="cm-name">${esc(firstName(c?.name))}</div></div>`;
      const sp = p.speed != null && p.speed > 1 ? ` · ${Math.round(p.speed * 3.6)} км/ч` : '';
      L.marker([p.lat, p.lng], { icon: L.divIcon({ html, className: '', iconSize: [70, 54], iconAnchor: [35, 20] }), zIndexOffset: 1000 })
        .bindPopup(`<b>${esc(firstName(c?.name))}</b><br>здесь в ${timeOf(p.recorded_at)}${sp}${fresh ? '' : '<br><span style="color:#64748B">дальше нет данных о местоположении</span>'}`)
        .addTo(mapCtx.courierLayer);
    }
  });

  hist.routes.forEach((r) => {
    const c = state.couriers.get(r.courier_id);
    const color = courierColor(r.courier_id);
    const stops = courierOrder(r);
    const focus = hist.focusRouteId === r.id;
    stops.forEach((s, i) => {
      if (s.lat == null) return;
      const st = histStopState(r, s, t);
      const size = focus ? 24 : 20;
      const mk = L.marker([s.lat, s.lng], {
        icon: L.divIcon({
          html: `<div class="smark st-${st}" style="background:${color}"></div><span class="snum" style="border-color:${color}">${i + 1}</span>`,
          className: 'smark-wrap', iconSize: [size, size], iconAnchor: [size / 2, size / 2],
        }),
        zIndexOffset: st === 'late' ? 600 : focus ? 500 : 0,
      });
      const done = s.status !== 'pending' && st === s.status;
      const lines = [
        `<b>${esc(firstName(c?.name))} · точка ${i + 1} из ${stops.length}</b>`,
        `<span style="color:#64748B">${esc(r.title || 'Маршрут')} · ${esc(dateLabel(r.route_date))}</span>`,
        esc(s.address),
        clientHtml(s),
        s.time_from || s.time_to ? `окно ${esc(s.time_from || '…')}–${esc(s.time_to || '…')}` : '',
        done ? `<span class="hd hd-${s.status}" data-head="${s.id}">${headText(s, null, false)}</span>` : '',
        !done && st === 'late' ? `<span style="color:#E11D48">окно прошло, к ${timeOf(t)} не отмечена</span>` : '',
        !done && st === 'ok' ? `<span style="color:#A16207">к ${timeOf(t)} ещё не отмечена</span>` : '',
        st === 'idle' ? '<span style="color:#64748B">так и не отмечена</span>' : '',
      ].filter(Boolean);
      mk.bindPopup(lines.join('<br>') + `<div class="pp-check" data-stop="${s.id}"></div>`, { maxWidth: 280 }).addTo(mapCtx.routeLayer);
      mk.on('popupopen', () => fillPopupCheck(r, s, mk));
    });
  });
}

function histChips() {
  if (hist.loading) return '<span class="map-chip">Загружаю день…</span>';
  if (hist.error) return `<span class="map-chip">Не удалось загрузить: ${esc(hist.error)}</span>`;
  if (hist.empty) return '<span class="map-chip">За этот день нет данных</span>';
  const ids = [...new Set([...hist.routes.map((r) => r.courier_id).filter(Boolean), ...hist.tracks.keys()])];
  return ids.map((id) => {
    const c = state.couriers.get(id);
    let done = 0; let total = 0; let late = 0;
    hist.routes.filter((r) => r.courier_id === id).forEach((r) => (r.stops || []).forEach((s) => {
      total++;
      const st = histStopState(r, s, hist.t);
      if (st === 'done' || st === 'failed') done++;
      if (st === 'late') late++;
    }));
    return `<button class="map-chip" data-act="map-courier" data-id="${id}">
      <i style="background:${courierColor(id)}"></i>${esc(firstName(c?.name))}${total ? ` · ${done}/${total}` : ' · без маршрута'}${late ? `<b class="late">${late}</b>` : ''}</button>`;
  }).join('') || '<span class="map-chip">За этот день нет данных</span>';
}

function histCourierPoints(id) {
  const pts = (hist.tracks.get(id)?.pts || []).map((p) => [p.lat, p.lng]);
  hist.routes.filter((r) => r.courier_id === id).forEach((r) => (r.stops || []).forEach((s) => { if (s.lat != null) pts.push([s.lat, s.lng]); }));
  return pts;
}
function histAllPoints() {
  const ids = new Set([...hist.tracks.keys(), ...hist.routes.map((r) => r.courier_id)]);
  const pts = [];
  ids.forEach((id) => pts.push(...histCourierPoints(id)));
  hist.routes.filter((r) => !r.courier_id).forEach((r) => (r.stops || []).forEach((s) => { if (s.lat != null) pts.push([s.lat, s.lng]); }));
  return pts;
}
function fitHistRoute(id) {
  const r = hist.routes.find((x) => x.id === id);
  if (!r) { fitAll(); toast('Этого маршрута нет на карте за этот день', 'info'); return; }
  const pts = (r.stops || []).filter((s) => s.lat != null).map((s) => [s.lat, s.lng]);
  // трек курьера за время маршрута
  const s0 = Date.parse(r.started_at || r.accepted_at || '') || hist.from;
  const s1 = Date.parse(r.finished_at || '') || hist.to;
  const tr = hist.tracks.get(r.courier_id);
  if (tr) tr.pts.forEach((p, i) => { if (tr.ts[i] >= s0 && tr.ts[i] <= s1) pts.push([p.lat, p.lng]); });
  if (pts.length) boundsOf(pts); else fitAll();
}

/* ---------- проигрыватель ---------- */
function renderPlayer() {
  const box = $('#map-player');
  if (!box) return;
  const on = !!hist.day && !hist.loading && !hist.error && !hist.empty;
  box.hidden = !on;
  if (!on) return;
  const sp = HIST_SPEEDS.find(([v]) => v === hist.speed) || HIST_SPEEDS[1];
  if (!box.firstChild) {
    box.innerHTML = `
      <button class="mp-play" data-act="hist-play" aria-label="Проиграть" id="mp-play"></button>
      <div class="mp-mid"><input type="range" id="mp-range" step="60000" aria-label="Время">
        <div class="mp-times"><span id="mp-from"></span><b id="mp-t"></b><span id="mp-to"></span></div></div>
      <button class="mp-speed" data-act="hist-speed" id="mp-speed"></button>`;
    $('#mp-range').oninput = (e) => { histPause(); hist.t = +e.target.value; drawMap(); };
  }
  $('#mp-play').innerHTML = icon(hist.playing ? 'pause' : 'play');
  $('#mp-play').setAttribute('aria-label', hist.playing ? 'Пауза' : 'Проиграть');
  const rg = $('#mp-range');
  rg.min = hist.from; rg.max = hist.to;
  if (+rg.value !== hist.t) rg.value = hist.t;
  $('#mp-from').textContent = timeOf(hist.from);
  $('#mp-to').textContent = timeOf(hist.to);
  $('#mp-t').textContent = timeOf(hist.t);
  $('#mp-speed').textContent = sp[1];
}
function histPause() {
  if (!hist.playing) return;
  hist.playing = false; clearInterval(hist.timer); hist.timer = null;
  renderPlayer();
}
actions['hist-play'] = () => {
  if (hist.playing) { histPause(); return; }
  if (hist.t >= hist.to) hist.t = hist.from;
  hist.playing = true;
  const STEP = 200;
  hist.timer = setInterval(() => {
    hist.t = Math.min(hist.to, hist.t + hist.speed * STEP);
    if (hist.t >= hist.to) histPause();
    drawMap();
  }, STEP);
  drawMap();
};
actions['hist-speed'] = () => {
  const i = HIST_SPEEDS.findIndex(([v]) => v === hist.speed);
  hist.speed = HIST_SPEEDS[(i + 1) % HIST_SPEEDS.length][0];
  renderPlayer();
};

/* ===================================================================
 *  Запуск
 * =================================================================== */
async function afterApi() {
  if (state.api.kind === 'supabase') {
    state.api.onAuth((ev) => { if (ev === 'SIGNED_OUT' && state.team) location.reload(); });
  }
  const session = await state.api.session();
  if (!session) { renderAuth('in'); return; }
  await afterAuth();
}

async function afterAuth() {
  state.email = await state.api.userEmail();
  try {
    state.team = await state.api.myTeam();
  } catch (e) {
    toast(errText(e), 'bad', 8000);
    renderAuth('in', errText(e));
    return;
  }
  if (!state.team) { renderTeamSetup(); return; }
  renderMain();
}

async function boot() {
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  if (settings.demo) { state.api = makeDemoApi(); await afterApi(); return; }
  if (!settings.supabaseUrl || !settings.supabaseKey) { renderSetup(); return; }
  try {
    await loadScript(CDN.supabase);
  } catch (e) {
    $('#app').innerHTML = `<div class="screen"><div class="screen-inner"><h1>Нет связи</h1><p class="lead">Не удалось загрузить приложение. Проверьте интернет.</p><button class="btn primary block" data-act="reload">Повторить</button></div></div>`;
    return;
  }
  state.api = makeSupabaseApi(settings.supabaseUrl, settings.supabaseKey);
  await afterApi();
}

window.__dm = { state, settings }; // для отладки в консоли
boot().catch((e) => { console.error(e); toast(errText(e), 'bad', 8000); });
})();
