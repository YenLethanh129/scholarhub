package kmp.ct07.scholarhub.service;

import kmp.ct07.scholarhub.document.MaterialDocument;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface IMaterialSearchService {
    List<MaterialDocument> searchMaterials(
            UUID currentUserId,
            String keyword,
            String fileType,
            Long minSize, Long maxSize,
            LocalDateTime fromDate, LocalDateTime toDate,
            Pageable pageable);
}
