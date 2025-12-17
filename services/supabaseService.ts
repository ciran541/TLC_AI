import { createClient } from '@supabase/supabase-js';
import { MortgagePackage, PropertyType, RatePreference } from '../types';

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://zzhxrkyjhxhzzawwixsr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6aHhya3lqaHhoenphd3dpeHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNjcwMDMsImV4cCI6MjA3MTk0MzAwM30.GBPxq-0qPwkxCxWWPp6wGWCD5l1eTsevQ9yGpaCIlGY';

// Initialize Client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper to extract number from string (e.g., "2.80% p.a." -> 2.8) for sorting
const extractInterestRate = (str: string | null): number => {
  if (!str) return 999; // Push to bottom if no rate
  const match = str.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 999;
};

export const fetchPackages = async (
  propertyType: PropertyType,
  loanSize: number,
  ratePreference: RatePreference
): Promise<MortgagePackage[]> => {
  
  console.log(`[Dexter] Fetching: ${propertyType} | ${ratePreference} | Loan: $${loanSize}`);

  try {
    // 1. Base Query: Get ALL packages valid for this loan size
    // We fetch more than 3 initially because we need to perform complex sorting (Tier matching) in JS
    let query = supabase
      .from('mortgage_packages')
      .select('*')
      .lte('min_loan_size', loanSize); // Package min size must be <= user's loan amount

    // 2. Filter by Property Type (Strict Check)
    // Banks separate packages strictly by HDB vs Private (Condo/Landed)
    if (propertyType === PropertyType.HDB) {
      query = query.ilike('property_type', '%HDB%');
    } else {
      // "Private" covers Condo, Landed, etc. So we look for anything NOT HDB.
      query = query.not('property_type', 'ilike', '%HDB%');
    }

    // 3. Filter by Rate Category (Fixed vs Floating)
    if (ratePreference === RatePreference.FIXED) {
      query = query.ilike('category', '%Fixed%');
    } else {
      query = query.not('category', 'ilike', '%Fixed%');
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Supabase Error]:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('[Supabase] No packages found matching criteria.');
      return [];
    }

    console.log(`[Supabase] Found ${data.length} candidates. Applying Tier Logic...`);

    // 4. Client-side Sorting Strategy (The "Closest Tier" Logic)
    const processedPackages = data
      .map((row: any) => ({
        ...row,
        _sortRate: extractInterestRate(row.rates) 
      }))
      .sort((a: any, b: any) => {
        // PRIMARY SORT: Min Loan Size (Descending)
        // We want the package that demands the highest minimum loan size that the user still qualifies for.
        // Example: User Loan 800k.
        // Pkg A (Min 800k) vs Pkg B (Min 100k).
        // Pkg A should come first because it is the "Premier" tier for this user.
        if (b.min_loan_size !== a.min_loan_size) {
          return b.min_loan_size - a.min_loan_size;
        }
        
        // SECONDARY SORT: Interest Rate (Ascending)
        // If two packages have the same min_loan_size tier, show the cheaper one.
        return a._sortRate - b._sortRate;
      })
      .slice(0, 3); // Take top 3 best fits

    return processedPackages as MortgagePackage[];

  } catch (err) {
    console.error('[Supabase Exception]:', err);
    return [];
  }
};