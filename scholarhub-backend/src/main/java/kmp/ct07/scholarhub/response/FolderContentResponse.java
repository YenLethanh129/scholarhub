package kmp.ct07.scholarhub.response;

import kmp.ct07.scholarhub.entity.Folder;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class FolderContentResponse {
    private List<FolderItem> folders;
    private List<MaterialResponse> materials;

    @Data
    @Builder
    public static class FolderItem {
        private UUID id;
        private String name;

        public static FolderItem fromEntity(Folder folder) {
            return FolderItem.builder()
                    .id(folder.getId())
                    .name(folder.getName())
                    .build();
        }
    }
}


