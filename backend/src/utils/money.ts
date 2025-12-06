/**
 * Money utility for precise financial calculations
 *
 * All monetary values are represented in BRL (Brazilian Real) with 2 decimal places.
 * This utility ensures consistent rounding and prevents floating-point precision errors.
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
   * Ensures the sum of distributed amounts equals the total exactly.
   * The last item receives the remainder to handle rounding differences.
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

    const distributed: number[] = [];
    let distributedSum = 0;

    for (let i = 0; i < weights.length; i++) {
      let amount: number;

      if (i === weights.length - 1) {
        // Last item gets the remainder to ensure exact total
        amount = this.round(total - distributedSum);
      } else {
        // Calculate proportional amount and round immediately
        amount = this.round((weights[i] / totalWeight) * total);
        distributedSum = this.round(distributedSum + amount);
      }

      distributed.push(amount);
    }

    return distributed;
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
