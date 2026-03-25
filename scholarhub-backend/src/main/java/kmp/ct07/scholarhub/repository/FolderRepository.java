package kmp.ct07.scholarhub.repository;

import io.lettuce.core.dynamic.annotation.Param;
import kmp.ct07.scholarhub.entity.Folder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FolderRepository extends JpaRepository<Folder, UUID> {

    /**
     * Lấy toàn bộ cây thư mục của một User bằng 1 câu lệnh SQL duy nhất (Chống N+1)
     * Sử dụng CTE (Common Table Expression) của PostgreSQL
     */
    @Query(value = """
            WITH RECURSIVE folder_tree AS (
                -- 1. Lấy root folders của user (chưa bị xóa)
                SELECT * FROM folders 
                WHERE user_id = :userId AND parent_id IS NULL AND is_deleted = false 
                
                UNION ALL
                
                -- 2. Đệ quy lấy con (Chú ý: JOIN phải đứng trước WHERE)
                SELECT f.* FROM folders f
                INNER JOIN folder_tree ft ON f.parent_id = ft.id 
                WHERE f.is_deleted = false
            )
            SELECT * FROM folder_tree;
            """, nativeQuery = true)
    List<Folder> findAllFoldersTreeByUserId(@Param("userId") UUID userId);

    /**
     * Tìm thư mục theo tên, parentId và userId (dùng để kiểm tra trùng tên khi tạo mới hoặc đổi tên)
     * @param name Tên thư mục cần tìm
     * @param parentId ID của thư mục cha (nếu có, nếu null thì tìm ở cấp gốc)
     * @param userId ID của User
     * @return Thư mục tìm được hoặc null nếu không tìm thấy
     */
    @Query("SELECT COUNT(f) > 0 FROM Folder f WHERE f.name = :name AND f.user.id = :userId AND ((f.parent IS NULL AND :parentId IS NULL) OR (f.parent.id = :parentId)) AND f.isDeleted = false")
    boolean existByNameAndParentIdAndUserId(String name, UUID parentId, UUID userId);

    /**
     * Tìm thư mục theo folderId (Có thể null) và userId (dùng để kiểm tra quyền sở hữu khi đổi tên hoặc xóa)
     * @param userId ID của User
     * @return Thư mục tìm được hoặc null nếu không tìm thấy
     */
    List<Folder> findByParentIdAndUserIdAndIsDeletedFalse(UUID parentId, UUID userId);
    /**
     * Tìm toàn bộ thư mục gốc (parentId = null) của một User (dùng để lấy nội dung thư mục gốc)
     * @param userId ID của User
     * @return Danh sách thư mục gốc của User
     */
    List<Folder> findByParentIsNullAndUserIdAndIsDeletedFalse(UUID userId);

    /**
     * Tìm toàn bộ thư mục con của một thư mục cha (dùng để xóa mềm đệ quy)
     * @param parentId ID của thư mục cha
     * @return Danh sách thư mục con
     */
    @Query("SELECT f FROM Folder f WHERE f.parent.id = :parentId AND f.isDeleted = false")
    List<Folder> findByParentId(UUID parentId);
}
