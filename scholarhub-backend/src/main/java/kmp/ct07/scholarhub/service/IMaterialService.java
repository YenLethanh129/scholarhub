package kmp.ct07.scholarhub.service;

import kmp.ct07.scholarhub.dto.CompleteUploadRequestDTO;
import kmp.ct07.scholarhub.dto.MaterialUpdateDTO;
import kmp.ct07.scholarhub.entity.Material;

import java.util.List;
import java.util.UUID;

public interface IMaterialService {
    /**
     * Xử lý hoàn tất upload file: sau khi client đã upload tất cả các mảnh (parts) lên S3, client sẽ gọi API này để thông báo hoàn tất quá trình upload.
     * @param userId
     * @param secureFolderId
     * @param request
     * @return
     */
    Material processCompleteUpload(UUID userId, UUID secureFolderId, CompleteUploadRequestDTO request);

    /**
     * Lấy URL download tạm thời (pre-signed URL) cho một tài liệu, chỉ trả về nếu tài liệu tồn tại và người dùng có quyền truy cập vào nó.
     * @param materialId
     * @param currentUserId
     * @return
     */
    String getDownloadUrl(UUID materialId, UUID currentUserId);

    /**
     * Cập nhật thư mục của một tài liệu, chỉ cho phép nếu người dùng là chủ sở hữu của tài liệu đó.
     * @param materialId
     * @param newFolderId
     * @param currentUserId
     */
    Material updateMaterialFolder(UUID materialId, UUID newFolderId, UUID currentUserId);

    /**
     * Lấy chi tiết của một tài liệu, chỉ trả về nếu người dùng có quyền truy cập vào tài liệu đó.
     * @param materialId
     * @return
     */
    Material getMaterialDetails(UUID materialId);

    /**
     * Lấy danh sách tất cả tài liệu của một người dùng, bao gồm cả những tài liệu ở thư mục gốc và các thư mục con, chỉ trả về những tài liệu mà người dùng có quyền truy cập.
     * @param currentUserId
     * @return
     */
    List<Material> getAllMaterialsByUserId(UUID currentUserId);

    void increaseDownloadCount(UUID materialId);

    Material updateMaterial(UUID materialId, MaterialUpdateDTO materialUpdateDTO, UUID currentUserId);

    String getViewUrl(UUID materialId);

    void deleteMaterialsInFolder(UUID folderId);

    void deleteMaterial(UUID materialId, UUID currentUserId);
}
