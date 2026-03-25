package kmp.ct07.scholarhub.event;

import java.util.UUID;

public record MaterialUploadedEvent(
        UUID materialId,
        String objectKey,
        String contentType
) {}
