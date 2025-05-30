import { getEnv } from '../utils/environment';

export interface FeatureFlags {
  enableMap: boolean;
}

export const featureFlags: FeatureFlags = {
  enableMap: getEnv('VITE_ENABLE_MAP') === 'true'
};