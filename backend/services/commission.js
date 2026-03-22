const COMMISSION_RATE = 0.05; // 5%

const calculateCommission = (totalAmount) => {
  const commission = Math.round(totalAmount * COMMISSION_RATE * 100) / 100;
  const supplierAmount = Math.round((totalAmount - commission) * 100) / 100;
  return { commission, supplierAmount, commissionRate: COMMISSION_RATE };
};

module.exports = { calculateCommission, COMMISSION_RATE };
