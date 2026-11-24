// Payment provider abstraction.
// Interface: initiate({ method, amount, orderId, txnId, cardLast4 }) -> { ok, status, message, reference }
// Demo provider simulates verification (no real money moves). Production providers
// (bKash/Nagad/card gateway) must verify server-side in functions/verifyPayment —
// a frontend "payment success" message is NEVER trusted. Card numbers / CVV are
// never stored anywhere; only the last 4 digits (cardLast4) are recorded.
import { isDemoMode } from '../lib/firebase'

export const PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash on Delivery', labelBn: 'ক্যাশ অন ডেলিভারি' },
  { id: 'bkash', label: 'bKash', labelBn: 'বিকাশ' },
  { id: 'nagad', label: 'Nagad', labelBn: 'নগদ' },
  { id: 'card', label: 'Card Payment', labelBn: 'কার্ড পেমেন্ট' },
]

const demoProvider = {
  async initiate({ method, amount, txnId }) {
    await new Promise((r) => setTimeout(r, 600))
    if (method === 'cod') return { ok: true, status: 'cod_pending', message: 'Pay on delivery.', reference: '' }
    if ((method === 'bkash' || method === 'nagad') && !txnId) return { ok: false, status: 'failed', message: 'TrxID is required for bKash/Nagad.' }
    return { ok: true, status: 'awaiting_verification', message: 'Payment submitted. Our team will verify the TrxID.', reference: txnId || '' }
  },
}

export async function initiatePayment(args) {
  if (isDemoMode) return demoProvider.initiate(args)
  // Firebase mode: call the verifyPayment Cloud Function after the gateway callback.
  // The gateway callback itself must hit functions/verifyPayment server-side.
  return demoProvider.initiate(args)
}
export function validatePaymentInput(method, { txnId, cardNumber, expiry, cvc }) {
  if ((method === 'bkash' || method === 'nagad') && !String(txnId || '').trim()) return 'TrxID \u09a6\u09bf\u09a8।'
  if (method === 'card') {
    const digits = String(cardNumber || '').replace(/\D/g, '')
    if (digits.length < 15 || digits.length > 16) return 'সঠিক কার্ড নম্বর দিন।'
    if (!/^\d{2}\/\d{2}$/.test(String(expiry || ''))) return 'মেয়াদ MM/YY ফরম্যাটে দিন।'
    if (!/^\d{3,4}$/.test(String(cvc || ''))) return 'সঠিক CVC দিন।'
  }
  return ''
}
