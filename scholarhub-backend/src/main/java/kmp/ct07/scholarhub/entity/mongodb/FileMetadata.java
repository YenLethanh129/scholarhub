package kmp.ct07.scholarhub.entity.mongodb;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Document(collection = "file_metadata")
@Data
@Builder
@NoArgsConstructor // BẮT BUỘC: Spring Data Mongo cần cái này để khởi tạo object từ DB
@AllArgsConstructor // BẮT BUỘC: Đi kèm với @Builder
public class FileMetadata {

    @Id
    private String id;

    // Liên kết với PostgreSQL (Bảng Materials) hoặc tên file trên MinIO
    @Field("object_key")
    private String objectKey;

    @Field("material_id")
    private java.util.UUID materialId;

    // --- THÔNG TIN CƠ BẢN ---
    @Field("size_in_bytes")
    private long sizeInBytes;

    @Field("content_type")
    private String contentType;

    private String extension; // Cực kỳ quan trọng để Filter nhanh (VD: .mp4, .pdf)

    // --- VŨ KHÍ CỦA MONGODB (DYNAMIC DATA) ---

    /**
     * Chứa các thông tin trích xuất tùy biến theo loại file.
     * Ví dụ Video: {"duration": 120, "resolution": "1080p", "fps": 60}
     * Ví dụ PDF: {"page_count": 50, "author": "Nguyen Van A"}
     */
    @Field("technical_info")
    private Map<String, Object> technicalInfo;

    /**
     * Dùng để phục vụ tính năng Tìm Kiếm (Elasticsearch) sau này.
     * Ví dụ: ["java", "spring-boot", "backend"]
     */
    @Field("extracted_tags")
    private List<String> extractedTags;

    @Field("created_at")
    private LocalDateTime createdAt;
}