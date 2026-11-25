import {useEffect, useRef, useState} from 'react';
import gsap from 'gsap';
import {ChakraSessionsTab} from './components/ChakraSessionsTab';
import {CrystalVaultTab} from './components/CrystalVaultTab';
import {LocationDrawer} from './components/LocationDrawer';
import {NowTab} from './components/NowTab';
import {StarfieldBackground} from './components/StarfieldBackground';
import {TopNav} from './components/TopNav';
import {useBreathSession} from './hooks/useBreathSession';
import {useCrystalVault} from './hooks/useCrystalVault';
import {useGeolocation} from './hooks/useGeolocation';
import {usePlanetaryClock} from './hooks/usePlanetaryClock';
import type {ChakraId, TabId} from './types/astral';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('now');
  const [isLocationOpen, setIsLocationOpen] = useState<boolean>(false);
  const [selectedChakraId, setSelectedChakraId] = useState<ChakraId>('Heart');
  const [crystalSearchSeed, setCrystalSearchSeed] = useState<string>('');

  const {location, selectPreset, setManualCoordinates, requestBrowserLocation} = useGeolocation();
  const {
    schedule,
    lunar,
    customTimeIso,
    setTimeOverride,
    notificationsEnabled,
    notificationPermission,
    toggleNotifications,
  } = usePlanetaryClock(location.latitude, location.longitude);

  const breathSession = useBreathSession();
  const {collectionIds, notesById, toggleCollection, updateNote} = useCrystalVault();

  const tabStageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !tabStageRef.current) return;

    gsap.fromTo(
      tabStageRef.current,
      {opacity: 0, y: 8},
      {opacity: 1, y: 0, duration: 0.28, ease: 'power2.out', clearProps: 'transform'},
    );
  }, [activeTab]);

  const handleNavigateToChakra = (chakra: ChakraId) => {
    setSelectedChakraId(chakra);
    setActiveTab('chakras');
  };

  const handleNavigateToCrystal = (stoneName: string) => {
    setCrystalSearchSeed(stoneName);
    setActiveTab('crystals');
  };

  return (
    <div className="astral-nebula relative min-h-screen text-slate-100">
      <StarfieldBackground />

      <div className="relative z-10 flex min-h-screen flex-col">
        <TopNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          locationLabel={location.label}
          onToggleLocationDrawer={() => setIsLocationOpen((prev) => !prev)}
          isLocationOpen={isLocationOpen}
        />

        <LocationDrawer
          isOpen={isLocationOpen}
          onClose={() => setIsLocationOpen(false)}
          location={location}
          onSelectPreset={selectPreset}
          onRequestGps={requestBrowserLocation}
          onSetManualCoords={setManualCoordinates}
          customTimeIso={customTimeIso}
          onSetTimeOverride={setTimeOverride}
        />

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div ref={tabStageRef}>
            {activeTab === 'now' && (
              <NowTab
                schedule={schedule}
                locationLabel={location.label}
                onOpenLocation={() => setIsLocationOpen(true)}
                breathSession={breathSession}
                notificationsEnabled={notificationsEnabled}
                notificationPermission={notificationPermission}
                onToggleNotifications={toggleNotifications}
                onNavigateToChakra={handleNavigateToChakra}
                onNavigateToCrystal={handleNavigateToCrystal}
              />
            )}

            {activeTab === 'chakras' && (
              <ChakraSessionsTab
                selectedChakraId={selectedChakraId}
                onSelectChakra={setSelectedChakraId}
                breathSession={breathSession}
              />
            )}

            {activeTab === 'crystals' && (
              <CrystalVaultTab
                lunar={lunar}
                initialSearch={crystalSearchSeed}
                collectionIds={collectionIds}
                notesById={notesById}
                onToggleCollection={toggleCollection}
                onUpdateNote={updateNote}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
