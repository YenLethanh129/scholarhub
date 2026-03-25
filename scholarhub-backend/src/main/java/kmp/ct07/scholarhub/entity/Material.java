package kmp.ct07.scholarhub.entity;

import jakarta.persistence.*;
import kmp.ct07.scholarhub.enums.MaterialStatus;
import kmp.ct07.scholarhub.enums.MaterialType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "materials")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"folder", "owner"})
@EqualsAndHashCode(exclude = {"folder", "owner"})
public class Material {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(name = "minio_object_name", nullable = false)
    private String minioObjectName; // Path vật lý

    @Column(name = "preview_object_name")
    private String previewObjectName; // Chứa key bản sao PDF trên MinIO (nếu có)

    @Column(name = "mongo_metadata_id")
    private String mongoMetadataId; // Link MongoDB

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MaterialType type; // VIDEO, DOCUMENT...

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MaterialStatus status; // PENDING, READY...

    @Column(name = "size_in_bytes")
    private Long size;

    @Column(name = "download_count")
    @Builder.Default
    private Integer downloadCount = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id")
    private Folder folder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
