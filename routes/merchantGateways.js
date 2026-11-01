import express from 'express';
import { memoryStore, saveLocalStore } from '../db/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'SuperAdmin privilege required.' });
  }
  next();
}

export const defaultMerchantGateways = {
  sadapay: {
    enabled: true,
    title: 'SadaPay Business & Personal',
    account_title: 'ORBIT-I Private Limited',
    account_number: '03190375751',
    iban: 'PK03SADA0000003190375751',
    api_mode: 'manual',
    instructions: 'Send payment to SadaPay account 03190375751 (IBAN: PK03SADA0000003190375751). Enter the Transaction ID (TID) from your receipt.'
  },
  nayapay: {
    enabled: true,
    title: 'NayaPay Wallet & ID',
    account_title: 'ORBIT-I Private Limited',
    account_number: '03190375751',
    nayapay_id: 'orbit-i@nayapay',
    api_mode: 'manual',
    instructions: 'Send payment to NayaPay ID orbit-i@nayapay or mobile 03190375751. Enter your NayaPay Transaction Reference ID (TID).'
  }
};

if (!memoryStore.merchant_gateways || !memoryStore.merchant_gateways.sadapay) {
  memoryStore.merchant_gateways = { ...defaultMerchantGateways };
  saveLocalStore();
}

// GET /api/public/merchant-gateways - Public view of enabled payment details for checkout
router.get('/public', (req, res) => {
  const g = memoryStore.merchant_gateways || defaultMerchantGateways;
  const publicConfig = {
    sadapay: {
      enabled: g.sadapay?.enabled !== false,
      title: g.sadapay?.title || 'SadaPay Business & Personal',
      account_title: g.sadapay?.account_title || 'ORBIT-I Private Limited',
      account_number: g.sadapay?.account_number || '03190375751',
      iban: g.sadapay?.iban || 'PK03SADA0000003190375751',
      instructions: g.sadapay?.instructions || 'Send amount to SadaPay Account 03190375751 (IBAN: PK03SADA0000003190375751).'
    },
    nayapay: {
      enabled: g.nayapay?.enabled !== false,
      title: g.nayapay?.title || 'NayaPay Wallet & ID',
      account_title: g.nayapay?.account_title || 'ORBIT-I Private Limited',
      account_number: g.nayapay?.account_number || '03190375751',
      nayapay_id: g.nayapay?.nayapay_id || 'orbit-i@nayapay',
      instructions: g.nayapay?.instructions || 'Send amount to NayaPay ID orbit-i@nayapay or mobile 03190375751.'
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
    saveLocalStore();
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
