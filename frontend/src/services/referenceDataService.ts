import type { ApiResponse } from '../types';
import { apiRequest } from './api';

// Interface for reference data items
interface ReferenceItem {
  id: number;
  name: string;
  code?: string;
  description?: string;
}

// Specific reference data types
export interface BusType extends ReferenceItem {}
export interface RouteType extends ReferenceItem {}
export interface Operator extends ReferenceItem {}
export interface DepartureTimeSlot extends ReferenceItem {}

/**
 * Fetch all bus types (AC, Non-AC, Sleeper, etc.)
 */
export const getBusTypes = async (): Promise<BusType[]> => {
  try {
    const response = await apiRequest<ApiResponse<BusType[]>>('GET', '/api/reference/bus-types');
    return response.data;
  } catch (error) {
    console.error('Error fetching bus types:', error);
    return [];
  }
};

/**
 * Fetch all route types (Express, Local, etc.)
 */
export const getRouteTypes = async (): Promise<RouteType[]> => {
  try {
    const response = await apiRequest<ApiResponse<RouteType[]>>('GET', '/api/reference/route-types');
    return response.data;
  } catch (error) {
    console.error('Error fetching route types:', error);
    return [];
  }
};

/**
 * Fetch all operators (SETC, TNSTC, etc.)
 */
export const getOperators = async (): Promise<Operator[]> => {
  try {
    const response = await apiRequest<ApiResponse<Operator[]>>('GET', '/api/reference/operators');
    return response.data;
  } catch (error) {
    console.error('Error fetching operators:', error);
    return [];
  }
};

/**
 * Fetch all departure time slots (Morning, Afternoon, etc.)
 */
export const getDepartureTimeSlots = async (): Promise<DepartureTimeSlot[]> => {
  try {
    const response = await apiRequest<ApiResponse<DepartureTimeSlot[]>>('GET', '/api/reference/departure-time-slots');
    return response.data;
  } catch (error) {
    console.error('Error fetching departure time slots:', error);
    return [];
  }
};