package com.perundhu.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.time.LocalDateTime;

import com.perundhu.domain.model.RouteContribution;

/**
 * JPA entity for route contributions using Java 17 and Lombok features
 */
@Entity
@Table(name = "route_contributions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteContributionEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private String userId;
    
    @Column(name = "bus_number", nullable = false)
    private String busNumber;
    
    @Column(name = "bus_name")
    private String busName;
    
    @Column(name = "from_location_name", nullable = false)
    private String fromLocationName;
    
    @Column(name = "to_location_name", nullable = false)
    private String toLocationName;
    
    @Column(name = "from_latitude")
    private Double fromLatitude;
    
    @Column(name = "from_longitude")
    private Double fromLongitude;
    
    @Column(name = "to_latitude")
    private Double toLatitude;
    
    @Column(name = "to_longitude")
    private Double toLongitude;
    
    @Column(name = "departure_time")
    private String departureTime;
    
    @Column(name = "arrival_time")
    private String arrivalTime;
    
    @Column(name = "schedule_info", length = 1000)
    private String scheduleInfo;
    
    @Column(name = "submission_date", nullable = false)
    private LocalDateTime submissionDate;
    
    @Column(name = "status", nullable = false)
    private String status;
    
    @Column(name = "validation_message")
    private String validationMessage;
    
    @Column(name = "additional_notes", length = 1000)
    private String additionalNotes;
    
    @Column(name = "processed_date")
    private LocalDateTime processedDate;
    
    /**
     * Convert JPA entity to domain model
     */
    public RouteContribution toDomainModel() {
        return RouteContribution.builder()
            .id(this.id != null ? this.id.toString() : null)
            .userId(this.userId)
            .busNumber(this.busNumber)
            .busName(this.busName)
            .fromLocationName(this.fromLocationName)
            .toLocationName(this.toLocationName)
            .fromLatitude(this.fromLatitude)
            .fromLongitude(this.fromLongitude)
            .toLatitude(this.toLatitude)
            .toLongitude(this.toLongitude)
            .departureTime(this.departureTime)
            .arrivalTime(this.arrivalTime)
            .scheduleInfo(this.scheduleInfo)
            .submissionDate(this.submissionDate)
            .status(this.status)
            .validationMessage(this.validationMessage)
            .additionalNotes(this.additionalNotes)
            .processedDate(this.processedDate)
            .build();
    }
    
    /**
     * Create entity from domain model
     */
    public static RouteContributionEntity fromDomainModel(RouteContribution model) {
        return RouteContributionEntity.builder()
            .id(model.getId() != null ? Long.parseLong(model.getId()) : null)
            .userId(model.getUserId())
            .busNumber(model.getBusNumber())
            .busName(model.getBusName())
            .fromLocationName(model.getFromLocationName())
            .toLocationName(model.getToLocationName())
            .fromLatitude(model.getFromLatitude())
            .fromLongitude(model.getFromLongitude())
            .toLatitude(model.getToLatitude())
            .toLongitude(model.getToLongitude())
            .departureTime(model.getDepartureTime())
            .arrivalTime(model.getArrivalTime())
            .scheduleInfo(model.getScheduleInfo())
            .submissionDate(model.getSubmissionDate())
            .status(model.getStatus())
            .validationMessage(model.getValidationMessage())
            .additionalNotes(model.getAdditionalNotes())
            .processedDate(model.getProcessedDate())
            .build();
    }
}