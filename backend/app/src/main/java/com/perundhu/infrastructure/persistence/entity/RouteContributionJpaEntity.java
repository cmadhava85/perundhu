package com.perundhu.infrastructure.persistence.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * JPA entity for route contributions
 */
@Entity
@Table(name = "route_contributions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteContributionJpaEntity {
    
    @Id
    private String id;
    
    @Column(name = "user_id")
    private String userId;
    
    @Column(name = "bus_number")
    private String busNumber;
    
    @Column(name = "from_location_name")
    private String fromLocationName;
    
    @Column(name = "to_location_name")
    private String toLocationName;
    
    @Column(name = "from_latitude")
    private Double fromLatitude;
    
    @Column(name = "from_longitude")
    private Double fromLongitude;
    
    @Column(name = "to_latitude")
    private Double toLatitude;
    
    @Column(name = "to_longitude")
    private Double toLongitude;
    
    @Column(name = "schedule_info")
    private String scheduleInfo;
    
    @Column(name = "status")
    private String status;
    
    @Column(name = "submission_date")
    private LocalDateTime submissionDate;
    
    @Column(name = "processed_date")
    private LocalDateTime processedDate;

    @Column(name = "additional_notes")
    private String additionalNotes;
    
    @Column(name = "validation_message")
    private String validationMessage;
}

