package kmp.ct07.scholarhub.worker;

import kmp.ct07.scholarhub.entity.Material;
import kmp.ct07.scholarhub.event.MaterialUploadedEvent;
import kmp.ct07.scholarhub.enums.MaterialStatus;
import kmp.ct07.scholarhub.repository.MaterialRepository;
import kmp.ct07.scholarhub.service.IDocumentConverterService;
import kmp.ct07.scholarhub.service.IStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.io.InputStream;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class MaterialProcessingListener {
    private final IStorageService storageService; // Service gọi MinIO của bạn
    private final IDocumentConverterService documentConverterService;
    private final MaterialRepository materialRepository;

    @Value("${minio.bucket-name}")
    private String bucketName;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleMaterialUploadedEvent(MaterialUploadedEvent event) {
        try {
            Material material = materialRepository.findById(event.materialId()).orElse(null);
            if (material == null) {
                log.warn("Bo qua xu ly preview vi khong tim thay Material sau commit. materialId={}", event.materialId());
                return;
            }

            String extension = getExtension(event.objectKey());

            if (extension.matches("(doc|docx|xls|xlsx|ppt|pptx)")) {
                log.info("👉 Phát hiện file Office, chuyển sang Gotenberg...");
                processOfficeDocument(material, extension);
            }
            else {
                material.setPreviewObjectName(material.getMinioObjectName());
                material.setStatus(MaterialStatus.READY);
            }

            materialRepository.save(material);
            log.info("✅ Xử lý file hoàn tất, Status -> READY");

        } catch (Exception e) {
            log.error("❌ Lỗi khi xử lý ngầm file {}: {}", event.objectKey(), e.getMessage());
            materialRepository.findById(event.materialId()).ifPresent(material -> {
                material.setStatus(MaterialStatus.ERROR);
                materialRepository.save(material);
            });
        }
    }

    private void processOfficeDocument(Material material, String extension) throws Exception {
        InputStream originalInputStream = storageService.getObject(bucketName, material.getMinioObjectName());
        byte[] originalBytes = originalInputStream.readAllBytes();

        // B. Gửi sang Gotenberg lấy PDF
        String fakeFilename = "temp_file." + extension;
        byte[] pdfBytes = documentConverterService.convertOfficeToPdf(originalBytes, fakeFilename);

        // C. Sinh tên file mới cho bản PDF và đẩy ngược lên MinIO
        String previewObjectKey;
        if (material.getPreviewObjectName() == null) {
            previewObjectKey = "preview_" + UUID.randomUUID() + ".pdf";
        } else {
            previewObjectKey = material.getPreviewObjectName() + "/preview_" + UUID.randomUUID() + ".pdf";
        }
        java.io.ByteArrayInputStream pdfInputStream = new java.io.ByteArrayInputStream(pdfBytes);
        storageService.uploadFile(bucketName, previewObjectKey, pdfInputStream, pdfBytes.length, "application/pdf");

        // D. Cập nhật Entity
        material.setPreviewObjectName(previewObjectKey);
        material.setStatus(MaterialStatus.READY); // Chuyển sang READY

        materialRepository.save(material);
    }

    private String getExtension(String filename) {
        if (filename.contains(".")) {
            return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        }
        return "";
    }
}
