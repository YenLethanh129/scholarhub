package kmp.ct07.scholarhub.worker;

import kmp.ct07.scholarhub.entity.Material;
import kmp.ct07.scholarhub.entity.mongodb.FileMetadata;
import kmp.ct07.scholarhub.enums.ErrorCode;
import kmp.ct07.scholarhub.event.MaterialUploadedEvent;
import kmp.ct07.scholarhub.exception.AppException;
import kmp.ct07.scholarhub.repository.MaterialRepository;
import kmp.ct07.scholarhub.repository.MetadataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import software.amazon.awssdk.core.sync.ResponseTransformer;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import ws.schild.jave.MultimediaObject;
import ws.schild.jave.info.MultimediaInfo;

import java.io.File;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class MetadataExtractionWorker {

    private final S3Client s3Client;
    private final MetadataRepository mongoRepo;
    private final MaterialRepository postgresRepo;

    @Value("${minio.bucket-name}")
    private String bucketName;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleMaterialUploaded(MaterialUploadedEvent event) {
        log.info("[WORKER] Đang xử lý hậu kỳ cho Material ID: {}", event.materialId());

        File tempFile = null;
        try {
            Material material = postgresRepo.findById(event.materialId())
                    .orElseThrow(() -> new AppException(ErrorCode.MATERIAL_NOT_FOUND));

            String extension = "." + getExtension(event.objectKey());
            tempFile = File.createTempFile("scholarhub_worker_", extension);

            log.info("Đang stream file từ MinIO xuống đĩa cứng tạm: {}", tempFile.getAbsolutePath());
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(event.objectKey())
                    .build();
            s3Client.getObject(getObjectRequest, ResponseTransformer.toFile(tempFile));

            log.info("Kích thước file tạm đã tải về: {} bytes", tempFile.length());
            Map<String, Object> metadata = new HashMap<>();
            String lowerKey = event.objectKey().toLowerCase();
            if (lowerKey.endsWith(".pdf")) {
                metadata = extractPdfMetadata(tempFile);
                metadata.put("category", "pdf");
                metadata.put("is_previewable", true);
            }
            else if (lowerKey.endsWith(".mp4") || lowerKey.endsWith(".mov") || lowerKey.endsWith(".avi") || lowerKey.endsWith(".mp3") || lowerKey.endsWith(".wav")) {
                metadata = extractVideoMetadata(tempFile); // (Hàm này lấy được cả duration của mp3)
                metadata.put("category", "media");
                metadata.put("is_previewable", false);
            }
            else if (lowerKey.endsWith(".jpg") || lowerKey.endsWith(".jpeg") || lowerKey.endsWith(".png") || lowerKey.endsWith(".gif")) {
                metadata = extractImageMetadata(tempFile);
                metadata.put("category", "image");
                metadata.put("is_previewable", true);
            }
            else if (lowerKey.endsWith(".doc") || lowerKey.endsWith(".docx") || lowerKey.endsWith(".xls") || lowerKey.endsWith(".xlsx") || lowerKey.endsWith(".ppt") || lowerKey.endsWith(".pptx")) {
                metadata.put("category", "microsoft_office");
                metadata.put("is_previewable", false); // Báo cho Frontend biết file này phải tải về mới xem được
            }
            else {
                metadata.put("category", "unknown");
                log.info("Định dạng file {} chỉ lưu metadata cơ bản.", lowerKey);
            }

            long fileSize = tempFile.length();
            FileMetadata mongoDoc = mongoRepo.findByMaterialId(event.materialId())
                    .or(() -> mongoRepo.findByObjectKey(event.objectKey()))
                    .orElseGet(() -> FileMetadata.builder()
                            .materialId(event.materialId())
                            .objectKey(event.objectKey())
                            .createdAt(java.time.LocalDateTime.now())
                            .extractedTags(java.util.Collections.emptyList())
                            .build());

            mongoDoc.setMaterialId(event.materialId());
            mongoDoc.setObjectKey(event.objectKey());
            mongoDoc.setSizeInBytes(fileSize);
            mongoDoc.setContentType(event.contentType());
            mongoDoc.setExtension(getExtension(lowerKey));
            mongoDoc.setTechnicalInfo(metadata);
            if (mongoDoc.getExtractedTags() == null) {
                mongoDoc.setExtractedTags(java.util.Collections.emptyList());
            }

            mongoDoc = mongoRepo.save(mongoDoc);
            if (material.getMongoMetadataId() == null || material.getMongoMetadataId().isBlank()) {
                material.setMongoMetadataId(mongoDoc.getId());
                postgresRepo.save(material);
            }

            log.info("Đã cập nhật FileMetadata vào MongoDB thành công. ID: {}", mongoDoc.getId());


        } catch (Exception e) {
            log.error("[WORKER] Lỗi khi xử lý Material {}: ", event.materialId(), e);
        } finally {
            // 5. CLEANUP CHÍ MẠNG (Chống tràn ổ cứng)
            if (tempFile != null && tempFile.exists()) {
                try {
                    Files.delete(tempFile.toPath());
                    log.info("Đã dọn dẹp file tạm thành công.");
                } catch (Exception e) {
                    log.error("Không thể xóa file tạm: {}", tempFile.getAbsolutePath(), e);
                }
            }
        }
    }



    private Map<String, Object> extractPdfMetadata(File file) throws Exception {
        Map<String, Object> data = new HashMap<>();
        // Sử dụng PDFBox đọc file
        try (PDDocument document = PDDocument.load(file)) {
            data.put("pages", document.getNumberOfPages());
            data.put("encrypted", document.isEncrypted());
        }
        return data;
    }

    private Map<String, Object> extractVideoMetadata(File file) throws Exception {
        Map<String, Object> data = new HashMap<>();
        MultimediaObject multimediaObject = new MultimediaObject(file);
        MultimediaInfo info = multimediaObject.getInfo();

        if (info != null) {
            data.put("duration_ms", info.getDuration());

            if (info.getVideo() != null) {
                data.put("width", info.getVideo().getSize().getWidth());
                data.put("height", info.getVideo().getSize().getHeight());
                data.put("codec", info.getVideo().getDecoder());
                data.put("fps", info.getVideo().getFrameRate());
            }
        }
        return data;
    }

    private Map<String, Object> extractImageMetadata(File file) {
        Map<String, Object> data = new HashMap<>();
        try {
            java.awt.image.BufferedImage bimg = javax.imageio.ImageIO.read(file);
            if (bimg != null) {
                data.put("width", bimg.getWidth());
                data.put("height", bimg.getHeight());
            }
        } catch (Exception e) {
            log.warn("⚠️ Không thể đọc kích thước ảnh: {}", e.getMessage());
        }
        return data;
    }

    private String getExtension(String objectKey) {
        if (objectKey == null || !objectKey.contains(".")) {
            return "bin";
        }
        return objectKey.substring(objectKey.lastIndexOf(".") + 1).toLowerCase();
    }
}