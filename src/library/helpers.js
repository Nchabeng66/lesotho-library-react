// Provides small tools used by different parts of the app.

import { CURRENCY, LOW_STOCK_THRESHOLD } from './constants.js';

// Makes a new ID for a book, member, or transaction.
export function generateId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// Checks whether a value contains only numbers.
export function isDigitsOnly(value) {
  return /^\d+$/.test(value.trim());
}

// Checks that a name or title has no numbers.
export function hasNoDigits(value) {
  return !/\d/.test(value);
}

// Removes letters or numbers from typed text.
export const stripDigits = (value) => value.replace(/\d/g, '');
export const onlyDigits = (value) => value.replace(/\D/g, '');

// Prepares an uploaded file so the browser can save it.
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function formatDate(isoString) {
  if (!isoString) return '\u2014';
  const d = new Date(isoString);
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isValidIsbn(raw) {
  const digits = raw.replace(/[-\s]/g, '');
  return /^\d{10}(\d{3})?$/.test(digits); // ISBNs have 10 or 13 numbers.
}

export function isValidUrl(raw) {
  try {
    const u = new URL(raw.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// Checks useful facts about a book.
export const isLowStock = (book) => book.quantity < LOW_STOCK_THRESHOLD;
export const isFree = (book) => !book.price || book.price <= 0;
export const hasFile = (book) => Boolean(book.fileData);
export const priceLabel = (book) => (isFree(book) ? 'Free' : `${CURRENCY}${book.price}`);

// Checks if a borrowed book is late.
export function isOverdue(entry) {
  return !entry.returnedAt && Boolean(entry.dueDate) && new Date(entry.dueDate) < new Date();
}

// Finds the next membership number that is not being used.
export function nextMembershipId(users) {
  const numbers = users
    .map((u) => u.membershipId)
    .filter(Boolean)
    .map((id) => parseInt(String(id).replace('MEM-', ''), 10))
    .filter((n) => !Number.isNaN(n));

  let candidate = (numbers.length ? Math.max(...numbers) : 1000) + 1;

  // Try the next number if this one is already in use.
  while (users.some((u) => u.membershipId === `MEM-${candidate}`)) {
    candidate += 1;
  }
  return `MEM-${candidate}`;
}

// Downloads a saved book file to the user's device.
export function triggerDownload(book) {
  const a = document.createElement('a');
  a.href = book.fileData;
  a.download = book.fileName || book.title;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
