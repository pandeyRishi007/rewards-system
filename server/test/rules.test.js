import test from 'node:test';
import assert from 'node:assert/strict';
import { earnPoints, allowedRedeemPoints, pointsToPaise } from '../src/services/rules.js';
import { DEFAULT_SETTINGS as S } from '../src/models/Settings.js';

test('earn: 10 points per ₹100, floored', () => {
  assert.equal(earnPoints(200000, S), 200); // ₹2,000
  assert.equal(earnPoints(199999, S), 199); // ₹1,999.99
  assert.equal(earnPoints(0, S), 0);
  assert.equal(earnPoints(-500, S), 0);
});

test('points are worth ₹0.50 each by default', () => {
  assert.equal(pointsToPaise(100, S), 5000);
});

test('redeem is capped by balance, by max % of cart, and needs the minimum', () => {
  // Cart ₹100: 50% = ₹50 = 100 points
  assert.equal(allowedRedeemPoints({ cartPaise: 10000, balance: 1000, requested: 500 }, S), 100);
  // Balance is the limit
  assert.equal(allowedRedeemPoints({ cartPaise: 1000000, balance: 150, requested: 500 }, S), 150);
  // Below the minimum (100) -> nothing allowed
  assert.equal(allowedRedeemPoints({ cartPaise: 1000000, balance: 99, requested: 99 }, S), 0);
  // Requested less than the minimum -> nothing allowed
  assert.equal(allowedRedeemPoints({ cartPaise: 1000000, balance: 1000, requested: 50 }, S), 0);
});

test('max percent 0 disables redemption', () => {
  assert.equal(allowedRedeemPoints({ cartPaise: 1000000, balance: 1000, requested: 1000 }, { ...S, maxPercent: 0 }), 0);
});
