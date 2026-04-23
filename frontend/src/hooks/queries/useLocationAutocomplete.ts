import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { locationAutocompleteService, type LocationSuggestion } from '../../services/locationAutocompleteService';
import { useDebouncedValue } from '../useDebouncedValue';
import { queryKeys } from '../../lib/queryClient';

const AUTOCOMPLETE_DEBOUNCE_MS = 300;
const AUTOCOMPLETE_MIN_LENGTH = 3;

export function useLocationAutocomplete(query: string) {
  const { i18n } = useTranslation();
  const debouncedQuery = useDebouncedValue(query, AUTOCOMPLETE_DEBOUNCE_MS);

  const result = useQuery<LocationSuggestion[]>({
    queryKey: queryKeys.locationAutocomplete(debouncedQuery, i18n.language),
    queryFn: () =>
      locationAutocompleteService.getLocationSuggestions(debouncedQuery, i18n.language),
    enabled: debouncedQuery.trim().length >= AUTOCOMPLETE_MIN_LENGTH,
    staleTime: 5 * 60 * 1000,   // cache results for 5 minutes — reduces Cloud Run calls
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    suggestions: result.data ?? [],
    isLoading: result.isFetching,
    error: result.error,
  };
}
