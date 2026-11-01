/**
 * REVENUE_OPTIONS defines the monthly revenue options in order from lowest (index 0) to highest.
 */
export const REVENUE_OPTIONS = [
  { id: '10k', label: '$10k/month', desc: 'Consistent baseline revenue' },
  { id: '20k_30k', label: '$20k-$30k/month', desc: 'Steady monthly job volume' },
  { id: '30k_50k', label: '$30k-$50k/month', desc: 'Solid local market traction' },
  { id: '50k_100k', label: '$50k-$100k/month', desc: 'High-volume contractor' },
];

/**
 * Checks whether the lead selected the FIRST (lowest, index 0) monthly revenue option,
 * regardless of the option's text or label.
 *
 * @param optionIndex The 0-based index of the chosen monthly revenue option
 * @param optionLabel The label or id of the chosen option (fallback)
 * @returns true if the lead picked the first (lowest) option, false otherwise
 */
export function isLowestRevenueOption(optionIndex?: number, optionLabel?: string): boolean {
  // Primary check: Option position (index 0 is the first / lowest option)
  if (typeof optionIndex === 'number' && optionIndex >= 0) {
    return optionIndex === 0;
  }

  // Fallback: match position against REVENUE_OPTIONS list
  if (optionLabel) {
    const trimmed = optionLabel.trim();
    const foundIndex = REVENUE_OPTIONS.findIndex(
      (opt) => opt.label.trim() === trimmed || opt.id === trimmed
    );
    if (foundIndex !== -1) {
      return foundIndex === 0;
    }
  }

  return false;
}

/**
 * Determines lead qualification status:
 * "no" if they picked the first (lowest) option, otherwise "yes".
 */
export function getQualificationStatus(optionIndex?: number, optionLabel?: string): 'yes' | 'no' {
  return isLowestRevenueOption(optionIndex, optionLabel) ? 'no' : 'yes';
}
