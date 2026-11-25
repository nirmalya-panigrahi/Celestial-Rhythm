import {useCallback, useEffect, useState} from 'react';

const COLLECTION_KEY = 'astral_hours_crystal_collection_v1';
const NOTES_KEY = 'astral_hours_crystal_notes_v1';

function loadCollection(): string[] {
  try {
    const raw = localStorage.getItem(COLLECTION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function loadNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const safe: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string') {
        safe[key] = value;
      }
    }
    return safe;
  } catch {
    return {};
  }
}

export function useCrystalVault() {
  const [collectionIds, setCollectionIds] = useState<string[]>(() => loadCollection());
  const [notesById, setNotesById] = useState<Record<string, string>>(() => loadNotes());

  useEffect(() => {
    try {
      localStorage.setItem(COLLECTION_KEY, JSON.stringify(collectionIds));
    } catch {
      // Ignore storage write failure
    }
  }, [collectionIds]);

  useEffect(() => {
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(notesById));
    } catch {
      // Ignore storage write failure
    }
  }, [notesById]);

  const toggleCollection = useCallback((crystalId: string) => {
    setCollectionIds((prev) =>
      prev.includes(crystalId) ? prev.filter((id) => id !== crystalId) : [...prev, crystalId],
    );
  }, []);

  const updateNote = useCallback((crystalId: string, note: string) => {
    setNotesById((prev) => ({
      ...prev,
      [crystalId]: note,
    }));
  }, []);

  return {
    collectionIds,
    notesById,
    toggleCollection,
    updateNote,
  };
}
