package kmp.ct07.scholarhub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FolderRequestDTO {
    private String folderId;
    private String folderName;
    private String newFolderName; // Dùng cho rename
    private UUID parentFolderId;
}
