/**
 * Currency utilities for Indonesian Rupiah (IDR)
 */

/**
 * Format number as IDR currency
 * @param amount - The amount to format
 * @param includeSymbol - Whether to include IDR symbol (default: true)
 * @returns Formatted currency string
 */
export function formatIDR(amount: number | string, includeSymbol: boolean = true): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return includeSymbol ? 'IDR 0' : '0';
  
  const formatted = Math.round(numAmount).toLocaleString('id-ID');
  return includeSymbol ? `IDR ${formatted}` : formatted;
}

/**
 * Calculate PPN (Pajak Pertambahan Nilai) tax
 * @param subtotal - The subtotal amount
 * @param taxRate - Tax rate percentage (default: 11%)
 * @returns Tax amount
 */
export function calculatePPN(subtotal: number, taxRate: number = 11): number {
  return Math.round(subtotal * (taxRate / 100));
}

/**
 * Calculate service charge
 * @param subtotal - The subtotal amount
 * @param serviceChargeRate - Service charge rate percentage (default: 0%)
 * @returns Service charge amount
 */
export function calculateServiceCharge(subtotal: number, serviceChargeRate: number = 0): number {
  return Math.round(subtotal * (serviceChargeRate / 100));
}

/**
 * Calculate total with tax and service charge
 * @param subtotal - The subtotal amount
 * @param taxRate - Tax rate percentage (default: 11%)
 * @param serviceChargeRate - Service charge rate percentage (default: 0%)
 * @returns Object with breakdown of charges
 */
export function calculateTotal(
  subtotal: number, 
  taxRate: number = 11, 
  serviceChargeRate: number = 0
) {
  const serviceCharge = calculateServiceCharge(subtotal, serviceChargeRate);
  const taxableAmount = subtotal + serviceCharge;
  const taxAmount = calculatePPN(taxableAmount, taxRate);
  const finalAmount = taxableAmount + taxAmount;

  return {
    subtotal: Math.round(subtotal),
    serviceCharge,
    taxAmount,
    taxableAmount,
    finalAmount,
  };
}
