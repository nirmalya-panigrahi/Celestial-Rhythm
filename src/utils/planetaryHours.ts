import {getTimes} from 'suncalc';
import {CHALDEAN_ORDER, DAY_RULERS} from '../data/planetaryData';
import type {PlanetId, PlanetaryDaySchedule, PlanetaryHourSlot} from '../types/astral';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function isValidDate(d: Date | null | undefined): d is Date {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

function getSolarBoundsForTimestamp(
  centerMs: number,
  latitude: number,
  longitude: number,
): {sunrise: Date; sunset: Date; isPolarFallback: boolean} {
  const safeLat = Number.isFinite(latitude) ? Math.max(-89.9, Math.min(89.9, latitude)) : 37.7749;
  const safeLon = Number.isFinite(longitude) ? Math.max(-180, Math.min(180, longitude)) : -122.4194;

  // Approximate local solar noon in UTC for the target longitude
  const d = new Date(centerMs);
  const utcMidnightMs = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0, 0);
  const solarNoonApprox = new Date(utcMidnightMs - (safeLon / 15) * 3600 * 1000);

  const times = getTimes(solarNoonApprox, safeLat, safeLon);
  const sunrise = times.sunrise;
  const sunset = times.sunset;

  if (
    isValidDate(sunrise) &&
    isValidDate(sunset) &&
    sunset.getTime() > sunrise.getTime() &&
    sunset.getTime() - sunrise.getTime() < MS_PER_DAY
  ) {
    return {sunrise, sunset, isPolarFallback: false};
  }

  // Fallback 06:00 - 18:00 solar approximation when polar day/night occurs
  const fallbackSunrise = new Date(solarNoonApprox.getTime() - 6 * 3600 * 1000);
  const fallbackSunset = new Date(solarNoonApprox.getTime() + 6 * 3600 * 1000);
  return {sunrise: fallbackSunrise, sunset: fallbackSunset, isPolarFallback: true};
}

export function getPlanetForHourIndex(dayRuler: PlanetId, hourIndex: number): PlanetId {
  const startIdx = CHALDEAN_ORDER.indexOf(dayRuler);
  const normalizedStart = startIdx >= 0 ? startIdx : 0;
  const idx = (normalizedStart + hourIndex) % CHALDEAN_ORDER.length;
  return CHALDEAN_ORDER[idx];
}

export function calculatePlanetaryDaySchedule(
  referenceDate: Date,
  latitude: number,
  longitude: number,
): PlanetaryDaySchedule {
  const safeRef = isValidDate(referenceDate) ? referenceDate : new Date();
  const refMs = safeRef.getTime();

  // Sample yesterday, today, and tomorrow solar days to accurately bracket refMs across any timezone
  const candidates = [-1, 0, 1, 2].map((offset) =>
    getSolarBoundsForTimestamp(refMs + offset * MS_PER_DAY, latitude, longitude),
  );

  let dayIdx = 1;
  for (let i = 0; i < candidates.length - 1; i++) {
    const startMs = candidates[i].sunrise.getTime();
    const endMs = candidates[i + 1].sunrise.getTime();
    if (refMs >= startMs && refMs < endMs) {
      dayIdx = i;
      break;
    }
  }

  const currentBounds = candidates[dayIdx];
  const nextBounds = candidates[dayIdx + 1] ?? getSolarBoundsForTimestamp(refMs + 2 * MS_PER_DAY, latitude, longitude);

  const sunrise = currentBounds.sunrise;
  const sunset = currentBounds.sunset;
  const nextSunrise = nextBounds.sunrise;
  const isPolarFallback = currentBounds.isPolarFallback || nextBounds.isPolarFallback;

  // Day ruler corresponds to the local weekday at sunrise
  const dayRuler = DAY_RULERS[sunrise.getDay()] ?? 'Sun';
  const dayDurationMs = Math.max(12 * 60 * 1000, sunset.getTime() - sunrise.getTime());
  const nightDurationMs = Math.max(12 * 60 * 1000, nextSunrise.getTime() - sunset.getTime());

  const dayHourMs = dayDurationMs / 12;
  const nightHourMs = nightDurationMs / 12;

  const hours: PlanetaryHourSlot[] = [];

  for (let i = 0; i < 24; i++) {
    const isDaytime = i < 12;
    const periodIndex = isDaytime ? i : i - 12;
    const baseMs = isDaytime ? sunrise.getTime() : sunset.getTime();
    const stepMs = isDaytime ? dayHourMs : nightHourMs;

    const startTime = new Date(baseMs + periodIndex * stepMs);
    const endTime = new Date(
      i === 11
        ? sunset.getTime()
        : i === 23
          ? nextSunrise.getTime()
          : baseMs + (periodIndex + 1) * stepMs,
    );

    const isCurrent = refMs >= startTime.getTime() && refMs < endTime.getTime();

    hours.push({
      hourIndex: i,
      hourInPeriod: periodIndex + 1,
      planet: getPlanetForHourIndex(dayRuler, i),
      isDaytime,
      startTime,
      endTime,
      durationMinutes: Math.round((endTime.getTime() - startTime.getTime()) / 60000),
      isCurrent,
    });
  }

  let activeIndex = hours.findIndex((slot) => slot.isCurrent);
  if (activeIndex === -1) {
    activeIndex = refMs >= sunset.getTime() ? 23 : 0;
    hours[activeIndex] = {...hours[activeIndex], isCurrent: true};
  }

  const activeHour = hours[activeIndex];
  const nextHourIndex = (activeIndex + 1) % 24;
  const nextDayIndex = (sunrise.getDay() + 1) % 7;
  const nextHour =
    activeIndex < 23
      ? hours[nextHourIndex]
      : {
          ...hours[0],
          planet: getPlanetForHourIndex(DAY_RULERS[nextDayIndex] ?? 'Sun', 0),
          startTime: nextSunrise,
          endTime: new Date(nextSunrise.getTime() + dayHourMs),
          isCurrent: false,
        };

  const countdownMs = Math.max(0, activeHour.endTime.getTime() - refMs);

  return {
    referenceDate: safeRef,
    dayRuler,
    sunrise,
    sunset,
    nextSunrise,
    hours,
    activeHour,
    nextHour,
    countdownMs,
    isPolarFallback,
  };
}

export function formatClockTime(date: Date): string {
  if (!isValidDate(date)) return '--:--';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
