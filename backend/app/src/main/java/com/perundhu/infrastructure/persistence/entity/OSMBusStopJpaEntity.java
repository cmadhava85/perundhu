package com.perundhu.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "osm_bus_stops")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class OSMBusStopJpaEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @EqualsAndHashCode.Include
  private Long id;

  @Column(name = "osm_id", unique = true, nullable = false)
  private Long osmId;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private Double latitude;

  @Column(nullable = false)
  private Double longitude;

  @Enumerated(EnumType.STRING)
  @Column(name = "stop_type")
  @Builder.Default
  private StopType stopType = StopType.BUS_STOP;

  @Column(name = "has_shelter")
  @Builder.Default
  private Boolean hasShelter = false;

  @Column(name = "has_bench")
  @Builder.Default
  private Boolean hasBench = false;

  private String network;
  private String operator;
  private String accessibility;
  private String surface;

  @Column(name = "last_updated")
  private LocalDateTime lastUpdated;

  @Column(name = "created_at")
  private LocalDateTime createdAt;

  @OneToMany(mappedBy = "osmBusStop", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
  private List<OSMRouteStopJpaEntity> routeStops;

  public enum StopType {
    BUS_STOP, PLATFORM, STATION
  }

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
    lastUpdated = LocalDateTime.now();
  }

  @PreUpdate
  protected void onUpdate() {
    lastUpdated = LocalDateTime.now();
  }
}