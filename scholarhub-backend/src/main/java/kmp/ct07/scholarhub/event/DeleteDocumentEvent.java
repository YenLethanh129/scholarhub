package kmp.ct07.scholarhub.event;

import java.util.UUID;

public record DeleteDocumentEvent(
        UUID materialId
) {
}
