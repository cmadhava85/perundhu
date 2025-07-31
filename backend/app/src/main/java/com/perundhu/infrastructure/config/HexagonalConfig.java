package com.perundhu.infrastructure.config;

import com.perundhu.infrastructure.persistence.jpa.BusJpaRepository;
import com.perundhu.infrastructure.persistence.jpa.StopJpaRepository;
import com.perundhu.infrastructure.persistence.jpa.TranslationJpaRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.perundhu.application.service.BusScheduleService;
import com.perundhu.application.service.BusScheduleServiceImpl;
import com.perundhu.application.service.BusAnalyticsService;
import com.perundhu.application.service.BusAnalyticsServiceImpl;
import com.perundhu.application.service.BusScheduleValidationServiceImpl;
import com.perundhu.application.service.ConnectingRouteServiceImpl;
import com.perundhu.application.service.LocationValidationServiceImpl;
import com.perundhu.application.service.MessageServiceImpl;
import com.perundhu.application.service.RouteValidationServiceImpl;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.domain.port.LocationRepository;
import com.perundhu.domain.port.MessageService;
import com.perundhu.domain.port.StopRepository;
import com.perundhu.domain.port.TranslationRepository;
import com.perundhu.domain.port.TranslationService;
import com.perundhu.domain.port.BusAnalyticsRepository;
import com.perundhu.domain.service.BusScheduleValidationService;
import com.perundhu.domain.service.ConnectingRouteService;
import com.perundhu.domain.service.LocationValidationService;
import com.perundhu.domain.service.RouteValidationService;
import com.perundhu.infrastructure.persistence.repository.LocationJpaRepository;
import com.perundhu.infrastructure.service.TranslationServiceImpl;
import com.perundhu.infrastructure.persistence.adapter.BusJpaRepositoryAdapter;
import com.perundhu.infrastructure.persistence.adapter.LocationJpaRepositoryAdapter;
import com.perundhu.infrastructure.persistence.adapter.StopJpaRepositoryAdapter;
import com.perundhu.infrastructure.persistence.adapter.TranslationJpaRepositoryAdapter;

@Configuration
public class HexagonalConfig {

    @Bean
    public BusRepository busRepository(BusJpaRepository jpaRepository) {
        return new BusJpaRepositoryAdapter(jpaRepository);
    }

    @Bean
    public LocationRepository locationRepository(LocationJpaRepository jpaRepository) {
        return new LocationJpaRepositoryAdapter(jpaRepository);
    }

    @Bean
    public StopRepository stopRepository(StopJpaRepository jpaRepository) {
        return new StopJpaRepositoryAdapter(jpaRepository);
    }

    @Bean
    public TranslationRepository translationRepository(TranslationJpaRepository jpaRepository) {
        return new TranslationJpaRepositoryAdapter(jpaRepository);
    }

    @Bean
    public TranslationService translationService(TranslationRepository translationRepository) {
        return new TranslationServiceImpl(translationRepository, new TranslationProperties());
    }

    @Bean
    public TranslationProperties translationProperties() {
        return new TranslationProperties();
    }

    @Bean
    public MessageService messageService() {
        return new MessageServiceImpl();
    }

    @Bean
    public LocationValidationService locationValidationService(LocationRepository locationRepository) {
        return new LocationValidationServiceImpl(locationRepository);
    }

    @Bean
    public RouteValidationService routeValidationService(LocationValidationService locationValidationService) {
        return new RouteValidationServiceImpl(locationValidationService);
    }

    @Bean
    public BusScheduleValidationService busScheduleValidationService(
            LocationValidationService locationValidationService,
            RouteValidationService routeValidationService) {
        return new BusScheduleValidationServiceImpl(locationValidationService, routeValidationService);
    }

    @Bean
    public ConnectingRouteService connectingRouteService() {
        return new ConnectingRouteServiceImpl();
    }

    @Bean
    public BusScheduleService busScheduleService(
            BusRepository busRepository,
            LocationRepository locationRepository,
            StopRepository stopRepository,
            TranslationRepository translationRepository,
            ConnectingRouteService connectingRouteService) {
        return new BusScheduleServiceImpl(
                busRepository,
                locationRepository,
                stopRepository,
                translationRepository,
                connectingRouteService);
    }

    @Bean
    public BusAnalyticsService busAnalyticsService(
            BusAnalyticsRepository busAnalyticsRepository,
            LocationRepository locationRepository) {
        return new BusAnalyticsServiceImpl(busAnalyticsRepository, locationRepository);
    }
}
