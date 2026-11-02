import { CountryProfile } from '../types/country';

export const COUNTRY_PROFILES: Record<string, CountryProfile> = {
  UG: {
    code: 'UG',
    name: 'Uganda',
    flag: '🇺🇬',
    currency: 'UGX',
    symbol: 'USh',
    exchangeRateFromUGX: 1.0,
    timezone: 'Africa/Kampala',
    timezoneLabel: 'EAT (UTC+3)',
    climate: {
      regionName: 'Kampala & Central Lake Basin',
      avgTemp: '26°C',
      humidity: '72%',
      heatPeakHour: 14, // 2 PM
      heatAdvisoryNote: 'Kampala afternoon heat shield active (2:00 PM peak radiation).',
      baseHydrationFactorLiters: 0.4,
      popularWaterBrand: 'Rwenzori 500ml',
    },
    marketPricing: {
      primaryMarketHub: 'Kampala Central Markets',
      localMarkets: ['Nakasero Market', 'Owino (St. Balikuddembe)', 'Kalerwe Market'],
      stapleProtein: 'Silverfish (Mukene) & Local Grassfed Beef',
      stapleCarb: 'Matooke & Posho (Maize Meal)',
    },
  },
  KE: {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES',
    symbol: 'KSh',
    exchangeRateFromUGX: 1 / 28.5,
    timezone: 'Africa/Nairobi',
    timezoneLabel: 'EAT (UTC+3)',
    climate: {
      regionName: 'Nairobi & Rift Valley Highlands',
      avgTemp: '24°C',
      humidity: '62%',
      heatPeakHour: 13, // 1 PM
      heatAdvisoryNote: 'High altitude UV index elevated around midday.',
      baseHydrationFactorLiters: 0.35,
      popularWaterBrand: 'Keringet 500ml',
    },
    marketPricing: {
      primaryMarketHub: 'Nairobi City & Marikiti Hub',
      localMarkets: ['City Market Nairobi', 'Marikiti (Wakulima)', 'Gikomba Market'],
      stapleProtein: 'Dagaa / Omena & Sukuma Wiki Beef Stir',
      stapleCarb: 'Ugali & Sweet Potatoes',
    },
  },
  RW: {
    code: 'RW',
    name: 'Rwanda',
    flag: '🇷🇼',
    currency: 'RWF',
    symbol: 'FRw',
    exchangeRateFromUGX: 1 / 2.7,
    timezone: 'Africa/Kigali',
    timezoneLabel: 'CAT (UTC+2)',
    climate: {
      regionName: 'Kigali High Plateau',
      avgTemp: '25°C',
      humidity: '68%',
      heatPeakHour: 13,
      heatAdvisoryNote: 'Mild mountain elevation; stay hydrated during steep hill training.',
      baseHydrationFactorLiters: 0.3,
      popularWaterBrand: 'Inyange 500ml',
    },
    marketPricing: {
      primaryMarketHub: 'Kigali Market Hub',
      localMarkets: ['Kimironko Market', 'Nyabugogo Central'],
      stapleProtein: 'Isambaza (Lake Kivu Sardines) & Brochettes',
      stapleCarb: 'Ibitoke (Green Bananas) & Cassava',
    },
  },
  TZ: {
    code: 'TZ',
    name: 'Tanzania',
    flag: '🇹🇿',
    currency: 'TZS',
    symbol: 'TSh',
    exchangeRateFromUGX: 1 / 1.45,
    timezone: 'Africa/Dar_es_Salaam',
    timezoneLabel: 'EAT (UTC+3)',
    climate: {
      regionName: 'Dar es Salaam & Coastal Plains',
      avgTemp: '30°C',
      humidity: '82%',
      heatPeakHour: 14,
      heatAdvisoryNote: 'High coastal humidity accelerates electrolyte depletion.',
      baseHydrationFactorLiters: 0.5,
      popularWaterBrand: 'Kilimanjaro 500ml',
    },
    marketPricing: {
      primaryMarketHub: 'Kariakoo Commercial Hub',
      localMarkets: ['Kariakoo Market', 'Mwananyamala Market'],
      stapleProtein: 'Samaki wa Kupaka & Nyama Choma',
      stapleCarb: 'Ugali wa Sembe & Ndizi Mshale',
    },
  },
  NG: {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    currency: 'NGN',
    symbol: '₦',
    exchangeRateFromUGX: 1 / 2.45,
    timezone: 'Africa/Lagos',
    timezoneLabel: 'WAT (UTC+1)',
    climate: {
      regionName: 'Lagos & Gulf of Guinea Coast',
      avgTemp: '29°C',
      humidity: '79%',
      heatPeakHour: 14,
      heatAdvisoryNote: 'Intense tropical heat index; drink water before afternoon workout sets.',
      baseHydrationFactorLiters: 0.45,
      popularWaterBrand: 'Eva Water 500ml',
    },
    marketPricing: {
      primaryMarketHub: 'Lagos Island & Mainland Wholesale',
      localMarkets: ['Mile 12 Market', 'Balogun Market', 'Oyingbo Market'],
      stapleProtein: 'Titus Mackerel, Suya Beef & Beans',
      stapleCarb: 'Pounded Yam, Garri & Plantain',
    },
  },
  ZA: {
    code: 'ZA',
    name: 'South Africa',
    flag: '🇿🇦',
    currency: 'ZAR',
    symbol: 'R',
    exchangeRateFromUGX: 1 / 205,
    timezone: 'Africa/Johannesburg',
    timezoneLabel: 'SAST (UTC+2)',
    climate: {
      regionName: 'Gauteng Highveld & Western Cape',
      avgTemp: '22°C',
      humidity: '50%',
      heatPeakHour: 14,
      heatAdvisoryNote: 'Dry highveld atmosphere; subtle dehydration occurs faster.',
      baseHydrationFactorLiters: 0.35,
      popularWaterBrand: 'Valpré 500ml',
    },
    marketPricing: {
      primaryMarketHub: 'Johannesburg Fresh Produce Market',
      localMarkets: ['JHB Fresh Produce Market', 'City Deep Market'],
      stapleProtein: 'Biltong, Boerewors & Free Range Eggs',
      stapleCarb: 'Mielie Pap & Roasted Butternut',
    },
  },
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    symbol: '£',
    exchangeRateFromUGX: 1 / 4750,
    timezone: 'Europe/London',
    timezoneLabel: 'GMT/BST (UTC+0)',
    climate: {
      regionName: 'Temperate Maritime',
      avgTemp: '16°C',
      humidity: '65%',
      heatPeakHour: 15,
      heatAdvisoryNote: 'Indoor heating and cool weather reduce thirst sensation; log water actively.',
      baseHydrationFactorLiters: 0.15,
      popularWaterBrand: 'Highland Spring 500ml',
    },
    marketPricing: {
      primaryMarketHub: 'UK Metro & Local Markets',
      localMarkets: ['Borough Market', 'Afro-Caribbean Grocers', 'High Street Produce'],
      stapleProtein: 'Chicken Breast, Mackerel & Free Range Eggs',
      stapleCarb: 'Oats, Sweet Potatoes & Brown Rice',
    },
  },
  US: {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    symbol: '$',
    exchangeRateFromUGX: 1 / 3700,
    timezone: 'America/New_York',
    timezoneLabel: 'EST/EDT (UTC-5)',
    climate: {
      regionName: 'Continental Metro',
      avgTemp: '22°C',
      humidity: '55%',
      heatPeakHour: 14,
      heatAdvisoryNote: 'Air-conditioned gyms and office environments dry airway tissues.',
      baseHydrationFactorLiters: 0.25,
      popularWaterBrand: 'Spring Water 500ml',
    },
    marketPricing: {
      primaryMarketHub: 'North American Produce Hubs',
      localMarkets: ['Farmers Markets', 'International Food Hubs', 'Whole Grocers'],
      stapleProtein: 'Lean Turkey, Atlantic Salmon & Organic Eggs',
      stapleCarb: 'Sweet Potatoes, Quinoa & Rolled Oats',
    },
  },
  AE: {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    currency: 'AED',
    symbol: 'AED',
    exchangeRateFromUGX: 1 / 1007,
    timezone: 'Asia/Dubai',
    timezoneLabel: 'GST (UTC+4)',
    climate: {
      regionName: 'Dubai & Arabian Gulf Coast',
      avgTemp: '34°C',
      humidity: '60%',
      heatPeakHour: 13,
      heatAdvisoryNote: 'Extreme outdoor thermal radiation; maintain steady indoor rehydration.',
      baseHydrationFactorLiters: 0.6,
      popularWaterBrand: 'Al Ain 500ml',
    },
    marketPricing: {
      primaryMarketHub: 'Deira & Waterfront Hub',
      localMarkets: ['Deira Waterfront Market', 'Al Aweer Central Market'],
      stapleProtein: 'Fresh Kingfish, Hamour & Halal Lamb',
      stapleCarb: 'Basmati Rice & Dates',
    },
  },
};

export const DEFAULT_COUNTRY = COUNTRY_PROFILES.UG;

/**
 * Automatically detects the user's country from system timezone or navigator locale
 */
export function detectUserCountry(): CountryProfile {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('flexifit_country_code');
      if (stored && COUNTRY_PROFILES[stored]) {
        return COUNTRY_PROFILES[stored];
      }

      // Check browser timezone
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz.includes('Kampala') || tz.includes('Entebbe')) return COUNTRY_PROFILES.UG;
      if (tz.includes('Nairobi') || tz.includes('Mombasa')) return COUNTRY_PROFILES.KE;
      if (tz.includes('Kigali')) return COUNTRY_PROFILES.RW;
      if (tz.includes('Dar_es_Salaam') || tz.includes('Zanzibar')) return COUNTRY_PROFILES.TZ;
      if (tz.includes('Lagos')) return COUNTRY_PROFILES.NG;
      if (tz.includes('Johannesburg') || tz.includes('Harare')) return COUNTRY_PROFILES.ZA;
      if (tz.includes('London') || tz.includes('Edinburgh') || tz.includes('Belfast')) return COUNTRY_PROFILES.GB;
      if (tz.includes('New_York') || tz.includes('Chicago') || tz.includes('Los_Angeles') || tz.includes('Denver')) return COUNTRY_PROFILES.US;
      if (tz.includes('Dubai')) return COUNTRY_PROFILES.AE;

      // Check navigator language
      const lang = navigator.language || '';
      if (lang.endsWith('-UG')) return COUNTRY_PROFILES.UG;
      if (lang.endsWith('-KE')) return COUNTRY_PROFILES.KE;
      if (lang.endsWith('-RW')) return COUNTRY_PROFILES.RW;
      if (lang.endsWith('-TZ')) return COUNTRY_PROFILES.TZ;
      if (lang.endsWith('-NG')) return COUNTRY_PROFILES.NG;
      if (lang.endsWith('-ZA')) return COUNTRY_PROFILES.ZA;
      if (lang.endsWith('-GB')) return COUNTRY_PROFILES.GB;
      if (lang.endsWith('-US')) return COUNTRY_PROFILES.US;
      if (lang.endsWith('-AE')) return COUNTRY_PROFILES.AE;
    }
  } catch {
    // Fallback to default
  }

  return DEFAULT_COUNTRY;
}

/**
 * Formats a UGX base price into the target country's currency
 */
export function formatCurrencyWithCountry(amountInUgx: number, country: CountryProfile = DEFAULT_COUNTRY): string {
  if (country.code === 'UG') {
    const rounded = Math.round(amountInUgx);
    return `${country.symbol} ${rounded.toLocaleString('en-US')}`;
  }

  const converted = amountInUgx * country.exchangeRateFromUGX;

  // Major currencies with cents (USD, GBP, AED, ZAR)
  if (country.code === 'US' || country.code === 'GB') {
    return `${country.symbol}${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  if (country.code === 'AE' || country.code === 'ZA') {
    return `${country.symbol} ${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // Integer currencies
  const rounded = Math.round(converted);
  return `${country.symbol} ${rounded.toLocaleString('en-US')}`;
}

/**
 * Gets current hour in the specific country's timezone
 */
export function getCountryLocalHour(country: CountryProfile = DEFAULT_COUNTRY, now: Date = new Date()): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: country.timezone,
      hour: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const hourPart = parts.find((p) => p.type === 'hour');
    return hourPart ? parseInt(hourPart.value, 10) : now.getHours();
  } catch {
    return now.getHours();
  }
}

/**
 * Formats date and time according to country's timezone
 */
export function formatCountryDateTime(dateInput: string | Date | number | null | undefined, country: CountryProfile = DEFAULT_COUNTRY): string {
  if (!dateInput) return 'Never';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Never';

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: country.timezone,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
