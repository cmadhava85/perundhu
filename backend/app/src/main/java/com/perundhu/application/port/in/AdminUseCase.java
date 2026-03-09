package com.perundhu.application.port.in;

import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.model.ImageContribution;

import java.util.List;

/**
 * Interface for admin operations
 */
public interface AdminUseCase {

  /**
   * Get all route contributions
   * 
   * @return List of all route contributions
   */
  List<RouteContribution> getAllRouteContributions();

  /**
   * Get all route contributions with pagination
   *
   * @param page zero-based page index
   * @param size page size
   * @return Paginated list of route contributions
   */
  List<RouteContribution> getAllRouteContributionsPaged(int page, int size);

  /**
   * Count all route contributions
   *
   * @return Total count of route contributions
   */
  long countAllRouteContributions();

  /**
   * Get pending route contributions
   * 
   * @return List of pending route contributions
   */
  List<RouteContribution> getPendingRouteContributions();

  /**
   * Approve a route contribution
   * 
   * @param id The ID of the contribution to approve
   * @return The approved route contribution
   */
  RouteContribution approveRouteContribution(String id);

  /**
   * Reject a route contribution
   * 
   * @param id     The ID of the contribution to reject
   * @param reason The rejection reason
   * @return The rejected route contribution
   */
  RouteContribution rejectRouteContribution(String id, String reason);

  /**
   * Delete a route contribution
   * 
   * @param id The ID of the contribution to delete
   */
  void deleteRouteContribution(String id);

  /**
   * Get all image contributions
   * 
   * @return List of all image contributions
   */
  List<ImageContribution> getAllImageContributions();

  /**
   * Get pending image contributions
   * 
   * @return List of pending image contributions
   */
  List<ImageContribution> getPendingImageContributions();
  
  /**
   * Get pending image contributions with pagination
   * 
   * @param page Page number (0-indexed)
   * @param size Page size
   * @return Paginated list of pending image contributions
   */
  List<ImageContribution> getPendingImageContributionsPaged(int page, int size);
  
  /**
   * Get all image contributions with pagination
   * 
   * @param page Page number (0-indexed)
   * @param size Page size
   * @return Paginated list of all image contributions
   */
  List<ImageContribution> getImageContributionsPaged(int page, int size);
  
  /**
   * Count pending image contributions
   * 
   * @return Total count of pending image contributions
   */
  long countPendingImageContributions();
  
  /**
   * Count all image contributions
   * 
   * @return Total count of all image contributions
   */
  long countAllImageContributions();

  /**
   * Approve an image contribution
   * 
   * @param id The ID of the contribution to approve
   * @return The approved image contribution
   */
  ImageContribution approveImageContribution(String id);

  /**
   * Reject an image contribution
   * 
   * @param id     The ID of the contribution to reject
   * @param reason The rejection reason
   * @return The rejected image contribution
   */
  ImageContribution rejectImageContribution(String id, String reason);

  /**
   * Delete an image contribution
   * 
   * @param id The ID of the contribution to delete
   */
  void deleteImageContribution(String id);
}