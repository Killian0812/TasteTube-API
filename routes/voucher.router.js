const express = require('express');
const router = express.Router();
const {
  createVoucher,
  getVoucherByCode,
  getAllVouchers,
  getShopVouchers,
  validateVoucher,
  deleteVoucher,
  updateVoucher,
} = require('../controllers/voucher.controller');

router.post('/', createVoucher);
router.get('/', getAllVouchers);
router.get('/:code', getVoucherByCode);
router.get('/shop/:shopId', getShopVouchers);
router.post('/validate', validateVoucher);
router.delete('/:id', deleteVoucher);
router.put('/:id', updateVoucher);

module.exports = router;