import { Money } from './money';

describe('Money Utility', () => {
  describe('round', () => {
    it('should round to 2 decimal places', () => {
      expect(Money.round(10.126)).toBe(10.13);
      expect(Money.round(10.124)).toBe(10.12);
      expect(Money.round(10.125)).toBe(10.13);
    });

    it('should handle negative values', () => {
      expect(Money.round(-10.126)).toBe(-10.13);
    });

    it('should handle whole numbers', () => {
      expect(Money.round(10)).toBe(10);
      expect(Money.round(10.0)).toBe(10);
    });
  });

  describe('add', () => {
    it('should add values with proper rounding', () => {
      expect(Money.add(10.10, 5.05)).toBe(15.15);
      expect(Money.add(0.1, 0.2)).toBe(0.30);
    });

    it('should handle large sums', () => {
      expect(Money.add(1000.99, 2000.99)).toBe(3001.98);
    });
  });

  describe('subtract', () => {
    it('should subtract values with proper rounding', () => {
      expect(Money.subtract(10.50, 5.25)).toBe(5.25);
      expect(Money.subtract(0.3, 0.1)).toBe(0.20);
    });
  });

  describe('multiply', () => {
    it('should multiply with proper rounding', () => {
      expect(Money.multiply(10.00, 3)).toBe(30.00);
      expect(Money.multiply(3.33, 3)).toBe(9.99);
      expect(Money.multiply(1.5, 2.5)).toBe(3.75);
    });

    it('should handle decimal quantities', () => {
      expect(Money.multiply(10.50, 1.5)).toBe(15.75);
    });
  });

  describe('divide', () => {
    it('should divide with proper rounding', () => {
      expect(Money.divide(10.00, 3)).toBe(3.33);
      expect(Money.divide(100.00, 7)).toBe(14.29);
    });

    it('should throw error on division by zero', () => {
      expect(() => Money.divide(10, 0)).toThrow('Division by zero');
    });
  });

  describe('distributeProportionally', () => {
    it('should distribute equally for equal weights', () => {
      const result = Money.distributeProportionally(10.00, [1, 1, 1]);
      expect(result).toEqual([3.33, 3.33, 3.34]);
      expect(Money.sum(result)).toBe(10.00);
    });

    it('should distribute proportionally for different weights', () => {
      const result = Money.distributeProportionally(100.00, [1, 2, 3]);
      expect(result).toEqual([16.67, 33.33, 50.00]);
      expect(Money.sum(result)).toBe(100.00);
    });

    it('should handle edge case: single item', () => {
      const result = Money.distributeProportionally(50.00, [1]);
      expect(result).toEqual([50.00]);
    });

    it('should handle edge case: empty array', () => {
      const result = Money.distributeProportionally(100.00, []);
      expect(result).toEqual([]);
    });

    it('should handle edge case: zero total', () => {
      const result = Money.distributeProportionally(0, [1, 2, 3]);
      expect(result).toEqual([0, 0, 0]);
    });

    it('should handle edge case: zero weights', () => {
      const result = Money.distributeProportionally(100.00, [0, 0, 0]);
      expect(result).toEqual([0, 0, 0]);
    });

    it('should guarantee sum equals total (critical test)', () => {
      // Test various totals and weight combinations
      const testCases = [
        { total: 400.00, weights: [133.333, 133.333, 133.334] },
        { total: 1000.00, weights: [1, 1, 1, 1, 1, 1, 1] },
        { total: 99.99, weights: [0.1, 0.2, 0.3, 0.4] },
        { total: 5750.01, weights: [100, 200, 300, 400, 500] },
      ];

      for (const { total, weights } of testCases) {
        const result = Money.distributeProportionally(total, weights);
        const sum = Money.sum(result);
        expect(sum).toBe(total);
      }
    });

    it('should handle real-world shipping scenario', () => {
      // Simulate the exact scenario from the bug report
      const shippingCost = 400.00;
      const weights = [10, 10, 10]; // 3 orders with equal weight

      const result = Money.distributeProportionally(shippingCost, weights);

      // Verify sum equals exact shipping cost
      expect(Money.sum(result)).toBe(shippingCost);

      // Verify no value is negative or invalid
      result.forEach(fee => {
        expect(fee).toBeGreaterThanOrEqual(0);
        expect(Money.isValid(fee)).toBe(true);
      });
    });
  });

  describe('sum', () => {
    it('should sum array of values with proper rounding', () => {
      expect(Money.sum([10.10, 20.20, 30.30])).toBe(60.60);
      expect(Money.sum([3.33, 3.33, 3.34])).toBe(10.00);
    });

    it('should handle empty array', () => {
      expect(Money.sum([])).toBe(0);
    });

    it('should handle single value', () => {
      expect(Money.sum([42.50])).toBe(42.50);
    });
  });

  describe('equals', () => {
    it('should compare monetary values for equality', () => {
      expect(Money.equals(10.00, 10.00)).toBe(true);
      expect(Money.equals(10.00, 10.01)).toBe(false);
    });

    it('should handle floating-point tolerance', () => {
      expect(Money.equals(10.001, 10.000, 0.01)).toBe(true);
      expect(Money.equals(10.02, 10.00, 0.01)).toBe(false);
    });

    it('should use default tolerance', () => {
      expect(Money.equals(10.004, 10.000)).toBe(true); // 0.004 < 0.005 default tolerance
      expect(Money.equals(10.006, 10.000)).toBe(false); // 0.006 >= 0.005 default tolerance
    });
  });

  describe('format', () => {
    it('should format as BRL currency', () => {
      // Note: Intl.NumberFormat uses non-breaking space (U+00A0) not regular space
      expect(Money.format(1234.56)).toBe('R$\u00a01.234,56');
      expect(Money.format(0.50)).toBe('R$\u00a00,50');
      expect(Money.format(1000000.00)).toBe('R$\u00a01.000.000,00');
    });

    it('should handle zero', () => {
      expect(Money.format(0)).toBe('R$\u00a00,00');
    });
  });

  describe('isValid', () => {
    it('should validate monetary values', () => {
      expect(Money.isValid(100.00)).toBe(true);
      expect(Money.isValid(0)).toBe(true);
      expect(Money.isValid(0.01)).toBe(true);
    });

    it('should reject negative values', () => {
      expect(Money.isValid(-10)).toBe(false);
    });

    it('should reject NaN', () => {
      expect(Money.isValid(NaN)).toBe(false);
    });

    it('should reject Infinity', () => {
      expect(Money.isValid(Infinity)).toBe(false);
      expect(Money.isValid(-Infinity)).toBe(false);
    });

    it('should reject non-numbers', () => {
      expect(Money.isValid('100' as any)).toBe(false);
      expect(Money.isValid(null as any)).toBe(false);
      expect(Money.isValid(undefined as any)).toBe(false);
    });
  });
});
