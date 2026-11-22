// Pure business rules — no database, easy to unit-test. All money is integer paise.

/** Points earned on `eligiblePaise` of spend (items after discounts, excluding shipping/tax/points-paid). */
export function earnPoints(eligiblePaise, s) {
  if (eligiblePaise <= 0) return 0;
  return Math.floor((eligiblePaise * s.earnPer100Rupees) / 10000);
}

export function pointsToPaise(points, s) {
  return points * s.redeemValuePaise;
}

/** Most points a customer may use on this cart (0 if below the minimum). */
export function allowedRedeemPoints({ cartPaise, balance, requested }, s) {
  const maxByCart = Math.floor((cartPaise * s.maxPercent) / 100 / s.redeemValuePaise);
  const pts = Math.max(0, Math.min(requested, balance, maxByCart));
  return pts < s.minRedeem ? 0 : pts;
}
