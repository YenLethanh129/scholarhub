package kmp.ct07.scholarhub.repository;

import kmp.ct07.scholarhub.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MaterialRepository extends JpaRepository<Material, UUID> {
    List<Material> findByFolderId(UUID folderId);
    List<Material> findByOwnerId(UUID ownerId);
    void deleteByFolderId(UUID folderId);

    /**
     * Tìm tất cả Material trong một Folder cụ thể của một User, chỉ lấy những Material chưa bị xóa (isDeleted = false)
      * @param folderId ID của Folder cần tìm
      * @param ownerId ID của User sở hữu Material
      * @return Danh sách Material tìm được
     */
    List<Material> findByFolderIdAndOwnerId(UUID folderId, UUID ownerId);

    List<Material> findByFolderIdIsNullAndOwnerId(UUID ownerId);
}
