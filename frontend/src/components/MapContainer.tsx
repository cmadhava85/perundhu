import React, { useRef, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface MapContainerProps {
  children: (containerElement: HTMLDivElement) => ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A wrapper component that ensures the map container is properly mounted in the DOM
 * before the Google Map component tries to use it.
 * This fixes IntersectionObserver errors that occur when the map tries to observe
 * an element that doesn't exist yet.
 */
const MapContainer: React.FC<MapContainerProps> = ({ children, className, style }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    // Only set the container element once the ref is definitely attached to a DOM element
    if (containerRef.current) {
      setContainerElement(containerRef.current);
    }
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={className || 'map-container'} 
      style={style || { width: '100%', height: '400px' }}
    >
      {containerElement && children(containerElement)}
    </div>
  );
};

export default MapContainer;