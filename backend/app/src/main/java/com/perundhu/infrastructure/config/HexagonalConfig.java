package com.perundhu.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.perundhu.domain.model.Location;
import com.perundhu.domain.port.RouteContributionRepository;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.domain.port.BusAnalyticsRepository;
import com.perundhu.domain.service.RouteValidationService;
import com.perundhu.domain.service.LocationValidationService;
import com.perundhu.infrastructure.persistence.adapter.RouteContributionRepositoryAdapter;
import com.perundhu.infrastructure.persistence.adapter.BusJpaRepositoryAdapter;
import com.perundhu.infrastructure.persistence.adapter.BusAnalyticsRepositoryAdapter;
import com.perundhu.infrastructure.persistence.jpa.RouteContributionJpaRepository;
import com.perundhu.infrastructure.persistence.jpa.BusJpaRepository;
import com.perundhu.infrastructure.persistence.jpa.BusAnalyticsJpaRepository;

/**
 * Configuration class for hexagonal architecture components
 */
@Configuration
public class HexagonalConfig {

    /**
     * Implementation of RouteContributionRepository domain interface
     */
    @Bean
    public RouteContributionRepository routeContributionRepository(RouteContributionJpaRepository jpaRepository) {
        return new RouteContributionRepositoryAdapter(jpaRepository);
    }

    /**
     * Implementation of BusRepository domain interface
     */
    @Bean
    public BusRepository busRepository(BusJpaRepository jpaRepository) {
        return new BusJpaRepositoryAdapter(jpaRepository);
    }

    /**
     * Implementation of BusAnalyticsRepository domain interface
     */
    @Bean
    public BusAnalyticsRepository busAnalyticsRepository(BusAnalyticsJpaRepository jpaRepository) {
        return new BusAnalyticsRepositoryAdapter(jpaRepository);
    }

    /**
     * Implementation of RouteValidationService domain interface
     */
    @Bean
    public RouteValidationService routeValidationService() {
        return new RouteValidationService() {
            @Override
            public void validateRoute(Location from, Location to) {
                if (from == null || to == null) {
                    throw new IllegalArgumentException("Route locations cannot be null");
                }
                if (from.equals(to)) {
                    throw new IllegalArgumentException("Origin and destination cannot be the same");
                }
            }

            @Override
            public double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
                final double R = 6371; // Earth's radius in km
                double dLat = Math.toRadians(lat2 - lat1);
                double dLon = Math.toRadians(lon2 - lon1);
                double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                                Math.sin(dLon / 2) * Math.sin(dLon / 2);
                double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
            }
        };
    }

    /**
     * Implementation of LocationValidationService domain interface
     */
    @Bean
    public LocationValidationService domainLocationValidationService() {
        return new LocationValidationService() {
            @Override
            public void validateLocation(Location location) {
                if (location == null) {
                    throw new IllegalArgumentException("Location cannot be null");
                }
                if (location.getName() == null || location.getName().trim().isEmpty()) {
                    throw new IllegalArgumentException("Location name cannot be empty");
                }
                if (location.getLatitude() == null || location.getLongitude() == null) {
                    throw new IllegalArgumentException("Location coordinates cannot be null");
                }
                if (location.getLatitude() < -90 || location.getLatitude() > 90) {
                    throw new IllegalArgumentException("Invalid latitude: " + location.getLatitude());
                }
                if (location.getLongitude() < -180 || location.getLongitude() > 180) {
                    throw new IllegalArgumentException("Invalid longitude: " + location.getLongitude());
                }
            }
        };
    }
}