package com.perundhu.infrastructure.persistence.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA Entity for location_aliases table
 * Stores alternative names for locations to support flexible search
 * 
 * Example: "Broadway", "Broadway Bus Terminus", "Chennai - Broadway" 
 * all point to the same location
 */
@Entity
@Table(name = "location_aliases",
       indexes = {
           @Index(name = "idx_alias_name", columnList = "alias_name"),
           @Index(name = "idx_location_id", columnList = "location_id"),
           @Index(name = "idx_is_primary", columnList = "is_primary")
       },
       uniqueConstraints = {
           @UniqueConstraint(name = "unique_alias_name", columnNames = {"alias_name"})
       })
public class LocationAliasJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "location_id", nullable = false)
    private Long locationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", insertable = false, updatable = false)
    private LocationJpaEntity location;

    @Column(name = "alias_name", nullable = false, length = 255)
    private String aliasName;

    @Column(name = "is_primary", nullable = false)
    private Boolean isPrimary = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Constructors
    public LocationAliasJpaEntity() {
    }

    public LocationAliasJpaEntity(Long locationId, String aliasName, Boolean isPrimary) {
        this.locationId = locationId;
        this.aliasName = aliasName;
        this.isPrimary = isPrimary;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getLocationId() {
        return locationId;
    }

    public void setLocationId(Long locationId) {
        this.locationId = locationId;
    }

    public LocationJpaEntity getLocation() {
        return location;
    }

    public void setLocation(LocationJpaEntity location) {
        this.location = location;
    }

    public String getAliasName() {
        return aliasName;
    }

    public void setAliasName(String aliasName) {
        this.aliasName = aliasName;
    }

    public Boolean getIsPrimary() {
        return isPrimary;
    }

    public void setIsPrimary(Boolean isPrimary) {
        this.isPrimary = isPrimary;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public String toString() {
        return "LocationAliasJpaEntity{" +
                "id=" + id +
                ", locationId=" + locationId +
                ", aliasName='" + aliasName + '\'' +
                ", isPrimary=" + isPrimary +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}
