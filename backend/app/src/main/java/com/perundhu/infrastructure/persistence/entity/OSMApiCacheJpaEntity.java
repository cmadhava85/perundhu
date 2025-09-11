package com.perundhu.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "osm_api_cache")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class OSMApiCacheJpaEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @EqualsAndHashCode.Include
  private Long id;

  @Column(name = "query_hash", unique = true, nullable = false, length = 64)
  private String queryHash;

  @Enumerated(EnumType.STRING)
  @Column(name = "query_type", nullable = false)
  private QueryType queryType;

  @Column(name = "bbox_north")
  private Double bboxNorth;

  @Column(name = "bbox_south")
  private Double bboxSouth;

  @Column(name = "bbox_east")
  private Double bboxEast;

  @Column(name = "bbox_west")
  private Double bboxWest;

  @Column(name = "response_data", columnDefinition = "JSON")
  private String responseData;

  @Column(name = "expires_at", nullable = false)
  private LocalDateTime expiresAt;

  @Column(name = "created_at")
  private LocalDateTime createdAt;

  public enum QueryType {
    BUS_STOPS, BUS_ROUTES, ROUTE_RELATION
  }

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
  }
}