package com.perundhu.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

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
  private Integer waitTimeMinutes = 0;

  // OSM-specific fields
  @Column(name = "is_osm_discovered")
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