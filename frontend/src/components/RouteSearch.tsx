/**
 * RouteSearch - Simple route search component
 * TODO: This is a placeholder - consolidate with TransitSearchForm functionality
 */
import React from 'react';

interface RouteSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: (query: string) => void;
  isSearching: boolean;
}

const RouteSearch: React.FC<RouteSearchProps> = ({
  searchQuery,
  setSearchQuery,
  onSearch,
  isSearching
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <div style={{ padding: '16px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search routes..."
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '14px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            style={{
              padding: '12px 24px',
              background: isSearching ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isSearching ? 'not-allowed' : 'pointer',
              fontWeight: 500
            }}
          >
            {isSearching ? '🔍 Searching...' : '🔍 Search'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RouteSearch;
