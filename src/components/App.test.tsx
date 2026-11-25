import {act, fireEvent, render, renderHook, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach, describe, expect, it} from 'vitest';
import App from '../App';
import {useCrystalVault} from '../hooks/useCrystalVault';

describe('Astral Hours Integration Flows', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders Now screen with circular dial, navigates Chakra infographic & Crystal Vault (Blue Pill)', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Tab 1: Now
    expect(screen.getByRole('heading', {name: /Hour of/i})).toBeInTheDocument();
    const dialSection = screen.getByRole('region', {name: /24-Hour Chaldean Progression/i});
    expect(within(dialSection).getAllByRole('listitem')).toHaveLength(24);

    // Start and stop 3-min practice session
    const startBtn = screen.getByRole('button', {name: /Start 3-Minute Guided Session/i});
    await user.click(startBtn);
    expect(screen.getByRole('button', {name: /Stop/i})).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: /Stop/i}));

    // Tab 2: Chakra Sessions (Hero mandala + Chakra Flow cards)
    await user.click(screen.getByRole('button', {name: 'Chakra Sessions'}));
    expect(screen.getByRole('heading', {level: 1, name: /Heart Chakra/i})).toBeInTheDocument();

    // Clicking Throat Chakra Practice button in Chakra Flow selects Throat Chakra
    await user.click(screen.getByRole('button', {name: /Practice Throat Chakra/i}));
    expect(screen.getByRole('heading', {level: 1, name: /Throat Chakra/i})).toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: '10 min'}));
    await user.click(screen.getByRole('button', {name: /Relax/i}));
    await user.click(screen.getByRole('button', {name: /Begin 10-Min Practice/i}));
    expect(screen.getByRole('button', {name: /Stop/i})).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: /Stop/i}));

    // Tab 3: Crystal Vault (Slim moon line, open 3D viewer, floating gems)
    await user.click(screen.getByRole('button', {name: 'Crystal Vault'}));
    expect(screen.getByText(/Showing 30 of 30 stones/i)).toBeInTheDocument();

    const inspector = screen.getByRole('region', {name: /3D Crystal Specimen Inspector/i});
    expect(within(inspector).getByRole('heading', {level: 2})).toHaveTextContent('Clear Quartz');
    // Water-safe stone omits warning notice
    expect(within(inspector).queryByText(/Water Safety:/i)).not.toBeInTheDocument();

    const amethystCardHeading = screen.getByRole('heading', {level: 3, name: 'Amethyst'});
    await user.click(amethystCardHeading);
    expect(within(inspector).getByRole('heading', {level: 2})).toHaveTextContent('Amethyst');

    const searchInput = screen.getByLabelText('Search crystals');
    fireEvent.change(searchInput, {target: {value: 'Malachite'}});
    expect(searchInput).toHaveValue('Malachite');
    expect(await screen.findByText(/Showing 1 of 30 stones/i)).toBeInTheDocument();
    expect(within(inspector).getByRole('heading', {level: 2})).toHaveTextContent('Malachite');
    expect(within(inspector).getByText(/Water Safety: Unsafe \/ Toxic/i)).toBeInTheDocument();
  });

  it('persists useCrystalVault storage and rejects invalid coordinates in Location Drawer (Red Pill)', async () => {
    localStorage.setItem('astral_hours_location_v1', '{invalid-json');
    localStorage.setItem('astral_hours_crystal_collection_v1', '{"not":"an-array"}');
    localStorage.setItem('astral_hours_crystal_notes_v1', '[]');

    const {result} = renderHook(() => useCrystalVault());
    expect(result.current.collectionIds).toEqual([]);
    act(() => {
      result.current.toggleCollection('malachite');
      result.current.updateNote('malachite', 'Keep dry only');
    });
    expect(localStorage.getItem('astral_hours_crystal_collection_v1')).toContain('malachite');
    expect(localStorage.getItem('astral_hours_crystal_notes_v1')).toContain('Keep dry only');

    const user = userEvent.setup();
    render(<App />);

    // Open Location Drawer via header button
    const locBtn = screen.getAllByRole('button', {name: /San Francisco/i})[0];
    await user.click(locBtn);

    const drawer = screen.getByLabelText(/Observer Location and Time Settings/i);
    const latInput = within(drawer).getByLabelText(/Latitude/i);
    await user.clear(latInput);
    await user.type(latInput, '125');
    await user.click(within(drawer).getByRole('button', {name: /Apply Coordinates/i}));

    expect(within(drawer).getByRole('alert')).toHaveTextContent(/Latitude must be -90 to 90/i);

    // Select Tokyo preset successfully
    await user.click(within(drawer).getByRole('button', {name: /Tokyo/i}));
    expect(screen.getAllByRole('button', {name: /Tokyo, JP/i})[0]).toBeInTheDocument();
  });
});
