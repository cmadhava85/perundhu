package com.perundhu.infrastructure.config;

import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;

import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

/**
 * Configuration for reactive WebClient - the modern, non-blocking HTTP client.
 * 
 * WebClient advantages over RestTemplate:
 * - Non-blocking I/O with reactive streams
 * - Better resource utilization for high-concurrency scenarios
 * - Built-in retry, timeout, and error handling
 * - Fluent API for building requests
 * - Works seamlessly with virtual threads
 * 
 * Use WebClient for all external HTTP calls (APIs, webhooks, etc.)
 * 
 * Note: This config is disabled in tests where WebFlux autoconfiguration is not
 * available.
 */
@Configuration
@ConditionalOnProperty(name = "app.webclient.enabled", havingValue = "true", matchIfMissing = true)
public class WebClientConfig {

  private static final Logger log = LoggerFactory.getLogger(WebClientConfig.class);

  private static final int DEFAULT_TIMEOUT_SECONDS = 30;
  private static final int CONNECTION_TIMEOUT_SECONDS = 10;

  /**
   * Default WebClient for general use.
   * Configured with logging, timeouts, and error handling.
   */
  @Bean
  public WebClient webClient(WebClient.Builder builder) {
    log.info("Configuring reactive WebClient with {}s timeout", DEFAULT_TIMEOUT_SECONDS);

    HttpClient httpClient = HttpClient.create()
        .responseTimeout(Duration.ofSeconds(DEFAULT_TIMEOUT_SECONDS))
        .option(io.netty.channel.ChannelOption.CONNECT_TIMEOUT_MILLIS,
            CONNECTION_TIMEOUT_SECONDS * 1000);

    return builder
        .clientConnector(new ReactorClientHttpConnector(httpClient))
        .filter(logRequest())
        .filter(logResponse())
        .filter(handleErrors())
        .build();
  }

  /**
   * WebClient specifically configured for OpenStreetMap/Nominatim API.
   * Has longer timeout and proper User-Agent header as required by OSM.
   */
  @Bean(name = "osmWebClient")
  public WebClient osmWebClient(WebClient.Builder builder) {
    log.info("Configuring WebClient for OpenStreetMap API");

    HttpClient httpClient = HttpClient.create()
        .responseTimeout(Duration.ofSeconds(15))
        .option(io.netty.channel.ChannelOption.CONNECT_TIMEOUT_MILLIS, 10000);

    return builder
        .baseUrl("https://nominatim.openstreetmap.org")
        .clientConnector(new ReactorClientHttpConnector(httpClient))
        .defaultHeader("User-Agent", "Perundhu/1.0 (https://perundhu.app; contact@perundhu.app)")
        .defaultHeader("Accept", "application/json")
        .filter(logRequest())
        .filter(handleErrors())
        .build();
  }

  /**
   * WebClient for Google Gemini Vision API calls.
   */
  @Bean(name = "geminiWebClient")
  public WebClient geminiWebClient(WebClient.Builder builder) {
    log.info("Configuring WebClient for Gemini Vision API");

    HttpClient httpClient = HttpClient.create()
        .responseTimeout(Duration.ofSeconds(60)) // Longer timeout for AI processing
        .option(io.netty.channel.ChannelOption.CONNECT_TIMEOUT_MILLIS, 15000);

    return builder
        .baseUrl("https://generativelanguage.googleapis.com")
        .clientConnector(new ReactorClientHttpConnector(httpClient))
        .defaultHeader("Content-Type", "application/json")
        .filter(logRequest())
        .filter(handleErrors())
        .build();
  }

  /**
   * Logging filter for outgoing requests
   */
  private ExchangeFilterFunction logRequest() {
    return ExchangeFilterFunction.ofRequestProcessor(clientRequest -> {
      log.debug("WebClient Request: {} {}",
          clientRequest.method(),
          clientRequest.url());
      return Mono.just(clientRequest);
    });
  }

  /**
   * Logging filter for incoming responses
   */
  private ExchangeFilterFunction logResponse() {
    return ExchangeFilterFunction.ofResponseProcessor(clientResponse -> {
      log.debug("WebClient Response: Status={}",
          clientResponse.statusCode());
      return Mono.just(clientResponse);
    });
  }

  /**
   * Error handling filter
   */
  private ExchangeFilterFunction handleErrors() {
    return ExchangeFilterFunction.ofResponseProcessor(clientResponse -> {
      if (clientResponse.statusCode().isError()) {
        return clientResponse.bodyToMono(String.class)
            .flatMap(errorBody -> {
              log.error("WebClient Error: Status={}, Body={}",
                  clientResponse.statusCode(), errorBody);
              return Mono.just(clientResponse);
            });
      }
      return Mono.just(clientResponse);
    });
  }
}
