package kmp.ct07.scholarhub.response;

import kmp.ct07.scholarhub.entity.Material;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class MaterialResponse {
    private UUID id;
    private String title;
    private String description;
    private String minioObjectName;
    private String previewObjectName;
    private String mongoMetadataId;
    private String type;
    private String status;
    private Long size;
    private Integer downloadCount;
    private OwnerDTO owner;
    private FolderDTO folder;
    private LocalDateTime createdAt;

    @Data
    @Builder
    public static class OwnerDTO {
        private UUID id;
        private String username;
        private String fullName;
        private String email;
    }

    @Data
    @Builder
    public static class FolderDTO {
        private UUID id;
        private String folderName;
    }

    // Hàm tiện ích để chuyển đổi từ Entity sang DTO
    public static MaterialResponse fromEntity(Material material) {
        if (material == null) return null;

        OwnerDTO ownerDTO = null;
        if (material.getOwner() != null) {
            ownerDTO = OwnerDTO.builder()
                    .id(material.getOwner().getId())
                    .username(material.getOwner().getUsername())
                    .fullName(material.getOwner().getFullName())
                    .email(material.getOwner().getEmail())
                    .build();
        }

        FolderDTO folderDTO = null;
        if (material.getFolder() != null) {
            folderDTO = FolderDTO.builder()
                    .id(material.getFolder().getId())
                    .folderName(material.getFolder().getName())
                    .build();
        }

        return MaterialResponse.builder()
                .id(material.getId())
                .title(material.getTitle())
                .description(material.getDescription())
                .minioObjectName(material.getMinioObjectName())
                .previewObjectName(material.getPreviewObjectName())
                .mongoMetadataId(material.getMongoMetadataId())
                .downloadCount(material.getDownloadCount())
                .type(material.getType() != null ? material.getType().name() : null)
                .status(material.getStatus() != null ? material.getStatus().name() : null)
                .size(material.getSize())
                .owner(ownerDTO)
                .folder(folderDTO)
                .createdAt(material.getCreatedAt())
                .build();
    }
}