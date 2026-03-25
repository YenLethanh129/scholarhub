package kmp.ct07.scholarhub.event;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record IndexDocumentEvent(
        UUID materialId,
        String title,
        String metadata,
        List<String> tags,
        String type,
        Long size,
        LocalDateTime createdAt,
        UUID folderId,
        UUID ownerId
) {
}
