import {useCallback, useEffect, useState} from 'react';
import {CITY_PRESETS} from '../data/planetaryData';
import type {CityPreset, GeoLocationState} from '../types/astral';

const STORAGE_KEY = 'astral_hours_location_v1';

interface StoredLocation {
  latitude: number;
  longitude: number;
  label: string;
  source: 'gps' | 'preset' | 'manual';
}

const DEFAULT_PRESET = CITY_PRESETS[0];

function loadSavedLocation(): StoredLocation {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        latitude: DEFAULT_PRESET.latitude,
        longitude: DEFAULT_PRESET.longitude,
        label: `${DEFAULT_PRESET.name}, ${DEFAULT_PRESET.region}`,
        source: 'preset',
      };
    }
    const parsed = JSON.parse(raw) as Partial<StoredLocation>;
    if (
      typeof parsed.latitude === 'number' &&
      Number.isFinite(parsed.latitude) &&
      typeof parsed.longitude === 'number' &&
      Number.isFinite(parsed.longitude) &&
      typeof parsed.label === 'string' &&
      parsed.label.trim().length > 0
    ) {
      return {
        latitude: Math.max(-89.9, Math.min(89.9, parsed.latitude)),
        longitude: Math.max(-180, Math.min(180, parsed.longitude)),
        label: parsed.label,
        source: parsed.source === 'gps' || parsed.source === 'manual' ? parsed.source : 'preset',
      };
    }
  } catch {
    // Corrupted localStorage falls back safely
  }
  return {
    latitude: DEFAULT_PRESET.latitude,
    longitude: DEFAULT_PRESET.longitude,
    label: `${DEFAULT_PRESET.name}, ${DEFAULT_PRESET.region}`,
    source: 'preset',
  };
}

export function useGeolocation() {
  const [location, setLocation] = useState<GeoLocationState>(() => {
    const saved = loadSavedLocation();
    return {
      ...saved,
      loading: false,
      error: null,
    };
  });

  useEffect(() => {
    try {
      const payload: StoredLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        label: location.label,
        source: location.source,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [location.latitude, location.longitude, location.label, location.source]);

  const selectPreset = useCallback((preset: CityPreset) => {
    setLocation({
      latitude: preset.latitude,
      longitude: preset.longitude,
      label: `${preset.name}, ${preset.region}`,
      source: 'preset',
      loading: false,
      error: null,
    });
  }, []);

  const setManualCoordinates = useCallback((lat: number, lon: number, label?: string) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setLocation((prev) => ({
        ...prev,
        error: 'Enter latitude between -90 and 90 and longitude between -180 and 180.',
      }));
      return false;
    }
    const clampedLat = Math.max(-89.9, Math.min(89.9, lat));
    setLocation({
      latitude: clampedLat,
      longitude: lon,
      label: label?.trim() || `${clampedLat.toFixed(2)}°, ${lon.toFixed(2)}°`,
      source: 'manual',
      loading: false,
      error: null,
    });
    return true;
  }, []);

  const requestBrowserLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        loading: false,
        error: 'Browser geolocation is unavailable. Select a city preset below.',
      }));
      return;
    }

    setLocation((prev) => ({...prev, loading: true, error: null}));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lon = Number(pos.coords.longitude.toFixed(4));
        setLocation({
          latitude: lat,
          longitude: lon,
          label: `Local GPS (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
          source: 'gps',
          loading: false,
          error: null,
        });
      },
      (err) => {
        const message =
          err.code === 1
            ? 'Location permission declined. Using fallback city coordinates.'
            : 'Unable to determine GPS position. Using fallback coordinates.';
        setLocation((prev) => ({
          ...prev,
          loading: false,
          error: message,
        }));
      },
      {enableHighAccuracy: false, timeout: 8000, maximumAge: 300000},
    );
  }, []);

  return {
    location,
    selectPreset,
    setManualCoordinates,
    requestBrowserLocation,
  };
}
