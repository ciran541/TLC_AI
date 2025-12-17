import { UserContext, PropertyType, LoanPurpose, RatePreference, AppState, ExtractionResult } from '../types';

export const INITIAL_CONTEXT: UserContext = {
  propertyType: PropertyType.UNKNOWN,
  loanSize: null,
  loanPurpose: LoanPurpose.UNKNOWN,
  ratePreference: RatePreference.UNKNOWN,
};

export const identifyMissingFields = (context: UserContext): string[] => {
  const missing: string[] = [];
  if (context.propertyType === PropertyType.UNKNOWN) missing.push('Property Type (HDB or Private)');
  if (context.loanSize === null) missing.push('Loan Amount');
  if (context.loanPurpose === LoanPurpose.UNKNOWN) missing.push('Loan Purpose (New or Refinance)');
  // Rate preference is NOT mandatory for basic fact finding, but mandatory for PACKAGE_RECOMMENDATION
  // We handle rate preference specifically in the Directions vs Packages logic
  return missing;
};

export const determineNextState = (
  currentContext: UserContext,
  lastIntent: 'exploratory' | 'direct' | 'mixed'
): AppState => {
  const missingBasic = identifyMissingFields(currentContext);

  // 1. If basic facts are missing, stay in FACT_FINDING
  if (missingBasic.length > 0) {
    return AppState.FACT_FINDING;
  }

  // 2. If all basic facts are known...
  
  // If user explicitly asked for "Best rates" (Direct) and we coincidentally know their preference (e.g. from previous context), show packages.
  if (lastIntent === 'direct' && currentContext.ratePreference !== RatePreference.UNKNOWN) {
    return AppState.PACKAGE_RECOMMENDATION;
  }

  // If user is exploratory OR we don't know their rate preference yet, go to DIRECTIONS
  if (currentContext.ratePreference === RatePreference.UNKNOWN) {
    return AppState.DIRECTION_OUTPUT;
  }

  // If everything is known, show packages
  return AppState.PACKAGE_RECOMMENDATION;
};

export const mergeContext = (current: UserContext, extracted: ExtractionResult): UserContext => {
  return {
    propertyType: (extracted.propertyType && extracted.propertyType !== PropertyType.UNKNOWN) ? extracted.propertyType : current.propertyType,
    loanSize: extracted.loanSize || current.loanSize,
    loanPurpose: (extracted.loanPurpose && extracted.loanPurpose !== LoanPurpose.UNKNOWN) ? extracted.loanPurpose : current.loanPurpose,
    ratePreference: (extracted.ratePreference && extracted.ratePreference !== RatePreference.UNKNOWN) ? extracted.ratePreference : current.ratePreference,
  };
};
