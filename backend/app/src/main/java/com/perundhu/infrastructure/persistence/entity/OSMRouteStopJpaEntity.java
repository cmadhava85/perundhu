package com.perundhu.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "osm_route_stops")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class OSMRouteStopJpaEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @EqualsAndHashCode.Include
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "osm_route_id", nullable = false)
  private OSMBusRouteJpaEntity osmBusRoute;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "osm_stop_id", nullable = false)
  private OSMBusStopJpaEntity osmBusStop;

  @Column(name = "stop_sequence", nullable = false)
  private Integer stopSequence;

  @Column(name = "created_at")
  private LocalDateTime createdAt;

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
  }
}