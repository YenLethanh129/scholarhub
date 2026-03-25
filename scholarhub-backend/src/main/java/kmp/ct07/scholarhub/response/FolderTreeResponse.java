package kmp.ct07.scholarhub.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FolderTreeResponse {
    private UUID id;
    private String name;
    private UUID parentId;
    // Chứa danh sách các thư mục con bên trong nó
    @Schema(hidden = true)
    private List<FolderTreeResponse> children = new ArrayList<>();
}
