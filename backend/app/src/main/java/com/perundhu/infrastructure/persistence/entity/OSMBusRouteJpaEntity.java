package com.perundhu.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "osm_bus_routes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class OSMBusRouteJpaEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @EqualsAndHashCode.Include
  private Long id;

  @Column(name = "osm_relation_id", unique = true, nullable = false)
  private Long osmRelationId;

  @Column(name = "route_ref", length = 50)
  private String routeRef;

  @Column(name = "route_name")
  private String routeName;

  private String network;
  private String operator;

  @Column(name = "from_location")
  private String fromLocation;

  @Column(name = "to_location")
  private String toLocation;

  @Column(name = "route_type")
  private String routeType = "bus";

  private String frequency;

  @Column(name = "operating_hours", length = 100)
  private String operatingHours;

  @Column(name = "estimated_duration")
  private Integer estimatedDuration; // in minutes

  @Column(name = "estimated_distance")
  private Double estimatedDistance; // in km

  @Column(name = "relevance_score")
  private Double relevanceScore = 0.0;

  @Column(name = "last_updated")
  private LocalDateTime lastUpdated;

  @Column(name = "created_at")
  private LocalDateTime createdAt;

  @OneToMany(mappedBy = "osmBusRoute", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
  @OrderBy("stopSequence ASC")
  private List<OSMRouteStopJpaEntity> routeStops;

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