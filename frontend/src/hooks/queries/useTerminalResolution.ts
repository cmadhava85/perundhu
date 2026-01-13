import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface TerminalInfo {
  terminalId: string;
  terminalName: string;
  displayName: string;
  address: string;
  latitude: number;
  longitude: number;
  message: string;
  isDifferentFromSearched: boolean;
}

interface TerminalResolutionResponse {
  originalSource: string;
  destination: string;
  needsTerminalInfo: boolean;
  terminal?: TerminalInfo;
  resolvedSource?: string;
  message?: string;
}

export const useTerminalResolution = (source: string, destination: string, enabled = true) => {
  return useQuery<TerminalResolutionResponse>({
    queryKey: ['terminalResolution', source, destination],
    queryFn: async () => {
      const response = await axios.get('/api/v1/terminals/resolve', {
        params: { source, destination },
      });
      return response.data;
    },
    enabled: enabled && !!source && !!destination,
  });
};

export const useChennaiTerminals = () => {
  return useQuery<TerminalInfo[]>({
    queryKey: ['chennaiTerminals'],
    queryFn: async () => {
      const response = await axios.get('/api/v1/terminals/chennai');
      return response.data;
    },
  });
};
