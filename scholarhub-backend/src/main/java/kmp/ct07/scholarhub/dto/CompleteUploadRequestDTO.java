package kmp.ct07.scholarhub.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CompleteUploadRequestDTO {
    private String uploadId;
    private String objectKey;
    private String title;          // Tên file hiển thị trên Web
    private String description;
    private UUID folderId;         // Null nếu lưu ở thư mục gốc
    private List<PartETag> parts;  // Danh sách các mảnh đã upload

    @Data
    public static class PartETag {
        private int partNumber;

        @JsonProperty("eTag")
        private String eTag;
    }
}
