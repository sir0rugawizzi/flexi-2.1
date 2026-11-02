export interface CountryClimate {
  regionName: string;
  avgTemp: string;
  humidity: string;
  heatPeakHour: number; // 24-hr format (e.g. 14 for 2 PM)
  heatAdvisoryNote: string;
  baseHydrationFactorLiters: number;
  popularWaterBrand: string;
}

export interface CountryMarketPricing {
  primaryMarketHub: string;
  localMarkets: string[];
  stapleProtein: string;
  stapleCarb: string;
}

export interface CountryProfile {
  code: string; // 'UG', 'KE', 'RW', 'TZ', 'NG', 'ZA', 'GB', 'US', 'AE'
  name: string;
  flag: string;
  currency: string; // 'UGX', 'KES', 'RWF', 'TZS', 'NGN', 'ZAR', 'GBP', 'USD', 'AED'
  symbol: string; // 'USh', 'KSh', 'FRw', 'TSh', '₦', 'R', '£', '$', 'AED'
  exchangeRateFromUGX: number; // multiplier to convert 1 UGX into target currency
  timezone: string; // 'Africa/Kampala', etc.
  timezoneLabel: string; // 'EAT (UTC+3)'
  climate: CountryClimate;
  marketPricing: CountryMarketPricing;
}
