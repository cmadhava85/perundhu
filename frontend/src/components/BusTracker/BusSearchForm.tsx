import React from 'react';
import type { Location } from '../../types';
import './BusSearchForm.css';
import { useTranslation } from 'react-i18next';

interface BusSearchFormProps {
  fromLocation: Location | null;
  toLocation: Location | null;
  onFromLocationChange: (location: Location | null) => void;
  onToLocationChange: (location: Location | null) => void;
  onSearch: () => void;
  isLoading: boolean;
}

export const BusSearchForm: React.FC<BusSearchFormProps> = ({
  fromLocation,
  toLocation,
  onFromLocationChange,
  onToLocationChange,
  onSearch,
  isLoading
}) => {
  const { t } = useTranslation();

  const handleSwapLocations = () => {
    onFromLocationChange(toLocation);
    onToLocationChange(fromLocation);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        {t('searchForm.title', 'Find Your Bus')}
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('searchForm.fromLabel', 'From')}
          </label>
          {/* Location selector component would go here */}
          <div className="p-3 border rounded-md bg-gray-50">
            {fromLocation?.name || t('common.chooseYourLocation', 'Choose your location')}
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleSwapLocations}
            className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
            disabled={!fromLocation || !toLocation}
          >
            ⇅
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('searchForm.toLabel', 'To')}
          </label>
          <div className="p-3 border rounded-md bg-gray-50">
            {toLocation?.name || t('common.chooseDestination', 'Choose your destination')}
          </div>
        </div>

        <button
          onClick={onSearch}
          disabled={!fromLocation || !toLocation || isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading 
            ? t('common.loading', 'Loading...') 
            : t('searchForm.searchButton', 'Search Buses')
          }
        </button>
      </div>
    </div>
  );
};