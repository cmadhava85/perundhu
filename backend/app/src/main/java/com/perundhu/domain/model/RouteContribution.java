package com.perundhu.domain.model;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Route Contribution domain model - Java 17 compatible class version
 * Updated to work with existing validation and persistence infrastructure
 */
public class RouteContribution {
    private String id;
    private String userId;
    private String busName;
    private String busNumber;
    private String fromLocationName;
    private String fromLocationTranslatedName; // Translation in user's preferred language
    private String fromLocationTaName; // Tamil name for the from location
    private String toLocationName;
    private String toLocationTranslatedName; // Translation in user's preferred language
    private String toLocationTaName; // Tamil name for the to location
    private Double fromLatitude;
    private Double fromLongitude;
    private Double toLatitude;
    private Double toLongitude;
    private String departureTime;
    private String arrivalTime;
    private String scheduleInfo;
    private String status;
    private LocalDateTime submissionDate;
    private LocalDateTime processedDate;
    private String additionalNotes;
    private String validationMessage;
    private String submittedBy;
    private List<StopContribution> stops;

    // Fields for tracking OCR-extracted schedules
    private String sourceImageId; // ID of the image contribution this came from
    private String routeGroupId; // Groups related schedules (e.g., same route, different times)
    
    // Field for tracking stop contributions to existing routes
    private Long sourceBusId; // ID of the existing bus this stop contribution is for
    private String contributionType; // "NEW_ROUTE" or "ADD_STOPS"

    // Default constructor
    public RouteContribution() {
        this.status = "PENDING";
        this.submissionDate = LocalDateTime.now();
    }

    // Builder pattern for easy construction
    public static RouteContributionBuilder builder() {
        return new RouteContributionBuilder();
    }

    // Copy constructor for toBuilder() method
    public RouteContributionBuilder toBuilder() {
        return new RouteContributionBuilder()
                .id(this.id)
                .userId(this.userId)
                .busName(this.busName)
                .busNumber(this.busNumber)
                .fromLocationName(this.fromLocationName)
                .fromLocationTranslatedName(this.fromLocationTranslatedName)
                .fromLocationTaName(this.fromLocationTaName)
                .toLocationName(this.toLocationName)
                .toLocationTranslatedName(this.toLocationTranslatedName)
                .toLocationTaName(this.toLocationTaName)
                .fromLatitude(this.fromLatitude)
                .fromLongitude(this.fromLongitude)
                .toLatitude(this.toLatitude)
                .toLongitude(this.toLongitude)
                .departureTime(this.departureTime)
                .arrivalTime(this.arrivalTime)
                .scheduleInfo(this.scheduleInfo)
                .status(this.status)
                .submissionDate(this.submissionDate)
                .processedDate(this.processedDate)
                .additionalNotes(this.additionalNotes)
                .validationMessage(this.validationMessage)
                .submittedBy(this.submittedBy)
                .stops(this.stops)
                .sourceImageId(this.sourceImageId)
                .routeGroupId(this.routeGroupId)
                .sourceBusId(this.sourceBusId)
                .contributionType(this.contributionType);
    }

    // Getters and setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getBusName() {
        return busName;
    }

    public void setBusName(String busName) {
        this.busName = busName;
    }

    public String getBusNumber() {
        return busNumber;
    }

    public void setBusNumber(String busNumber) {
        this.busNumber = busNumber;
    }

    public String getFromLocationName() {
        return fromLocationName;
    }

    public void setFromLocationName(String fromLocationName) {
        this.fromLocationName = fromLocationName;
    }

    public String getFromLocationTranslatedName() {
        return fromLocationTranslatedName;
    }

    public void setFromLocationTranslatedName(String fromLocationTranslatedName) {
        this.fromLocationTranslatedName = fromLocationTranslatedName;
    }

    public String getFromLocationTaName() {
        return fromLocationTaName;
    }

    public void setFromLocationTaName(String fromLocationTaName) {
        this.fromLocationTaName = fromLocationTaName;
    }

    public String getToLocationName() {
        return toLocationName;
    }

    public void setToLocationName(String toLocationName) {
        this.toLocationName = toLocationName;
    }

    public String getToLocationTranslatedName() {
        return toLocationTranslatedName;
    }

    public void setToLocationTranslatedName(String toLocationTranslatedName) {
        this.toLocationTranslatedName = toLocationTranslatedName;
    }

    public String getToLocationTaName() {
        return toLocationTaName;
    }

    public void setToLocationTaName(String toLocationTaName) {
        this.toLocationTaName = toLocationTaName;
    }

    public Double getFromLatitude() {
        return fromLatitude;
    }

    public void setFromLatitude(Double fromLatitude) {
        this.fromLatitude = fromLatitude;
    }

    public Double getFromLongitude() {
        return fromLongitude;
    }

    public void setFromLongitude(Double fromLongitude) {
        this.fromLongitude = fromLongitude;
    }

    public Double getToLatitude() {
        return toLatitude;
    }

    public void setToLatitude(Double toLatitude) {
        this.toLatitude = toLatitude;
    }

    public Double getToLongitude() {
        return toLongitude;
    }

    public void setToLongitude(Double toLongitude) {
        this.toLongitude = toLongitude;
    }

    public String getDepartureTime() {
        return departureTime;
    }

    public void setDepartureTime(String departureTime) {
        this.departureTime = departureTime;
    }

    public String getArrivalTime() {
        return arrivalTime;
    }

    public void setArrivalTime(String arrivalTime) {
        this.arrivalTime = arrivalTime;
    }

    public String getScheduleInfo() {
        return scheduleInfo;
    }

    public void setScheduleInfo(String scheduleInfo) {
        this.scheduleInfo = scheduleInfo;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getSubmissionDate() {
        return submissionDate;
    }

    public void setSubmissionDate(LocalDateTime submissionDate) {
        this.submissionDate = submissionDate;
    }

    public LocalDateTime getProcessedDate() {
        return processedDate;
    }

    public void setProcessedDate(LocalDateTime processedDate) {
        this.processedDate = processedDate;
    }

    public String getAdditionalNotes() {
        return additionalNotes;
    }

    public void setAdditionalNotes(String additionalNotes) {
        this.additionalNotes = additionalNotes;
    }

    public String getValidationMessage() {
        return validationMessage;
    }

    public void setValidationMessage(String validationMessage) {
        this.validationMessage = validationMessage;
    }

    public String getSubmittedBy() {
        return submittedBy;
    }

    public void setSubmittedBy(String submittedBy) {
        this.submittedBy = submittedBy;
    }

    public List<StopContribution> getStops() {
        return stops;
    }

    public void setStops(List<StopContribution> stops) {
        this.stops = stops;
    }

    public String getSourceImageId() {
        return sourceImageId;
    }

    public void setSourceImageId(String sourceImageId) {
        this.sourceImageId = sourceImageId;
    }

    public String getRouteGroupId() {
        return routeGroupId;
    }

    public void setRouteGroupId(String routeGroupId) {
        this.routeGroupId = routeGroupId;
    }

    public Long getSourceBusId() {
        return sourceBusId;
    }

    public void setSourceBusId(Long sourceBusId) {
        this.sourceBusId = sourceBusId;
    }

    public String getContributionType() {
        return contributionType;
    }

    public void setContributionType(String contributionType) {
        this.contributionType = contributionType;
    }

    // Builder class
    public static class RouteContributionBuilder {
        private final RouteContribution contribution = new RouteContribution();

        public RouteContributionBuilder id(String id) {
            contribution.setId(id);
            return this;
        }

        public RouteContributionBuilder userId(String userId) {
            contribution.setUserId(userId);
            return this;
        }

        public RouteContributionBuilder busName(String busName) {
            contribution.setBusName(busName);
            return this;
        }

        public RouteContributionBuilder busNumber(String busNumber) {
            contribution.setBusNumber(busNumber);
            return this;
        }

        public RouteContributionBuilder fromLocationName(String fromLocationName) {
            contribution.setFromLocationName(fromLocationName);
            return this;
        }

        public RouteContributionBuilder fromLocationTranslatedName(String fromLocationTranslatedName) {
            contribution.setFromLocationTranslatedName(fromLocationTranslatedName);
            return this;
        }

        public RouteContributionBuilder fromLocationTaName(String fromLocationTaName) {
            contribution.setFromLocationTaName(fromLocationTaName);
            return this;
        }

        public RouteContributionBuilder toLocationName(String toLocationName) {
            contribution.setToLocationName(toLocationName);
            return this;
        }

        public RouteContributionBuilder toLocationTranslatedName(String toLocationTranslatedName) {
            contribution.setToLocationTranslatedName(toLocationTranslatedName);
            return this;
        }

        public RouteContributionBuilder toLocationTaName(String toLocationTaName) {
            contribution.setToLocationTaName(toLocationTaName);
            return this;
        }

        public RouteContributionBuilder fromLatitude(Double fromLatitude) {
            contribution.setFromLatitude(fromLatitude);
            return this;
        }

        public RouteContributionBuilder fromLongitude(Double fromLongitude) {
            contribution.setFromLongitude(fromLongitude);
            return this;
        }

        public RouteContributionBuilder toLatitude(Double toLatitude) {
            contribution.setToLatitude(toLatitude);
            return this;
        }

        public RouteContributionBuilder toLongitude(Double toLongitude) {
            contribution.setToLongitude(toLongitude);
            return this;
        }

        public RouteContributionBuilder departureTime(String departureTime) {
            contribution.setDepartureTime(departureTime);
            return this;
        }

        public RouteContributionBuilder arrivalTime(String arrivalTime) {
            contribution.setArrivalTime(arrivalTime);
            return this;
        }

        public RouteContributionBuilder scheduleInfo(String scheduleInfo) {
            contribution.setScheduleInfo(scheduleInfo);
            return this;
        }

        public RouteContributionBuilder status(String status) {
            contribution.setStatus(status);
            return this;
        }

        public RouteContributionBuilder submissionDate(LocalDateTime submissionDate) {
            contribution.setSubmissionDate(submissionDate);
            return this;
        }

        public RouteContributionBuilder processedDate(LocalDateTime processedDate) {
            contribution.setProcessedDate(processedDate);
            return this;
        }

        public RouteContributionBuilder additionalNotes(String additionalNotes) {
            contribution.setAdditionalNotes(additionalNotes);
            return this;
        }

        public RouteContributionBuilder validationMessage(String validationMessage) {
            contribution.setValidationMessage(validationMessage);
            return this;
        }

        public RouteContributionBuilder submittedBy(String submittedBy) {
            contribution.setSubmittedBy(submittedBy);
            return this;
        }

        public RouteContributionBuilder stops(List<StopContribution> stops) {
            contribution.setStops(stops);
            return this;
        }

        public RouteContributionBuilder sourceImageId(String sourceImageId) {
            contribution.setSourceImageId(sourceImageId);
            return this;
        }

        public RouteContributionBuilder routeGroupId(String routeGroupId) {
            contribution.setRouteGroupId(routeGroupId);
            return this;
        }

        public RouteContributionBuilder sourceBusId(Long sourceBusId) {
            contribution.setSourceBusId(sourceBusId);
            return this;
        }

        public RouteContributionBuilder contributionType(String contributionType) {
            contribution.setContributionType(contributionType);
            return this;
        }

        public RouteContribution build() {
            return contribution;
        }
    }
}