package kmp.ct07.scholarhub.controller;

import kmp.ct07.scholarhub.dto.FolderRequestDTO;
import kmp.ct07.scholarhub.response.BaseResponse;
import kmp.ct07.scholarhub.response.FolderContentResponse;
import kmp.ct07.scholarhub.response.FolderTreeResponse;
import kmp.ct07.scholarhub.security.UserDetailsImpl;
import kmp.ct07.scholarhub.service.IFolderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/folders")
@RequiredArgsConstructor
@Slf4j
public class FolderController {

    private final IFolderService folderService;

    @GetMapping("/tree")
    public ResponseEntity<?> getUserFolderTree(@AuthenticationPrincipal UserDetailsImpl currentUser) {
        List<FolderTreeResponse> response = folderService.getUserFolderTree(currentUser.getId());
        return ResponseEntity.ok()
                .body(BaseResponse.<List<FolderTreeResponse>>builder()
                    .message("Lấy cây thư mục thành công")
                    .data(response)
                    .build());
    }

    @GetMapping("/{folderId}/contents")
    public ResponseEntity<?> getFolderContents(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @PathVariable UUID folderId
    ) {
        FolderContentResponse folderContentResponse = folderService.getFolderContents(currentUser.getId(), folderId);
        return ResponseEntity.ok()
                .body(BaseResponse.<FolderContentResponse>builder()
                        .message("Lấy dữ liệu thư mục thành công")
                        .data(folderContentResponse)
                        .build());
    }

    // Lấy nội dung của Thư mục Gốc (Ngoài cùng)
    @GetMapping("/root/contents")
    public ResponseEntity<BaseResponse<FolderContentResponse>> getRootContents(
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        FolderContentResponse contents = folderService.getRootFolderContents(currentUser.getId());

        return ResponseEntity.ok()
                .body(BaseResponse.<FolderContentResponse>builder()
                        .message("Truy xuất thư mục gốc thành công")
                        .data(contents)
                        .build());
    }

    @PostMapping("/create")
//    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<?> createFolder(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody FolderRequestDTO request
            ) {
        folderService.createFolder(currentUser.getId(), request.getFolderName(), request.getParentFolderId() != null ? request.getParentFolderId() : null);
        return ResponseEntity.ok()
                .body(BaseResponse.<Void>builder()
                    .message("Tạo thư mục thành công")
                    .build());
    }

    @PutMapping("/rename")
    public ResponseEntity<?> renameFolder(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody FolderRequestDTO request
    ) {
        folderService.renameFolder(currentUser.getId(), java.util.UUID.fromString(request.getFolderId()), request.getNewFolderName());
        return ResponseEntity.ok()
                .body(BaseResponse.<Void>builder()
                        .message("Đổi tên thư mục thành công")
                        .build());
    }

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteFolder(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody FolderRequestDTO request
    ) {
        folderService.deleteFolder(currentUser.getId(), java.util.UUID.fromString(request.getFolderId()));
        return ResponseEntity.ok()
                .body(BaseResponse.<Void>builder()
                        .message("Xóa thư mục thành công")
                        .build());
    }

    @PutMapping("/{folderId}/move")
    public ResponseEntity<?> moveFolder(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @PathVariable UUID folderId,
            @RequestBody FolderRequestDTO requestDTO
            ) {
        folderService.moveFolder(currentUser.getId(), folderId, requestDTO.getParentFolderId());
        return ResponseEntity.ok()
                .body(BaseResponse.<Void>builder()
                        .message("Di chuyển thư mục thành công")
                        .build());
    }
}
