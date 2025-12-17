// --- Domain Entities ---

export enum PropertyType {
  HDB = 'HDB',
  PRIVATE = 'Private',
  UNKNOWN = 'Unknown'
}

export enum LoanPurpose {
  NEW_PURCHASE = 'New Purchase',
  REFINANCE = 'Refinance',
  UNKNOWN = 'Unknown'
}

export enum RatePreference {
  FIXED = 'Fixed',
  FLOATING = 'Floating',
  UNKNOWN = 'Unknown'
}

export interface UserContext {
  propertyType: PropertyType;
  loanSize: number | null;
  loanPurpose: LoanPurpose;
  ratePreference: RatePreference;
  lockInStatus?: string; // Only relevant for refinancing
}

export interface MortgagePackage {
  id: string;
  bank: string;
  property_type: string;
  min_loan_size: number;
  package_name: string;
  lockin_period: string;
  rates: string;
  features: string | null;
  subsidies: string | null;
  remarks: string | null;
  last_updated: string;
  category: string;
}

// --- Chat & State ---

export enum AppState {
  INIT = 'INIT',
  FACT_FINDING = 'FACT_FINDING',
  DIRECTION_OUTPUT = 'DIRECTION_OUTPUT',
  PACKAGE_RECOMMENDATION = 'PACKAGE_RECOMMENDATION',
  HANDOVER = 'HANDOVER'
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type: 'text' | 'directions' | 'packages' | 'loader';
  data?: any; // For passing structured data like package lists or direction options
}

export interface ExtractionResult {
  propertyType?: PropertyType;
  loanSize?: number;
  loanPurpose?: LoanPurpose;
  ratePreference?: RatePreference;
  intent: 'exploratory' | 'direct' | 'mixed';
  reasoning: string;
}
