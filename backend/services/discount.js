/**
 * Apply the best matching discount tier for a given quantity.
 * Discount tiers should be sorted so the highest minQty that qualifies is applied.
 * 
 * @param {number} unitPrice - Price per unit
 * @param {number} quantity - Ordered quantity
 * @param {Array} discountTiers - [{minQty, discountPercent}]
 * @returns {{ subtotal, discount, finalPrice, appliedDiscount }}
 */
const applyDiscount = (unitPrice, quantity, discountTiers = []) => {
  const subtotal = unitPrice * quantity;
  
  if (!discountTiers || discountTiers.length === 0) {
    return { subtotal, discount: 0, finalPrice: subtotal, appliedDiscount: null };
  }

  // Sort tiers descending by minQty to find highest qualifying tier
  const sortedTiers = [...discountTiers].sort((a, b) => b.minQty - a.minQty);
  const appliedTier = sortedTiers.find(tier => quantity >= tier.minQty);

  if (!appliedTier) {
    return { subtotal, discount: 0, finalPrice: subtotal, appliedDiscount: null };
  }

  const discount = Math.round(subtotal * (appliedTier.discountPercent / 100) * 100) / 100;
  const finalPrice = Math.round((subtotal - discount) * 100) / 100;

  return {
    subtotal,
    discount,
    finalPrice,
    appliedDiscount: {
      minQty: appliedTier.minQty,
      discountPercent: appliedTier.discountPercent
    }
  };
};

module.exports = { applyDiscount };
