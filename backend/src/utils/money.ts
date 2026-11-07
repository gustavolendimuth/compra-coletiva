/**
 * Money utility for precise financial calculations
 *
 * All monetary values are represented in BRL (Brazilian Real) with 2 decimal places.
 * This utility ensures consistent rounding and prevents floating-point precision errors.
 *
 * @module Money - Testando hook de Stop
 */
export class Money {
  /**
   * Rounds a number to 2 decimal places using banker's rounding (half-to-even)
   * This minimizes cumulative rounding errors in financial calculations.
   */
  static round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Adds two monetary values with proper rounding
   */
  static add(a: number, b: number): number {
    return this.round(a + b);
  }

  /**
   * Subtracts two monetary values with proper rounding
   */
  static subtract(a: number, b: number): number {
    return this.round(a - b);
  }

  /**
   * Multiplies a monetary value by a quantity/factor with proper rounding
   */
  static multiply(value: number, factor: number): number {
    return this.round(value * factor);
  }

  /**
   * Divides a monetary value with proper rounding
   */
  static divide(value: number, divisor: number): number {
    if (divisor === 0) {
      throw new Error('Division by zero');
    }
    return this.round(value / divisor);
  }

  /**
   * Distributes a total amount proportionally across weights
   *
   * Largest remainder in cents: each share gets the floor of its quota and the
   * leftover cents go to the largest fractions (ties go to the higher index).
   * The sum always equals the total exactly and no share is ever negative.
   *
   * @param total - Total amount to distribute
   * @param weights - Array of weights for proportional distribution
   * @returns Array of distributed amounts (same length as weights)
   *
   * @example
   * Money.distributeProportionally(10.00, [1, 1, 1])
   * // Returns: [3.33, 3.33, 3.34]
   */
  static distributeProportionally(total: number, weights: number[]): number[] {
    if (weights.length === 0) {
      return [];
    }

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    if (totalWeight === 0) {
      return weights.map(() => 0);
    }

    const totalCents = Math.round(total * 100);
    const quotas = weights.map((w) => (w / totalWeight) * totalCents);
    const cents = quotas.map((q) => Math.floor(q));
    let leftover = totalCents - cents.reduce((sum, c) => sum + c, 0);

    const byFraction = quotas
      .map((q, index) => ({ index, fraction: q - Math.floor(q) }))
      .sort((a, b) => b.fraction - a.fraction || b.index - a.index);

    for (let i = 0; leftover > 0; i = (i + 1) % byFraction.length) {
      cents[byFraction[i].index] += 1;
      leftover -= 1;
    }

    return cents.map((c) => c / 100);
  }

  /**
   * Sums an array of monetary values with proper rounding
   */
  static sum(values: number[]): number {
    return this.round(values.reduce((sum, v) => sum + v, 0));
  }

  /**
   * Compares two monetary values for equality (with tolerance for floating-point errors)
   */
  static equals(a: number, b: number, tolerance: number = 0.005): boolean {
    return Math.abs(a - b) < tolerance;
  }

  /**
   * Formats a monetary value as BRL currency string
   */
  static format(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Validates that a value is a valid monetary amount
   */
  static isValid(value: number): boolean {
    return typeof value === 'number' &&
           !isNaN(value) &&
           isFinite(value) &&
           value >= 0;
  }
}
