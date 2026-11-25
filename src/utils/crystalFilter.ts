import type {ChakraId, CrystalItem, WaterSafety} from '../types/astral';

export interface CrystalFilterCriteria {
  searchQuery: string;
  chakra: ChakraId | 'All';
  waterSafety: WaterSafety | 'All';
  myCollectionOnly: boolean;
  collectionIds: string[];
}

export function filterCrystals(
  crystals: CrystalItem[],
  criteria: CrystalFilterCriteria,
): CrystalItem[] {
  const normalizedQuery = criteria.searchQuery.trim().toLowerCase();
  const collectionSet = new Set(criteria.collectionIds);

  return crystals.filter((crystal) => {
    if (criteria.myCollectionOnly && !collectionSet.has(crystal.id)) {
      return false;
    }

    if (criteria.chakra !== 'All' && crystal.chakra !== criteria.chakra) {
      return false;
    }

    if (criteria.waterSafety !== 'All' && crystal.waterSafety !== criteria.waterSafety) {
      return false;
    }

    if (normalizedQuery.length > 0) {
      const searchable = [
        crystal.name,
        crystal.mineralGroup,
        crystal.crystalSystem,
        crystal.chakra,
        crystal.traditionalLore,
        crystal.cleansingMethod,
      ]
        .join(' ')
        .toLowerCase();

      if (!searchable.includes(normalizedQuery)) {
        return false;
      }
    }

    return true;
  });
}
