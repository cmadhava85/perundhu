/**
 * Type definitions for API models
 * 
 * IMPORTANT: Most types are defined in index.ts as the source of truth.
 * This file re-exports them and adds any API-specific types that aren't
 * needed in the general application types.
 */

// Re-export all types from index.ts to maintain backward compatibility
export type { 
  ApiResponse,
  Bus, 
  Stop, 
  Location,
  BusLocation,
  BusLocationReport,
  RewardPoints,
  RewardActivity,
  RouteContribution,
  ImageContribution,
  ConnectingRoute, 
  ConnectingRouteLeg, 
  ConnectingRouteStop, 
  ConnectingRouteLocation,
  BusStand,
  MultiStandSearchResponse,
  MultiStandCheckResponse
} from './index';