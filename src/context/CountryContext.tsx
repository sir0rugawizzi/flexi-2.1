import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { CountryProfile } from '../types/country';
import {
  COUNTRY_PROFILES,
  DEFAULT_COUNTRY,
  detectUserCountry,
  formatCurrencyWithCountry,
  getCountryLocalHour,
} from '../utils/countryProfiles';

interface CountryContextType {
  country: CountryProfile;
  setCountryCode: (code: string) => void;
  allCountries: CountryProfile[];
  formatPrice: (amountInUgx: number) => string;
  localHour: number;
  isHeatAlertActive: boolean;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

export const CountryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [country, setCountry] = useState<CountryProfile>(() => detectUserCountry());
  const [localHour, setLocalHour] = useState<number>(() => getCountryLocalHour(country));

  // Keep local hour updated periodically
  useEffect(() => {
    const updateHour = () => {
      setLocalHour(getCountryLocalHour(country));
    };
    updateHour();
    const interval = setInterval(updateHour, 60000);
    return () => clearInterval(interval);
  }, [country]);

  const setCountryCode = (code: string) => {
    const next = COUNTRY_PROFILES[code];
    if (next) {
      setCountry(next);
      setLocalHour(getCountryLocalHour(next));
      try {
        localStorage.setItem('flexifit_country_code', code);
      } catch {
        // Storage failover
      }
    }
  };

  const allCountries = useMemo(() => Object.values(COUNTRY_PROFILES), []);

  const formatPrice = (amountInUgx: number) => {
    return formatCurrencyWithCountry(amountInUgx, country);
  };

  const isHeatAlertActive = localHour >= country.climate.heatPeakHour && localHour < 17;

  return (
    <CountryContext.Provider
      value={{
        country,
        setCountryCode,
        allCountries,
        formatPrice,
        localHour,
        isHeatAlertActive,
      }}
    >
      {children}
    </CountryContext.Provider>
  );
};

export const useCountry = (): CountryContextType => {
  const context = useContext(CountryContext);
  if (!context) {
    return {
      country: DEFAULT_COUNTRY,
      setCountryCode: () => {},
      allCountries: Object.values(COUNTRY_PROFILES),
      formatPrice: (amountInUgx: number) => formatCurrencyWithCountry(amountInUgx, DEFAULT_COUNTRY),
      localHour: getCountryLocalHour(DEFAULT_COUNTRY),
      isHeatAlertActive: false,
    };
  }
  return context;
};
