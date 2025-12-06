package com.perundhu.infrastructure.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import com.perundhu.application.service.LocationResolutionService;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.domain.port.BusTimingRecordRepository;
import com.perundhu.domain.port.LocationRepository;
import com.perundhu.domain.port.LocationValidationService;
import com.perundhu.domain.port.RouteContributionRepository;
import com.perundhu.domain.port.SkippedTimingRecordRepository;
import com.perundhu.domain.port.StopRepository;
import com.perundhu.domain.port.TimingImageContributionRepository;
import com.perundhu.domain.port.TranslationRepository;
import com.perundhu.domain.port.TranslationService;
import com.perundhu.domain.service.RouteValidationService;
import com.perundhu.infrastructure.adapter.geocoding.FuzzyMatcher;
import com.perundhu.infrastructure.adapter.geocoding.NominatimClient;
import com.perundhu.infrastructure.persistence.adapter.BusJpaRepositoryAdapter;
import com.perundhu.infrastructure.persistence.adapter.BusTimingRecordRepositoryAdapter;
import com.perundhu.infrastructure.persistence.adapter.LocationJpaRepositoryAdapter;
import com.perundhu.infrastructure.persistence.adapter.RouteContributionRepositoryAdapter;
import com.perundhu.infrastructure.persistence.adapter.SkippedTimingRecordRepositoryAdapter;
import com.perundhu.infrastructure.persistence.adapter.StopJpaRepositoryAdapter;
import com.perundhu.infrastructure.persistence.adapter.TimingImageContributionRepositoryAdapter;
import com.perundhu.infrastructure.persistence.adapter.TranslationJpaRepositoryAdapter;
import com.perundhu.infrastructure.persistence.jpa.BusJpaRepository;
import com.perundhu.infrastructure.persistence.jpa.LocationJpaRepository;
import com.perundhu.infrastructure.persistence.jpa.RouteContributionJpaRepository;
import com.perundhu.infrastructure.persistence.jpa.StopJpaRepository;
import com.perundhu.infrastructure.persistence.jpa.TranslationJpaRepository;
import com.perundhu.infrastructure.persistence.repository.BusTimingRecordJpaRepository;
import com.perundhu.infrastructure.persistence.repository.SkippedTimingRecordJpaRepository;
import com.perundhu.infrastructure.persistence.repository.TimingImageContributionJpaRepository;
import com.perundhu.infrastructure.service.TranslationServiceImpl;

/**
 * Hexagonal Architecture Configuration
 * Configures beans for the hexagonal architecture layers
 */
@Configuration
@EnableJpaRepositories(basePackages = {
    "com.perundhu.infrastructure.persistence.jpa",
    "com.perundhu.infrastructure.persistence.repository"
})
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
  public LocationRepository locationRepository(
      @Qualifier("repositoryPackageLocationJpaRepository") LocationJpaRepository locationJpaRepository) {
    return new LocationJpaRepositoryAdapter(locationJpaRepository);
  }

  @Bean
  @Primary
  public StopRepository stopRepository(
      @Qualifier("jpaPackageStopJpaRepository") StopJpaRepository stopJpaRepository) {
    return new StopJpaRepositoryAdapter(stopJpaRepository);
  }

  @Bean
  @Primary
  public TranslationRepository translationRepository(
      @Qualifier("jpaPackageTranslationJpaRepository") TranslationJpaRepository translationJpaRepository) {
    return new TranslationJpaRepositoryAdapter(translationJpaRepository);
  }

  @Bean
  public TimingImageContributionRepository timingImageContributionRepository(
      @Qualifier("repositoryPackageTimingImageContributionJpaRepository") TimingImageContributionJpaRepository jpaRepository) {
    return new TimingImageContributionRepositoryAdapter(jpaRepository);
  }

  @Bean
  public BusTimingRecordRepository busTimingRecordRepository(
      @Qualifier("repositoryPackageBusTimingRecordJpaRepository") BusTimingRecordJpaRepository jpaRepository) {
    return new BusTimingRecordRepositoryAdapter(jpaRepository);
  }

  @Bean
  public SkippedTimingRecordRepository skippedTimingRecordRepository(
      @Qualifier("repositoryPackageSkippedTimingRecordJpaRepository") SkippedTimingRecordJpaRepository jpaRepository) {
    return new SkippedTimingRecordRepositoryAdapter(jpaRepository);
  }

  @Bean
  public RouteValidationService routeValidationService(LocationValidationService locationValidationService) {
    return new com.perundhu.application.service.RouteValidationServiceImpl(locationValidationService);
  }

  @Bean("domainLocationValidationService")
  @Primary
  public LocationValidationService domainLocationValidationService(LocationRepository locationRepository) {
    return new com.perundhu.application.service.LocationValidationServiceImpl(locationRepository);
  }

  @Bean
  public FuzzyMatcher fuzzyMatcher() {
    return new FuzzyMatcher();
  }

  @Bean
  public NominatimClient nominatimClient() {
    return new NominatimClient();
  }

  @Bean
  public LocationResolutionService locationResolutionService(
      LocationRepository locationRepository,
      FuzzyMatcher fuzzyMatcher,
      NominatimClient geocodingClient) {
    return new LocationResolutionService(locationRepository, fuzzyMatcher, geocodingClient);
  }

  @Bean
  public TranslationService translationService(TranslationRepository translationRepository,
      TranslationProperties translationProperties) {
    return new TranslationServiceImpl(translationRepository, translationProperties);
  }
}