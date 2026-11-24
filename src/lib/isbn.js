// ISBN-10 / ISBN-13 validation (check-digit) + normalisation.
// Used by the seller Add-Book form; duplicate-ISBN guard lives in lib/firestore.js.
export function normalizeIsbn(raw) {
  return String(raw || '').replace(/[^0-9Xx]/g, '').toUpperCase()
}
export function isValidIsbn(raw) {
  const isbn = normalizeIsbn(raw)
  if (isbn.length === 13) {
    if (!/^\d{13}$/.test(isbn)) return false
    let sum = 0
    for (let i = 0; i < 12; i++) sum += parseInt(isbn[i], 10) * (i % 2 === 0 ? 1 : 3)
    return (10 - (sum % 10)) % 10 === parseInt(isbn[12], 10)
  }
  if (isbn.length === 10) {
    if (!/^\d{9}[\dX]$/.test(isbn)) return false
    let sum = 0
    for (let i = 0; i < 9; i++) sum += parseInt(isbn[i], 10) * (10 - i)
    sum += isbn[9] === 'X' ? 10 : parseInt(isbn[9], 10)
    return sum % 11 === 0
  }
  return false
}
export function isbnError(raw) {
  const isbn = normalizeIsbn(raw)
  if (!isbn) return 'ISBN \u09a6\u09bf\u09a8'
  if (isbn.length !== 10 && isbn.length !== 13) return 'ISBN \u09e7\u09e6 \u0985\u09a5\u09ac\u09be \u09e7\u09e6 \u0985\u0995\u09cd\u09b0\u09c7\u09b0 \u09b9\u09a4\u09c7 \u09b9\u09ac\u09c7'
  if (!isValidIsbn(raw)) return 'ISBN \u099a\u09c7\u0995 \u09a1\u09bf\u099c\u09bf\u099f\u09bf\u099f \u09a0\u09bf\u0995 \u09a8\u09df'
  return ''
}
