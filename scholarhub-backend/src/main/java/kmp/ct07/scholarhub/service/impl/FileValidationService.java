package kmp.ct07.scholarhub.service.impl;

import kmp.ct07.scholarhub.enums.MaterialType;
import kmp.ct07.scholarhub.service.IFileValidationService;
import kmp.ct07.scholarhub.utils.FileValidator;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;

@Service
public class FileValidationService implements IFileValidationService {

    private static final Set<String> DOCUMENT_EXTENSIONS = Set.of(
            // Microsoft Office
            "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
            // image
            "jpg", "jpeg", "png", "gif", "bmp", "tiff"
    );

    private static final Set<String> VIDEO_EXTENSIONS = Set.of(
            "mp4", "avi", "mkv", "mov"
    );

    private static final Map<MaterialType, Set<String>> EXTENSIONS_BY_TYPE = Map.of(
            MaterialType.DOCUMENT, DOCUMENT_EXTENSIONS,
            MaterialType.VIDEO, VIDEO_EXTENSIONS
    );

    @Override
    public void validate(String fileName, long fileSize, String contentType) {
        FileValidator.validateFileSize(fileSize);

        MaterialType materialType = determineType(contentType);
        Set<String> allowedExtensions = EXTENSIONS_BY_TYPE.get(materialType);

        if (allowedExtensions == null) {
            throw new IllegalArgumentException("Loại file chưa được hỗ trợ: " + materialType);
        }

        FileValidator.validateExtension(fileName, allowedExtensions, materialType.name());
    }

    private MaterialType determineType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return MaterialType.DOCUMENT;
        }
        if (contentType.startsWith("video/")) {
            return MaterialType.VIDEO;
        }
        return MaterialType.DOCUMENT;
    }
}

