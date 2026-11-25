import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {PLANET_PROFILES} from '../data/planetaryData';
import {calculateLunarPhase} from '../utils/lunarPhase';
import {calculatePlanetaryDaySchedule, formatClockTime} from '../utils/planetaryHours';

export type NotificationStatus = 'unsupported' | 'default' | 'granted' | 'denied';

export function usePlanetaryClock(latitude: number, longitude: number) {
  const [now, setNow] = useState<Date>(() => new Date());
  const [customTimeIso, setCustomTimeIso] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationStatus>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  });

  useEffect(() => {
    if (customTimeIso !== null) return;
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(interval);
  }, [customTimeIso]);

  const effectiveDate = useMemo(() => {
    if (!customTimeIso) return now;
    const parsed = new Date(customTimeIso);
    return Number.isNaN(parsed.getTime()) ? now : parsed;
  }, [customTimeIso, now]);

  const schedule = useMemo(
    () => calculatePlanetaryDaySchedule(effectiveDate, latitude, longitude),
    [effectiveDate, latitude, longitude],
  );

  const lunar = useMemo(() => calculateLunarPhase(effectiveDate), [effectiveDate]);

  const lastNotifiedHourRef = useRef<string | null>(null);

  useEffect(() => {
    const hourKey = `${schedule.activeHour.planet}-${schedule.activeHour.startTime.getTime()}`;
    if (lastNotifiedHourRef.current === null) {
      lastNotifiedHourRef.current = hourKey;
      return;
    }

    if (
      lastNotifiedHourRef.current !== hourKey &&
      notificationsEnabled &&
      notificationPermission === 'granted' &&
      customTimeIso === null &&
      typeof window !== 'undefined' &&
      'Notification' in window
    ) {
      const profile = PLANET_PROFILES[schedule.activeHour.planet];
      try {
        new Notification(`Hour of ${profile.name} (${profile.glyph})`, {
          body: `${formatClockTime(schedule.activeHour.startTime)} – ${formatClockTime(
            schedule.activeHour.endTime,
          )} · ${profile.chakra} Chakra · ${profile.pairedStones.slice(0, 2).join(', ')}`,
        });
      } catch {
        // Ignore restricted notification environments
      }
    }
    lastNotifiedHourRef.current = hourKey;
  }, [
    schedule.activeHour.planet,
    schedule.activeHour.startTime,
    schedule.activeHour.endTime,
    notificationsEnabled,
    notificationPermission,
    customTimeIso,
  ]);

  const toggleNotifications = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported');
      setNotificationsEnabled(false);
      return;
    }

    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      return;
    }

    if (Notification.permission === 'granted') {
      setNotificationPermission('granted');
      setNotificationsEnabled(true);
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setNotificationPermission(result);
      setNotificationsEnabled(result === 'granted');
    } catch {
      setNotificationPermission('denied');
      setNotificationsEnabled(false);
    }
  }, [notificationsEnabled]);

  const setTimeOverride = useCallback((isoValue: string | null) => {
    if (!isoValue) {
      setCustomTimeIso(null);
      setNow(new Date());
      return;
    }
    setCustomTimeIso(isoValue);
  }, []);

  return {
    effectiveDate,
    schedule,
    lunar,
    customTimeIso,
    setTimeOverride,
    notificationsEnabled,
    notificationPermission,
    toggleNotifications,
  };
}
