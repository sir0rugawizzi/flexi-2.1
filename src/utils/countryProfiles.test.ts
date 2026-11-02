import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COUNTRY_PROFILES,
  DEFAULT_COUNTRY,
  formatCurrencyWithCountry,
  getCountryLocalHour,
  formatCountryDateTime,
} from './countryProfiles';

test('COUNTRY_PROFILES contains essential regions and configurations', () => {
  assert.ok(COUNTRY_PROFILES.UG);
  assert.ok(COUNTRY_PROFILES.KE);
  assert.ok(COUNTRY_PROFILES.RW);
  assert.ok(COUNTRY_PROFILES.TZ);
  assert.ok(COUNTRY_PROFILES.NG);
  assert.ok(COUNTRY_PROFILES.ZA);
  assert.ok(COUNTRY_PROFILES.GB);
  assert.ok(COUNTRY_PROFILES.US);
  assert.ok(COUNTRY_PROFILES.AE);

  assert.equal(COUNTRY_PROFILES.UG.currency, 'UGX');
  assert.equal(COUNTRY_PROFILES.UG.symbol, 'USh');
  assert.equal(COUNTRY_PROFILES.UG.timezone, 'Africa/Kampala');
  assert.equal(COUNTRY_PROFILES.UG.climate.heatPeakHour, 14);
});

test('formatCurrencyWithCountry formats UGX correctly', () => {
  const formatted = formatCurrencyWithCountry(5000, COUNTRY_PROFILES.UG);
  assert.equal(formatted, 'USh 5,000');
});

test('formatCurrencyWithCountry formats USD and GBP with decimals', () => {
  const formattedUsd = formatCurrencyWithCountry(37000, COUNTRY_PROFILES.US); // ~10 USD
  assert.match(formattedUsd, /^\$10\.00/);

  const formattedGbp = formatCurrencyWithCountry(47500, COUNTRY_PROFILES.GB); // ~10 GBP
  assert.match(formattedGbp, /^£10\.00/);
});

test('formatCurrencyWithCountry formats Kenyan Shillings and Nigerian Naira accurately', () => {
  const formattedKes = formatCurrencyWithCountry(10000, COUNTRY_PROFILES.KE);
  assert.match(formattedKes, /^KSh 351/);

  const formattedNgn = formatCurrencyWithCountry(10000, COUNTRY_PROFILES.NG);
  assert.match(formattedNgn, /^₦ 4,082/);
});

test('getCountryLocalHour extracts valid 0-23 hour for timezones', () => {
  const now = new Date('2026-11-02T12:00:00Z');
  // UTC 12:00 is 15:00 in Africa/Kampala (UTC+3)
  const hourUg = getCountryLocalHour(COUNTRY_PROFILES.UG, now);
  assert.equal(hourUg, 15);

  // UTC 12:00 is 07:00 in America/New_York (EST, UTC-5)
  const hourUs = getCountryLocalHour(COUNTRY_PROFILES.US, now);
  assert.equal(hourUs, 7);

  // UTC 12:00 is 16:00 in Asia/Dubai (GST, UTC+4)
  const hourAe = getCountryLocalHour(COUNTRY_PROFILES.AE, now);
  assert.equal(hourAe, 16);
});

test('formatCountryDateTime formats timestamps correctly with timezone support', () => {
  const date = new Date('2026-11-02T12:00:00Z');
  const formattedUg = formatCountryDateTime(date, COUNTRY_PROFILES.UG);
  assert.match(formattedUg, /2 Nov 2026/);
  assert.match(formattedUg, /15:00/);
});
