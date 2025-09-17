import React, { useState } from 'react';
import { Search, MapPin, ArrowUpDown, Filter, X } from 'lucide-react';
import ModernInput from './ModernInput';
import ModernButton from './ModernButton';
import ModernCard from './ModernCard';
import { cn } from '../../utils/cn';

interface SearchLocation {
  id: string;
  name: string;
  type: 'city' | 'landmark' | 'station';
}

interface ModernSearchFormProps {
  onSearch: (from: string, to: string, filters?: any) => void;
  suggestions?: SearchLocation[];
  isLoading?: boolean;
  variant?: 'default' | 'glass' | 'minimal';
}

const ModernSearchForm: React.FC<ModernSearchFormProps> = ({
  onSearch,
  suggestions = [],
  isLoading = false,
  variant = 'default'
}) => {
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    departureTime: '',
    busType: '',
    priceRange: ''
  });

  const handleSwapLocations = () => {
    const temp = fromLocation;
    setFromLocation(toLocation);
    setToLocation(temp);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromLocation.trim() && toLocation.trim()) {
      onSearch(fromLocation, toLocation, filters);
    }
  };

  const clearFilters = () => {
    setFilters({
      departureTime: '',
      busType: '',
      priceRange: ''
    });
  };

  return (
    <ModernCard 
      variant={variant === 'minimal' ? 'default' : variant}
      padding="lg"
      className="w-full max-w-2xl mx-auto"
      animated
    >
      <form onSubmit={handleSearch} className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            Find Your Bus Route
          </h2>
          <p className="text-gray-600">
            Search for buses between cities and plan your journey
          </p>
        </div>

        {/* Location Inputs */}
        <div className="space-y-4">
          <div className="relative">
            <ModernInput
              label="From"
              placeholder="Enter departure city"
              value={fromLocation}
              onChange={(e) => setFromLocation(e.target.value)}
              leftIcon={MapPin}
              variant={variant === 'glass' ? 'glass' : 'default'}
              size="lg"
              required
            />
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleSwapLocations}
              className={cn(
                'p-2 rounded-full border-2 border-dashed border-gray-300',
                'hover:border-primary-500 hover:bg-primary-50 transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                'active:scale-95'
              )}
            >
              <ArrowUpDown className="w-5 h-5 text-gray-500 hover:text-primary-500 transition-colors" />
            </button>
          </div>

          <div className="relative">
            <ModernInput
              label="To"
              placeholder="Enter destination city"
              value={toLocation}
              onChange={(e) => setToLocation(e.target.value)}
              leftIcon={MapPin}
              variant={variant === 'glass' ? 'glass' : 'default'}
              size="lg"
              required
            />
          </div>
        </div>

        {/* Filters Toggle */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium',
              'text-gray-600 hover:text-gray-900 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg'
            )}
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          
          {showFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-slide-down">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ModernInput
                label="Departure Time"
                type="time"
                value={filters.departureTime}
                onChange={(e) => setFilters({...filters, departureTime: e.target.value})}
                variant="minimal"
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bus Type
                </label>
                <select
                  value={filters.busType}
                  onChange={(e) => setFilters({...filters, busType: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Any Type</option>
                  <option value="ac">AC Bus</option>
                  <option value="non-ac">Non-AC Bus</option>
                  <option value="sleeper">Sleeper</option>
                  <option value="volvo">Volvo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <select
                  value={filters.priceRange}
                  onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Any Price</option>
                  <option value="0-200">₹0 - ₹200</option>
                  <option value="200-500">₹200 - ₹500</option>
                  <option value="500-1000">₹500 - ₹1000</option>
                  <option value="1000+">₹1000+</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Search Button */}
        <ModernButton
          type="submit"
          variant="gradient"
          size="lg"
          fullWidth
          isLoading={isLoading}
          leftIcon={Search}
          disabled={!fromLocation.trim() || !toLocation.trim()}
        >
          {isLoading ? 'Searching...' : 'Search Buses'}
        </ModernButton>

        {/* Quick Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Popular Routes:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 4).map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => {
                    if (!fromLocation) {
                      setFromLocation(suggestion.name);
                    } else if (!toLocation) {
                      setToLocation(suggestion.name);
                    }
                  }}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-full',
                    'bg-gray-100 text-gray-700 hover:bg-gray-200',
                    'transition-colors duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1'
                  )}
                >
                  {suggestion.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </ModernCard>
  );
};

export default ModernSearchForm;