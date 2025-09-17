package com.perundhu.infrastructure.persistence.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "connecting_routes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ConnectingRouteJpaEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @EqualsAndHashCode.Include
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "first_bus_id", nullable = false)
  private BusJpaEntity firstBus;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "second_bus_id", nullable = false)
  private BusJpaEntity secondBus;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "connection_point_id", nullable = false)
  private LocationJpaEntity connectionPoint;

  @Column(name = "wait_time_minutes")
  @Builder.Default
  private Integer waitTimeMinutes = 0;

  // OSM-specific fields
  @Column(name = "is_osm_discovered")
  @Builder.Default
  private Boolean isOsmDiscovered = false;

  @Column(name = "osm_route_ref", length = 50)
  private String osmRouteRef;

  @Column(name = "osm_network", length = 100)
  private String osmNetwork;

  @Column(name = "osm_operator", length = 100)
  private String osmOperator;

  @Column(name = "created_at")
  private LocalDateTime createdAt;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
    updatedAt = LocalDateTime.now();
  }

  @PreUpdate
  protected void onUpdate() {
    updatedAt = LocalDateTime.now();
  }
}