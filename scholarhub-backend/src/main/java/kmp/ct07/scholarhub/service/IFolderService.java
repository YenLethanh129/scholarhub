package kmp.ct07.scholarhub.service;

import kmp.ct07.scholarhub.response.FolderContentResponse;
import kmp.ct07.scholarhub.response.FolderTreeResponse;

import java.util.List;
import java.util.UUID;

public interface IFolderService {
    /**
     * Lấy toàn bộ cây thư mục của một User
     * @param userId ID của User
     * @return Danh sách các FolderTreeResponse đại diện cho cây thư mục của User
     */
    List<FolderTreeResponse> getUserFolderTree(UUID userId);

    /**
     * Lấy danh sách file và thư mục con trực tiếp bên trong một thư mục
     * @param userId ID của User
     * @param folderId ID của thư mục cần lấy nội dung
     * @return Danh sách các FolderContentResponse đại diện cho các thư mục con và
     */
    FolderContentResponse getFolderContents(UUID userId, UUID folderId);

    /**
     * Lấy danh sách file và thư mục con trực tiếp bên trong thư mục gốc (nơi parent_id = null)
     * @param userId ID của User
     * @return Danh sách các FolderContentResponse đại diện cho các thư mục con và tài liệu ở cấp gốc
     */
    FolderContentResponse getRootFolderContents(UUID userId);

    /**
     * Tạo một thư mục mới cho User
     * @param userId ID của User
     * @param folderName Tên của thư mục mới
     * @param parentFolderId ID của thư mục cha (nếu có, nếu null thì tạo ở cấp gốc)
     */
    void createFolder(UUID userId, String folderName, UUID parentFolderId);

     /**
     * Đổi tên một thư mục
     * @param userId ID của User
     * @param folderId ID của thư mục cần đổi tên
     * @param newName Tên mới cho thư mục
     */
    void renameFolder(UUID userId, UUID folderId, String newName);

     /**
     * Xóa mềm (is_delete = true) một thư mục (và tất cả thư mục con, tài liệu bên trong nó)
     * @param userId ID của User
     * @param folderId ID của thư mục cần xóa
     */
    void deleteFolder(UUID userId, UUID folderId);

    /**
     * Di chuyển một thư mục sang thư mục cha khác (hoặc sang cấp gốc nếu parentFolderId = null) tránh việc tạo vòng lặp (chỉ cho phép di chuyển nếu thư mục đích không phải là con của thư mục cần di chuyển)
     * @param userId ID của User
     * @param folderId ID của thư mục cần di chuyển
     * @param newParentFolderId ID của thư mục cha mới (nếu có, nếu null thì di chuyển sang cấp gốc)
     */
    void moveFolder(UUID userId, UUID folderId, UUID newParentFolderId);

    /**
     * Hàm xóa cache của cây thư mục sau khi có sự thay đổi (tạo, đổi tên, xóa, di chuyển) để đảm bảo dữ liệu luôn được cập nhật khi người dùng truy cập lại cây thư mục
     * @param userId ID của User
     */
    void clearFolderTreeCache(UUID userId);
}
