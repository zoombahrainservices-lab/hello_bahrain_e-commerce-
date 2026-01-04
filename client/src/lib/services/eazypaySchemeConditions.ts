/**
 * EazyPay Scheme Conditions
 * Appendix A from EazyPay Portal APIs Integration Guide
 * Ref: EFS-EAZYPAY-20221220-V1.2, Sep 2024
 */

export interface SchemeCondition {
  id: number;
  scheme: string;
  condition_id: string | null;
  condition_name: string;
}

export const SCHEME_CONDITIONS: SchemeCondition[] = [
  // Visa
  { id: 1, scheme: 'visa', condition_id: '10.1', condition_name: 'EMV Liability Shift Counterfeit Fraud' },
  { id: 2, scheme: 'visa', condition_id: '10.2', condition_name: 'EMV Liability Shift Non-Counterfeit Fraud' },
  { id: 3, scheme: 'visa', condition_id: '10.3', condition_name: 'Other Fraud – Card-Present Environment' },
  { id: 4, scheme: 'visa', condition_id: '10.4', condition_name: 'Other Fraud – Card-Absent Environment' },
  { id: 5, scheme: 'visa', condition_id: '10.5', condition_name: 'Visa Fraud Monitoring Program' },
  { id: 6, scheme: 'visa', condition_id: '11.1', condition_name: 'Card Recovery Bulletin' },
  { id: 7, scheme: 'visa', condition_id: '11.2', condition_name: 'Declined Authorization' },
  { id: 8, scheme: 'visa', condition_id: '11.3', condition_name: 'No Authorization/Late Presentment Effective for Transactions' },
  { id: 9, scheme: 'visa', condition_id: '12.1', condition_name: 'Late Presentment' },
  { id: 10, scheme: 'visa', condition_id: '12.2', condition_name: 'Incorrect Transaction Code' },
  { id: 11, scheme: 'visa', condition_id: '12.3', condition_name: 'Incorrect Currency' },
  { id: 12, scheme: 'visa', condition_id: '12.4', condition_name: 'Incorrect Account Number' },
  { id: 13, scheme: 'visa', condition_id: '12.5', condition_name: 'Incorrect Amount' },
  { id: 14, scheme: 'visa', condition_id: '12.6', condition_name: 'Duplicate Processing/Paid by Other Means' },
  { id: 16, scheme: 'visa', condition_id: '12.7', condition_name: 'Invalid Data' },
  { id: 17, scheme: 'visa', condition_id: '13.1', condition_name: 'Merchandise/Services Not Received' },
  { id: 18, scheme: 'visa', condition_id: '13.2', condition_name: 'Cancelled Recurring Transaction' },
  { id: 19, scheme: 'visa', condition_id: '13.3', condition_name: 'Not as Described or Defective Merchandise/Services' },
  { id: 20, scheme: 'visa', condition_id: '13.4', condition_name: 'Counterfeit Merchandise' },
  { id: 21, scheme: 'visa', condition_id: '13.5', condition_name: 'Misrepresentation' },
  { id: 22, scheme: 'visa', condition_id: '13.6', condition_name: 'Credit Not Processed' },
  { id: 23, scheme: 'visa', condition_id: '13.7', condition_name: 'Cancelled Merchandise/Services' },
  
  // Mastercard
  { id: 24, scheme: 'mastercard', condition_id: '4837', condition_name: 'No Cardholder Authorization' },
  { id: 25, scheme: 'mastercard', condition_id: '4840', condition_name: 'Fraudulent Processing of Transactions' },
  { id: 26, scheme: 'mastercard', condition_id: '4870', condition_name: 'Chip Liability Shift' },
  { id: 27, scheme: 'mastercard', condition_id: '4871', condition_name: 'Chip/PIN Liability Shift' },
  { id: 28, scheme: 'mastercard', condition_id: '4807', condition_name: 'Warning Bulletin File' },
  { id: 29, scheme: 'mastercard', condition_id: '4808', condition_name: 'Authorization-Related Chargeback' },
  { id: 30, scheme: 'mastercard', condition_id: '4812', condition_name: 'Account Number Not On File' },
  { id: 31, scheme: 'mastercard', condition_id: '4834', condition_name: 'Point-of-Interaction Error' },
  { id: 32, scheme: 'mastercard', condition_id: '4831', condition_name: 'Transaction Amount Differs' },
  { id: 33, scheme: 'mastercard', condition_id: '4842', condition_name: 'Late Presentment' },
  { id: 34, scheme: 'mastercard', condition_id: '4846', condition_name: 'Correct Transaction Currency Code Not Provided' },
  { id: 35, scheme: 'mastercard', condition_id: '4850', condition_name: 'Installment Billing Dispute' },
  { id: 36, scheme: 'mastercard', condition_id: '4853', condition_name: 'Cardholder Dispute' },
  { id: 37, scheme: 'mastercard', condition_id: '4841', condition_name: 'Canceled Recurring or Digital Goods Transactions' },
  { id: 38, scheme: 'mastercard', condition_id: '4855', condition_name: 'Goods or Services Not Provided' },
  { id: 39, scheme: 'mastercard', condition_id: '4860', condition_name: 'Credit Not Processed' },
  { id: 40, scheme: 'mastercard', condition_id: '4863', condition_name: 'Cardholder Does Not Recognize—Potential Fraud' },
  { id: 41, scheme: 'mastercard', condition_id: '4859', condition_name: 'Addendum, No-show, or ATM Dispute' },
  
  // Other
  { id: 42, scheme: 'other', condition_id: null, condition_name: 'Other' },
];

/**
 * Get conditions by scheme
 */
export function getConditionsByScheme(scheme: string): SchemeCondition[] {
  return SCHEME_CONDITIONS.filter(c => c.scheme === scheme);
}

/**
 * Get all available schemes
 */
export function getAvailableSchemes(): string[] {
  return Array.from(new Set(SCHEME_CONDITIONS.map(c => c.scheme)));
}

/**
 * Find condition by ID
 */
export function findConditionById(id: number): SchemeCondition | undefined {
  return SCHEME_CONDITIONS.find(c => c.id === id);
}

