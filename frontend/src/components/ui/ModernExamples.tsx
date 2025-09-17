import React, { useState } from 'react';
import { Search, MapPin, Clock, DollarSign, Users, Star } from 'lucide-react';
import ModernCard from './ModernCard';
import ModernButton from './ModernButton';
import ModernInput from './ModernInput';
import ModernSearchForm from './ModernSearchForm';
import { TouchTabs, SwipeableCard } from './TouchComponents';
import { SearchLayout, ResultsLayout } from './ModernLayout';
import { useToast, FloatingActionButton, AnimatedCounter } from './ModernAnimations';
import { cn } from '../../utils/cn';

// Modern Bus Card with enhanced mobile design
interface ModernBusCardProps {
  bus: {
    id: string;
    name: string;
    route: string;
    departure: string;
    arrival: string;
    duration: string;
    price: number;
    rating: number;
    type: string;
    seatsAvailable: number;
    amenities: string[];
  };
  onBook?: (busId: string) => void;
  onViewDetails?: (busId: string) => void;
}

export const ModernBusCard: React.FC<ModernBusCardProps> = ({
  bus,
  onBook,
  onViewDetails
}) => {
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleSwipeRight = () => {
    onBook?.(bus.id);
  };

  const handleSwipeLeft = () => {
    setIsBookmarked(!isBookmarked);
  };

  return (
    <SwipeableCard
      onSwipeRight={handleSwipeRight}
      onSwipeLeft={handleSwipeLeft}
      className="mb-4"
    >
      <ModernCard
        variant="default"
        hover
        animated
        className="relative overflow-hidden"
      >
        {/* Status Badge */}
        <div className="absolute top-4 right-4 z-10">
          <span className={cn(
            'px-2 py-1 text-xs font-semibold rounded-full',
            bus.seatsAvailable > 10
              ? 'bg-green-100 text-green-800'
              : bus.seatsAvailable > 0
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          )}>
            {bus.seatsAvailable > 0 ? `${bus.seatsAvailable} seats` : 'Full'}
          </span>
        </div>

        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {bus.name}
              </h3>
              <p className="text-sm text-gray-600 mb-2">{bus.type}</p>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-sm font-medium text-gray-700">
                  {bus.rating}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                ₹<AnimatedCounter value={bus.price} />
              </div>
              <p className="text-xs text-gray-500">per person</p>
            </div>
          </div>

          {/* Route & Timing */}
          <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-100">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-900">
                  {bus.departure}
                </span>
              </div>
              <p className="text-xs text-gray-500">Departure</p>
            </div>
            
            <div className="text-center">
              <div className="text-sm font-medium text-primary-600 mb-1">
                {bus.duration}
              </div>
              <div className="w-full h-0.5 bg-gray-200 relative">
                <div className="absolute inset-0 bg-primary-500 rounded-full animate-pulse" />
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-900">
                  {bus.arrival}
                </span>
              </div>
              <p className="text-xs text-gray-500">Arrival</p>
            </div>
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-1">
            {bus.amenities.slice(0, 3).map((amenity, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md"
              >
                {amenity}
              </span>
            ))}
            {bus.amenities.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md">
                +{bus.amenities.length - 3} more
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <ModernButton
              variant="outline"
              size="sm"
              onClick={() => onViewDetails?.(bus.id)}
              className="flex-1"
            >
              View Details
            </ModernButton>
            <ModernButton
              variant="primary"
              size="sm"
              onClick={() => onBook?.(bus.id)}
              className="flex-1"
              disabled={bus.seatsAvailable === 0}
            >
              {bus.seatsAvailable === 0 ? 'Full' : 'Book Now'}
            </ModernButton>
          </div>
        </div>
      </ModernCard>
    </SwipeableCard>
  );
};

// Modern Search Results Component
export const ModernSearchResults: React.FC<{
  results: any[];
  isLoading: boolean;
  filters: any;
  onFilterChange: (filters: any) => void;
}> = ({
  results,
  isLoading,
  filters,
  onFilterChange
}) => {
  const [activeTab, setActiveTab] = useState('all');
  const { showToast } = useToast();

  const tabs = [
    { id: 'all', label: 'All Buses', badge: results.length },
    { id: 'ac', label: 'AC', badge: results.filter(b => b.type.includes('AC')).length },
    { id: 'non-ac', label: 'Non-AC', badge: results.filter(b => !b.type.includes('AC')).length },
  ];

  const handleBookBus = (busId: string) => {
    showToast({
      type: 'success',
      title: 'Booking Initiated',
      message: 'Redirecting to booking page...'
    });
  };

  const handleAddFilter = () => {
    // Add filter logic here
    showToast({
      type: 'info',
      title: 'Filter Added',
      message: 'Search results updated'
    });
  };

  return (
    <ResultsLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Search Results
            </h1>
            <p className="text-gray-600 mt-1">
              <AnimatedCounter value={results.length} /> buses found
            </p>
          </div>
        </div>

        {/* Filters Tabs */}
        <TouchTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="pills"
        />

        {/* Results List */}
        <div className="space-y-4">
          {results.map((bus) => (
            <ModernBusCard
              key={bus.id}
              bus={bus}
              onBook={handleBookBus}
              onViewDetails={(id) => console.log('View details:', id)}
            />
          ))}
        </div>

        {/* Floating Action Button */}
        <FloatingActionButton
          icon={Search}
          onClick={handleAddFilter}
          label="Add Filter"
          position="bottom-right"
        />
      </div>
    </ResultsLayout>
  );
};

// Modern Search Page Example
export const ModernSearchPage: React.FC = () => {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (from: string, to: string, filters: any) => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock results
      const mockResults = [
        {
          id: '1',
          name: 'Volvo Express',
          route: `${from} → ${to}`,
          departure: '08:30',
          arrival: '14:45',
          duration: '6h 15m',
          price: 850,
          rating: 4.5,
          type: 'AC Volvo',
          seatsAvailable: 12,
          amenities: ['WiFi', 'Charging Point', 'Water Bottle', 'Blanket']
        },
        {
          id: '2',
          name: 'State Express',
          route: `${from} → ${to}`,
          departure: '10:15',
          arrival: '16:30',
          duration: '6h 15m',
          price: 650,
          rating: 4.2,
          type: 'AC Sleeper',
          seatsAvailable: 5,
          amenities: ['Charging Point', 'Water Bottle']
        }
      ];
      
      setSearchResults(mockResults);
    } finally {
      setIsLoading(false);
    }
  };

  if (searchResults.length > 0) {
    return (
      <ModernSearchResults
        results={searchResults}
        isLoading={isLoading}
        filters={{}}
        onFilterChange={() => {}}
      />
    );
  }

  return (
    <SearchLayout>
      <ModernSearchForm
        onSearch={handleSearch}
        isLoading={isLoading}
        variant="glass"
        suggestions={[
          { id: '1', name: 'Chennai', type: 'city' },
          { id: '2', name: 'Bangalore', type: 'city' },
          { id: '3', name: 'Coimbatore', type: 'city' },
          { id: '4', name: 'Madurai', type: 'city' },
        ]}
      />
    </SearchLayout>
  );
};