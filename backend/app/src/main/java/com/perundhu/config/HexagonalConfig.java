package com.perundhu.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import com.perundhu.domain.service.OCRService;
import com.perundhu.infrastructure.adapter.service.impl.OCRServiceImpl;

import com.perundhu.domain.service.RouteValidationService;
import com.perundhu.domain.service.LocationValidationService;
import com.perundhu.domain.port.RouteContributionRepository;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.domain.port.LocationRepository;
import com.perundhu.domain.port.StopRepository;
import com.perundhu.domain.port.BusAnalyticsRepository;
import com.perundhu.infrastructure.persistence.adapter.RouteContributionRepositoryAdapter;
import com.perundhu.infrastructure.persistence.adapter.BusJpaRepositoryAdapter;
import com.perundhu.infrastructure.persistence.adapter.LocationJpaRepositoryAdapter;
import com.perundhu.infrastructure.persistence.adapter.StopJpaRepositoryAdapter;
import com.perundhu.infrastructure.persistence.adapter.BusAnalyticsRepositoryAdapter;
import com.perundhu.infrastructure.persistence.jpa.RouteContributionJpaRepository;
import com.perundhu.infrastructure.persistence.jpa.BusJpaRepository;
import com.perundhu.infrastructure.persistence.jpa.LocationJpaRepository;
import com.perundhu.infrastructure.persistence.jpa.StopJpaRepository;
import com.perundhu.infrastructure.persistence.jpa.BusAnalyticsJpaRepository;

/**
 * Hexagonal Architecture Configuration
 * Configures beans for the hexagonal architecture layers
 */
@Configuration
@EnableJpaRepositories(basePackages = "com.perundhu.infrastructure.persistence.jpa")
public class HexagonalConfig {

  @Bean
  public RouteContributionRepository routeContributionRepository(
      @Qualifier("jpaPackageRouteContributionJpaRepository") RouteContributionJpaRepository jpaRepository) {
    return new RouteContributionRepositoryAdapter(jpaRepository);
  }

  @Bean
  public BusRepository busRepository(BusJpaRepository jpaRepository) {
    return new BusJpaRepositoryAdapter(jpaRepository);
  }

  @Bean
  public LocationRepository locationRepository(LocationJpaRepository locationJpaRepository) {
    return new LocationJpaRepositoryAdapter(locationJpaRepository);
  }

  @Bean
  public StopRepository stopRepository(@Qualifier("jpaPackageStopJpaRepository") StopJpaRepository stopJpaRepository) {
    return new StopJpaRepositoryAdapter(stopJpaRepository);
  }

  @Bean
  public BusAnalyticsRepository busAnalyticsRepository(
      @Qualifier("jpaPackageBusAnalyticsJpaRepository") BusAnalyticsJpaRepository jpaRepository) {
    return new BusAnalyticsRepositoryAdapter(jpaRepository);
  }

  @Bean
  public RouteValidationService routeValidationService() {
    return new RouteValidationService() {
      @Override
      public void validateRoute(com.perundhu.domain.model.Location from, com.perundhu.domain.model.Location to) {
        if (from == null || to == null) {
          throw new IllegalArgumentException("From and to locations cannot be null");
        }
        if (from.equals(to)) {
          throw new IllegalArgumentException("From and to locations cannot be the same");
        }
      }

      @Override
      public double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371; // Earth radius in km
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

  @Bean("domainLocationValidationService")
  public LocationValidationService domainLocationValidationService() {
    return new LocationValidationService() {
      @Override
      public void validateLocation(com.perundhu.domain.model.Location location) {
        if (location == null) {
          throw new IllegalArgumentException("Location cannot be null");
        }
        if (location.getName() == null || location.getName().trim().isEmpty()) {
          throw new IllegalArgumentException("Location name cannot be null or empty");
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

  @Bean
  public OCRService ocrService() {
    return new OCRServiceImpl();
  }
}