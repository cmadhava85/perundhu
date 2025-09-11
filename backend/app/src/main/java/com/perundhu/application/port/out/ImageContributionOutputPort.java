package com.perundhu.application.port.out;

import com.perundhu.domain.model.ImageContribution;
import java.util.List;
import java.util.Optional;

public interface ImageContributionOutputPort {
    ImageContribution save(ImageContribution imageContribution);

    Optional<ImageContribution> findById(String id);

    List<ImageContribution> findAll();

    List<ImageContribution> findByStatus(String status);

    void deleteById(String id);

    // Count methods needed by services
    long count();

    long countByStatus(String status);

    // Pagination support
    List<ImageContribution> findAll(int page, int size);

    List<ImageContribution> findByStatus(String status, int page, int size);
}