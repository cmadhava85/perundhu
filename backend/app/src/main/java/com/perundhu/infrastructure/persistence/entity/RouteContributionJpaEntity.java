package com.perundhu.infrastructure.persistence.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * JPA entity for route contributions - cleaned up without legacy fields
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

    @NotBlank(message = "User ID must not be blank")
    @Column(name = "user_id")
    private String userId;

    @NotBlank(message = "Bus number must not be blank")
    @Column(name = "bus_number")
    private String busNumber;

    @Column(name = "bus_name")
    private String busName;

    @NotBlank(message = "From location name must not be blank")
    @Column(name = "from_location_name")
    private String fromLocationName;

    @NotBlank(message = "To location name must not be blank")
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

    @Column(name = "departure_time")
    private String departureTime;

    @Column(name = "arrival_time")
    private String arrivalTime;

    @Column(name = "schedule_info")
    private String scheduleInfo;

    @NotBlank(message = "Status must not be blank")
    @Column(name = "status")
    private String status;

    @NotNull(message = "Submission date must not be null")
    @Column(name = "submission_date")
    private LocalDateTime submissionDate;

    @Column(name = "processed_date")
    private LocalDateTime processedDate;

    @Column(name = "additional_notes")
    private String additionalNotes;

    @Column(name = "validation_message")
    private String validationMessage;

    @Column(name = "submitted_by")
    private String submittedBy;

    @Column(name = "source_image_id")
    private String sourceImageId;

    @Column(name = "route_group_id")
    private String routeGroupId;

    @Column(name = "source_bus_id")
    private Long sourceBusId;

    @Column(name = "contribution_type")
    private String contributionType;

    /**
     * Intermediate stops stored as JSON string.
     * Format: [{"name":"STOP1","stopOrder":1},{"name":"STOP2","stopOrder":2}]
     * These are the VIA cities extracted from OCR.
     */
    @Column(name = "stops_json", columnDefinition = "TEXT")
    private String stopsJson;
}
