package kmp.ct07.scholarhub.service.impl;

import kmp.ct07.scholarhub.dto.CompleteUploadRequestDTO;
import kmp.ct07.scholarhub.dto.MaterialUpdateDTO;
import kmp.ct07.scholarhub.dto.StatObject;
import kmp.ct07.scholarhub.entity.Folder;
import kmp.ct07.scholarhub.entity.Material;
import kmp.ct07.scholarhub.entity.User;
import kmp.ct07.scholarhub.entity.mongodb.FileMetadata;
import kmp.ct07.scholarhub.enums.ErrorCode;
import kmp.ct07.scholarhub.enums.MaterialStatus;
import kmp.ct07.scholarhub.enums.MaterialType;
import kmp.ct07.scholarhub.event.DeleteDocumentEvent;
import kmp.ct07.scholarhub.event.IndexDocumentEvent;
import kmp.ct07.scholarhub.event.MaterialUploadedEvent;
import kmp.ct07.scholarhub.exception.AppException;
import kmp.ct07.scholarhub.repository.FolderRepository;
import kmp.ct07.scholarhub.repository.MaterialRepository;
import kmp.ct07.scholarhub.repository.MetadataRepository;
import kmp.ct07.scholarhub.repository.UserRepository;
import kmp.ct07.scholarhub.service.IMaterialService;
import kmp.ct07.scholarhub.service.IStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaterialService implements IMaterialService {

    private final IStorageService storageService;
    private final MaterialRepository materialRepository;
    private final MetadataRepository metadataRepository;
    private final UserRepository userRepository;
    private final FolderRepository folderRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private final ApplicationEventPublisher eventPublisher;

    @Value("${minio.bucket-name}")
    private String bucketName;

    // Bắt lỗi Database để Rollback tự động cho Postgres
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Material processCompleteUpload(UUID userId, UUID secureFolderId, CompleteUploadRequestDTO request) {
        String objectKey = request.getObjectKey();

        String today = getUUIDToDay();
        String preObjectKey = today + "/" + userId;

        storageService.completeMultipartUpload(bucketName, objectKey, request.getUploadId(), request.getParts());

        try {
            // STEP 2: Lấy dung lượng thực tế
            StatObject stat = storageService.getStat(bucketName, objectKey);

            // Lấy thông tin User & Folder
            User owner = userRepository.findById(userId)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            Folder folder = null;
            if (secureFolderId != null) {
                folder = folderRepository.findById(secureFolderId).orElse(null);
            }

            Material material = Material.builder()
                    .title(request.getTitle() != null ? request.getTitle() : "Khong_ten")
                    .description(request.getDescription())
                    .minioObjectName(objectKey)
                    .previewObjectName(isPdf(objectKey) ? objectKey : preObjectKey)
                    .type(determineType(stat.getContentType()))
                    .status(MaterialStatus.PENDING)
                    .size(stat.getSize())
                    .owner(owner)
                    .folder(folder)
                    .build();

            Material savedMaterial = materialRepository.save(material);

            FileMetadata metadata = FileMetadata.builder()
                    .objectKey(objectKey)
                    .materialId(savedMaterial.getId())
                    .sizeInBytes(stat.getSize())
                    .contentType(stat.getContentType())
                    .extension(extractExtension(objectKey))
                    .technicalInfo(new HashMap<>())
                    .extractedTags(new ArrayList<>())
                    .createdAt(LocalDateTime.now())
                    .build();

            metadata = metadataRepository.save(metadata);
            savedMaterial.setMongoMetadataId(metadata.getId());
            savedMaterial = materialRepository.save(savedMaterial);

            eventPublisher.publishEvent(new IndexDocumentEvent(
                    savedMaterial.getId(),
                    savedMaterial.getTitle(),
                    savedMaterial.getDescription() != null ? savedMaterial.getDescription() : "",
                    java.util.Collections.emptyList(),
                    savedMaterial.getType() != null ? savedMaterial.getType().name() : null,
                    savedMaterial.getSize(),
                    savedMaterial.getCreatedAt(),
                    savedMaterial.getFolder() != null ? savedMaterial.getFolder().getId() : null,
                    savedMaterial.getOwner() != null ? savedMaterial.getOwner().getId() : null
            ));

            eventPublisher.publishEvent(new MaterialUploadedEvent(
                    savedMaterial.getId(),
                    savedMaterial.getMinioObjectName(),
                    stat.getContentType()
            ));

            return savedMaterial;

        } catch (Exception e) {
            storageService.deleteObject(bucketName, objectKey);
            throw new AppException(ErrorCode.UPLOAD_FAILED);
        }
    }

    @Override
    public String getDownloadUrl(UUID materialId, UUID currentUserId) {
        // 1. Truy vấn Postgres để tìm học liệu
        Material material = materialRepository.findById(materialId)
                .orElseThrow(() -> new AppException(ErrorCode.FILE_NOT_FOUND));

        // 3. Trích xuất tọa độ file vật lý
        String objectKey = material.getMinioObjectName();
        if (objectKey == null || objectKey.isBlank()) {
            throw new AppException(ErrorCode.FILE_NOT_FOUND);
        }

        return storageService.generateUrl(bucketName, objectKey, 60, true);
    }

    @Override
    @Transactional
    public Material updateMaterialFolder(UUID materialId, UUID newFolderId, UUID currentUserId) {
        Material material = materialRepository.findById(materialId)
                .orElseThrow(() -> new AppException(ErrorCode.FILE_NOT_FOUND));

        if (!material.getOwner().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        Folder newFolder = null;
        if (newFolderId != null) {
            newFolder = folderRepository.findById(newFolderId)
                    .orElseThrow(() -> new AppException(ErrorCode.FOLDER_NOT_FOUND));

            if (!newFolder.getUser().getId().equals(currentUserId)) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
        }

        material.setFolder(newFolder);

        return materialRepository.save(material);
    }

    @Override
    public Material getMaterialDetails(UUID materialId) {
        Material material = materialRepository.findById(materialId)
                .orElseThrow(() -> new AppException(ErrorCode.FILE_NOT_FOUND));

//        if (!material.getOwner().getId().equals(currentUserId)) {
//            throw new AppException(ErrorCode.UNAUTHORIZED);
//        }

        return material;
    }

    @Override
    public List<Material> getAllMaterialsByUserId(UUID currentUserId) {
        return materialRepository.findByOwnerId(currentUserId);
    }

    @Override
    public void increaseDownloadCount(UUID materialId) {
        Material material = materialRepository.findById(materialId)
                .orElseThrow(() -> new AppException(ErrorCode.FILE_NOT_FOUND));

        material.setDownloadCount(material.getDownloadCount() + 1);
        materialRepository.save(material);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Material updateMaterial(UUID materialId, MaterialUpdateDTO materialUpdateDTO, UUID currentUserId) {
        Material material = materialRepository.findById(materialId)
                .orElseThrow(() -> new AppException(ErrorCode.FILE_NOT_FOUND));

        if (!material.getOwner().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (materialUpdateDTO.getTitle() != null) {
            material.setTitle(materialUpdateDTO.getTitle());
        }
        if (materialUpdateDTO.getDescription() != null) {
            material.setDescription(materialUpdateDTO.getDescription());
        }

        material = materialRepository.save(material);

        eventPublisher.publishEvent(new IndexDocumentEvent(
                material.getId(),
                material.getTitle(),
                material.getDescription() != null ? material.getDescription() : "",
                java.util.Collections.emptyList(),
                material.getType() != null ? material.getType().name() : null,
                material.getSize(),
                material.getCreatedAt(),
                material.getFolder() != null ? material.getFolder().getId() : null,
                material.getOwner() != null ? material.getOwner().getId() : null
        ));

        return material;
    }

    @Override
    public String getViewUrl(UUID materialId) {
        Material material = materialRepository.findById(materialId)
                .orElseThrow(() -> new AppException(ErrorCode.FILE_NOT_FOUND));

        String objectKey = material.getMinioObjectName();
        String objectPreviewKey = material.getPreviewObjectName();
        if (objectPreviewKey != null && !objectPreviewKey.isBlank()) {
            return storageService.generateUrl(bucketName, objectPreviewKey, 120, false);
        }
        if (objectKey == null || objectKey.isBlank()) {
            throw new AppException(ErrorCode.FILE_NOT_FOUND);
        }

        return storageService.generateUrl(bucketName, objectKey, 120, false);
    }

    @Override
    public void deleteMaterialsInFolder(UUID folderId) {
        materialRepository.findByFolderId(folderId)
                .forEach(this::delete);
    }

    @Override
    @Transactional
    public void deleteMaterial(UUID materialId, UUID currentUserId) {
        Material material = materialRepository.findById(materialId)
                .orElseThrow(() -> new AppException(ErrorCode.FILE_NOT_FOUND));

        if (!material.getOwner().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        delete(material);
    }

    private void delete(Material material) {
        storageService.deleteObject(bucketName, material.getMinioObjectName());
        if (material.getPreviewObjectName() != null && !material.getPreviewObjectName().isBlank()) {
            storageService.deleteObject(bucketName, material.getPreviewObjectName());
        }

        eventPublisher.publishEvent(new DeleteDocumentEvent(material.getId()));

        materialRepository.delete(material);
    }

    // Hàm phụ: Suy ra Type từ ContentType
    private MaterialType determineType(String contentType) {
        if (contentType == null) return MaterialType.DOCUMENT;
        if (contentType.startsWith("video/")) return MaterialType.VIDEO;
        if (contentType.startsWith("audio/")) return MaterialType.AUDIO;
        if (contentType.startsWith("image/")) return MaterialType.IMAGE;
        return MaterialType.DOCUMENT;
    }

    private boolean isPdf(String objectKey) {
        return "pdf".equals(extractExtension(objectKey));
    }

    private String extractExtension(String objectKey) {
        if (objectKey == null || !objectKey.contains(".")) {
            return "";
        }
        return objectKey.substring(objectKey.lastIndexOf(".") + 1).toLowerCase();
    }

    private String getUUIDToDay() {
        Calendar calendar = Calendar.getInstance();
        int year = calendar.get(Calendar.YEAR);
        int month = calendar.get(Calendar.MONTH) + 1; // Tháng bắt đầu từ 0
        int day = calendar.get(Calendar.DAY_OF_MONTH);
        return String.format("%04d%02d%02d", year, month, day);
    }
}