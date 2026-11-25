import {describe, expect, it} from 'vitest';
import {CHALDEAN_ORDER} from '../data/planetaryData';
import {
  calculatePlanetaryDaySchedule,
  formatClockTime,
  formatCountdown,
  getPlanetForHourIndex,
} from '../utils/planetaryHours';

describe('planetaryHours (Blue Pill)', () => {
  it('computes 24 unequal planetary hours (12 day + 12 night) following Chaldean order from sunrise', () => {
    // Wednesday Nov 25, 2026 14:30 PST (22:30 UTC) in San Francisco
    const refDate = new Date('2026-11-25T22:30:00Z');
    const schedule = calculatePlanetaryDaySchedule(refDate, 37.7749, -122.4194);

    expect(schedule.hours).toHaveLength(24);
    expect(schedule.dayRuler).toBe('Mercury');
    expect(schedule.hours[0].planet).toBe('Mercury');
    expect(schedule.hours[0].isDaytime).toBe(true);
    expect(schedule.hours[12].isDaytime).toBe(false);
    expect(schedule.isPolarFallback).toBe(false);

    // Verify full Chaldean cycle progression across all 24 slots
    const startIdx = CHALDEAN_ORDER.indexOf(schedule.dayRuler);
    schedule.hours.forEach((slot, idx) => {
      expect(slot.planet).toBe(CHALDEAN_ORDER[(startIdx + idx) % 7]);
      expect(slot.endTime.getTime()).toBeGreaterThan(slot.startTime.getTime());
    });

    // Daytime hours in November in SF should be shorter than 60 mins; nighttime longer
    expect(schedule.hours[0].durationMinutes).toBeLessThan(60);
    expect(schedule.hours[12].durationMinutes).toBeGreaterThan(60);
    expect(schedule.activeHour.isCurrent).toBe(true);
  });

  it('assigns pre-sunrise hours (e.g. 02:00 AM) to the previous planetary day', () => {
    // Wednesday Nov 25, 2026 02:00 PST (10:00 UTC) belongs to Tuesday (Mars) night
    const preSunrise = new Date('2026-11-25T10:00:00Z');
    const schedule = calculatePlanetaryDaySchedule(preSunrise, 37.7749, -122.4194);

    expect(schedule.dayRuler).toBe('Mars');
    expect(schedule.activeHour.isDaytime).toBe(false);
    expect(schedule.activeHour.startTime.getTime()).toBeLessThanOrEqual(preSunrise.getTime());
    expect(schedule.activeHour.endTime.getTime()).toBeGreaterThan(preSunrise.getTime());
  });

  it('computes Chaldean sequence rotation via getPlanetForHourIndex', () => {
    expect(getPlanetForHourIndex('Sun', 0)).toBe('Sun');
    expect(getPlanetForHourIndex('Sun', 1)).toBe('Venus');
    expect(getPlanetForHourIndex('Sun', 2)).toBe('Mercury');
    expect(getPlanetForHourIndex('Sun', 3)).toBe('Moon');
    expect(getPlanetForHourIndex('Sun', 4)).toBe('Saturn');
  });

  it('formats clock times and countdowns cleanly', () => {
    expect(formatClockTime(new Date(2026, 10, 25, 7, 5))).toBe('07:05');
    expect(formatCountdown(5 * 60 * 1000 + 9000)).toBe('05:09');
    expect(formatCountdown(3665 * 1000)).toBe('01:01:05');
  });
});

describe('planetaryHours (Red Pill / Edge Cases)', () => {
  it('handles polar day/night latitudes gracefully with equinox fallback', () => {
    // High Arctic winter where sun does not rise
    const winterArctic = new Date(2026, 11, 21, 12, 0, 0);
    const schedule = calculatePlanetaryDaySchedule(winterArctic, 78.2232, 15.6267);

    expect(schedule.hours).toHaveLength(24);
    expect(schedule.isPolarFallback).toBe(true);
    expect(schedule.activeHour).toBeDefined();
    expect(Number.isFinite(schedule.countdownMs)).toBe(true);
  });

  it('survives invalid Date and NaN/out-of-range coordinates without throwing', () => {
    const badDate = new Date('not-a-date');
    const schedule = calculatePlanetaryDaySchedule(badDate, Number.NaN, Number.POSITIVE_INFINITY);

    expect(schedule.hours).toHaveLength(24);
    expect(schedule.activeHour).toBeDefined();
    expect(formatClockTime(badDate)).toBe('--:--');
    expect(formatCountdown(-5000)).toBe('00:00');
  });
});
