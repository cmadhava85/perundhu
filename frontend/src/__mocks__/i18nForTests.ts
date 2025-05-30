import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { TFunction } from 'i18next';

// Mock i18next
i18n
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    lng: 'en',
    resources: {
      en: {
        translation: {
          'busList.availableBuses': 'Available Buses',
          'connectingRoutes.title': 'No Direct Routes Available',
          'connectingRoutes.subtitle': 'We found the following connecting routes',
          'connectingRoutes.totalDuration': 'Total journey time',
          'connectingRoutes.waitingTime': 'Waiting time',
          'connectingRoutes.atStation': 'at',
          'connectingRoutes.connectionAt': 'Change buses at',
          'connectingRoutes.firstLeg': 'First Leg',
          'connectingRoutes.secondLeg': 'Second Leg',
          'connectingRoutes.from': 'From',
          'connectingRoutes.to': 'To',
          'connectingRoutes.busDetails': 'Bus Details',
          'connectingRoutes.departure': 'Departure',
          'connectingRoutes.arrival': 'Arrival',
          'connectingRoutes.waitTime': 'Wait Time',
          'search.button': 'Search',
          'error.message': 'Error loading data',
          'loading.message': 'Loading...'
        }
      }
    },
    interpolation: {
      escapeValue: false
    },
    debug: false
  });

// Create a proper mock of the t function that satisfies the TFunction interface
const mockT = ((key: string) => {
  return key;
}) as TFunction;

// Replace the t function with our mock
i18n.t = mockT;

export default i18n;