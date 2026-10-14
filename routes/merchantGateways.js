import express from 'express';
import { memoryStore } from '../db/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'SuperAdmin privilege required.' });
  }
  next();
}

export const defaultMerchantGateways = {
  easypaisa: {
    enabled: true,
    title: 'Easypaisa Mobile Wallet & Merchant QR',
    account_title: 'ORBIT-I Private Limited',
    account_number: '03190375751',
    store_id: 'EP-ORBIT-2026',
    hash_key: '',
    api_mode: 'manual', // 'manual' for TID review, 'api' for automated open API
    instructions: 'Send subscription fee or ticket amount to Easypaisa Account 03190375751. Enter the 11-digit Transaction ID (TID) below.'
  },
  jazzcash: {
    enabled: true,
    title: 'JazzCash Mobile Wallet & Till',
    account_title: 'ORBIT-I Private Limited',
    account_number: '03001234567',
    till_id: 'JC-ORBIT-8899',
    merchant_id: '',
    password: '',
    salt: '',
    api_mode: 'manual',
    instructions: 'Send amount to JazzCash Till/Wallet 03001234567. Enter the Transaction Reference (TID) below for verification.'
  },
  raast: {
    enabled: true,
    title: 'Raast Instant Pay (State Bank of Pakistan)',
    account_title: 'ORBIT-I Private Limited',
    iban: 'PK45MEZN0001234567890101',
    raast_id: '03190375751',
    instructions: 'Pay instantly with zero bank charges via any Pakistani mobile banking app using Raast ID 03190375751 or IBAN.'
  },
  bank_transfer: {
    enabled: true,
    title: 'Direct Bank Transfer (Corporate Clearing)',
    bank_name: 'Meezan Bank Limited',
    account_title: 'ORBIT-I Private Limited',
    account_number: '01020304050607',
    iban: 'PK45MEZN0001234567890101',
    branch: 'F-7 Markaz Branch, Islamabad',
    instructions: 'Transfer funds directly to our Meezan Bank corporate account. Enter bank transfer transaction ID and submit.'
  },
  safepay: {
    enabled: true,
    title: 'Safepay Pakistan (Debit / Credit Cards & PayPak)',
    public_key: 'sec_sandbox_eventorax_2026',
    secret_key: '',
    environment: 'sandbox',
    instructions: 'Secure Visa, Mastercard and PayPak processing via Safepay Pakistan.'
  },
  stripe: {
    enabled: true,
    title: 'Stripe International (Global USD Cards)',
    publishable_key: 'pk_test_eventorax_global_2026',
    secret_key: '',
    instructions: 'Accept all international Visa, Mastercard, AMEX and Apple Pay.'
  }
};

if (!memoryStore.merchant_gateways) {
  memoryStore.merchant_gateways = { ...defaultMerchantGateways };
}

// GET /api/public/merchant-gateways - Public view of enabled payment details for checkout
router.get('/public', (req, res) => {
  const g = memoryStore.merchant_gateways || defaultMerchantGateways;
  const publicConfig = {
    easypaisa: {
      enabled: Boolean(g.easypaisa?.enabled),
      title: g.easypaisa?.title,
      account_title: g.easypaisa?.account_title,
      account_number: g.easypaisa?.account_number,
      instructions: g.easypaisa?.instructions
    },
    jazzcash: {
      enabled: Boolean(g.jazzcash?.enabled),
      title: g.jazzcash?.title,
      account_title: g.jazzcash?.account_title,
      account_number: g.jazzcash?.account_number,
      till_id: g.jazzcash?.till_id,
      instructions: g.jazzcash?.instructions
    },
    raast: {
      enabled: Boolean(g.raast?.enabled),
      title: g.raast?.title,
      account_title: g.raast?.account_title,
      iban: g.raast?.iban,
      raast_id: g.raast?.raast_id,
      instructions: g.raast?.instructions
    },
    bank_transfer: {
      enabled: Boolean(g.bank_transfer?.enabled),
      title: g.bank_transfer?.title,
      bank_name: g.bank_transfer?.bank_name,
      account_title: g.bank_transfer?.account_title,
      account_number: g.bank_transfer?.account_number,
      iban: g.bank_transfer?.iban,
      branch: g.bank_transfer?.branch,
      instructions: g.bank_transfer?.instructions
    },
    safepay: {
      enabled: Boolean(g.safepay?.enabled),
      title: g.safepay?.title,
      public_key: g.safepay?.public_key,
      environment: g.safepay?.environment || 'sandbox',
      instructions: g.safepay?.instructions
    },
    stripe: {
      enabled: Boolean(g.stripe?.enabled),
      title: g.stripe?.title,
      publishable_key: g.stripe?.publishable_key,
      instructions: g.stripe?.instructions
    }
  };
  return res.json({ success: true, gateways: publicConfig });
});

// GET /api/admin/merchant-gateways - SuperAdmin retrieve complete configuration
router.get('/', verifyToken, requireSuperAdmin, (req, res) => {
  const g = memoryStore.merchant_gateways || defaultMerchantGateways;
  return res.json({ success: true, gateways: g });
});

// PUT /api/admin/merchant-gateways - SuperAdmin update configuration & credentials
router.put('/', verifyToken, requireSuperAdmin, (req, res) => {
  try {
    const { gateways } = req.body || {};
    if (!gateways) {
      return res.status(400).json({ success: false, message: 'Gateways configuration required.' });
    }
    memoryStore.merchant_gateways = {
      ...(memoryStore.merchant_gateways || defaultMerchantGateways),
      ...gateways
    };
    return res.json({
      success: true,
      message: 'Payment Gateways & Merchant Credentials updated live!',
      gateways: memoryStore.merchant_gateways
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update gateway settings.' });
  }
});

export default router;
