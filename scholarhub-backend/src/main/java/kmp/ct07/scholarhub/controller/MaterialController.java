package kmp.ct07.scholarhub.controller;

import kmp.ct07.scholarhub.dto.CompleteUploadRequestDTO;
import kmp.ct07.scholarhub.dto.FolderRequestDTO;
import kmp.ct07.scholarhub.dto.InitUploadRequestDTO;
import kmp.ct07.scholarhub.dto.MaterialUpdateDTO;
import kmp.ct07.scholarhub.entity.Material;
import kmp.ct07.scholarhub.enums.ErrorCode;
import kmp.ct07.scholarhub.exception.AppException;
import kmp.ct07.scholarhub.response.BaseResponse;
import kmp.ct07.scholarhub.response.MaterialResponse;
import kmp.ct07.scholarhub.security.JwtUtils;
import kmp.ct07.scholarhub.security.UserDetailsImpl;
import kmp.ct07.scholarhub.service.IFileValidationService;
import kmp.ct07.scholarhub.service.IStorageService;
import kmp.ct07.scholarhub.service.impl.MaterialService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.repository.Update;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/materials")
@RequiredArgsConstructor
@Slf4j
public class MaterialController {

    private final IStorageService storageService;
    private final IFileValidationService fileValidationService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final JwtUtils jwtUtils;
    @Autowired
    private MaterialService materialBusinessService;

    @Value("${minio.bucket-name}")
    private String bucketName;

    @GetMapping("")
    public ResponseEntity<?> getUserMaterials(@AuthenticationPrincipal UserDetailsImpl currentUser) {
        List<Material> materialEntities = materialBusinessService.getAllMaterialsByUserId(currentUser.getId());

        List<MaterialResponse> materials = new ArrayList<>();
        for (Material m : materialEntities) {
            materials.add(MaterialResponse.fromEntity(m));
        }

        return ResponseEntity.ok()
                .body(BaseResponse.<List<MaterialResponse>>builder()
                        .message("Lấy danh sách học liệu thành công")
                        .data(materials)
                        .build());
    }

    @GetMapping("{id}")
    public ResponseEntity<?> getMaterialDetails(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @PathVariable UUID id
    ) {
        Material material = materialBusinessService.getMaterialDetails(id);

        return ResponseEntity.ok()
                .body(BaseResponse.<MaterialResponse>builder()
                        .message("Lấy chi tiết học liệu thành công")
                        .data(MaterialResponse.fromEntity(material))
                        .build());
    }

    @PostMapping("/init-upload")
    public ResponseEntity<?> initUpload(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody InitUploadRequestDTO requestDTO
            ) {

        String today = getUUIDToDay();
        fileValidationService.validate(requestDTO.getFileName(), requestDTO.getFileSize(), requestDTO.getContentType());
        String objectKey = today + "/" + currentUser.getId() + "/" + requestDTO.getFileName();
        String uploadId = storageService.initMultipartUpload(bucketName, objectKey, requestDTO.getContentType());

        Map<String, Object> uploadSession = new HashMap<>();
        uploadSession.put("uploadId", uploadId);
        uploadSession.put("objectKey", objectKey);
        uploadSession.put("userId",  currentUser.getId());
        uploadSession.put("folderId", requestDTO.getFolderID());
        uploadSession.put("status", "UPLOADING");

        String redisKey = "upload:session:" + uploadId;
        redisTemplate.opsForHash().putAll(redisKey, uploadSession);
        redisTemplate.expire(redisKey, java.time.Duration.ofHours(24));

        Map<String, String> response = new HashMap<>();
        response.put("uploadId", uploadId);
        response.put("objectKey", objectKey);

        return ResponseEntity.ok()
                .body(BaseResponse.<Map<String, String>>builder()
                        .message("Upload session đã được khởi tạo")
                        .data(response)
                        .build());
    }

    @GetMapping("/presigned-urls")
    public ResponseEntity<?> getPresignedUrls(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestParam String uploadId,
            @RequestParam String objectKey,
            @RequestParam List<Integer> partNumbers)
    {
        String redisKey = "upload:session:" + uploadId;
        Map<Object, Object> sessionData = redisTemplate.opsForHash().entries(redisKey);

        // GUARD 1: Lỗi 404 - Không tìm thấy Session (Check Empty TRƯỚC TIÊN)
        if (sessionData == null || sessionData.isEmpty()) {
            throw new AppException(ErrorCode.ERROR_SESSION);
        }

        // 3. Trích xuất dữ liệu
        Object userIdObj = sessionData.get("userId");
        Object objectKeyObj = sessionData.get("objectKey");

        // GUARD 2: Lỗi 500 - Dữ liệu Redis bị hỏng (Corrupted)
        if (userIdObj == null || objectKeyObj == null) {
            throw new AppException(ErrorCode.REDIS_CORRUPTED);
        }

        UUID sessionUserId = UUID.fromString(userIdObj.toString());
        String sessionObjectKey = objectKeyObj.toString();

        if (!currentUser.getId().equals(sessionUserId) || !objectKey.equals(sessionObjectKey)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // 4. Logic cốt lõi: Gọi MinIO sinh URLs
        Map<Integer, String> urls = storageService.generatePresignedUrls(bucketName, objectKey, uploadId, partNumbers);

        return ResponseEntity.ok()
                .body(BaseResponse.<Map<Integer, String>>builder()
                        .message("Presigned URLs đã được tạo")
                        .data(urls)
                        .build());
    }

    @PostMapping("/complete-upload")
    public ResponseEntity<?> completeUpload(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody CompleteUploadRequestDTO request)
    {
        String redisKey = "upload:session:" + request.getUploadId();
        Map<Object, Object> sessionData = redisTemplate.opsForHash().entries(redisKey);
        if (sessionData == null || sessionData.isEmpty()) {
            throw new AppException(ErrorCode.ERROR_SESSION);
        }

        UUID secureFolderId = null;
        Object folderIdObj = sessionData.get("folderId");
        if (folderIdObj != null && !folderIdObj.toString().isEmpty() && !folderIdObj.toString().equals("null")) {
            secureFolderId = UUID.fromString(folderIdObj.toString());
        }

        Material savedMaterial = materialBusinessService.processCompleteUpload(currentUser.getId(), secureFolderId, request);

        redisTemplate.delete("upload:session:" + request.getUploadId());

        MaterialResponse responseDTO = MaterialResponse.fromEntity(savedMaterial);

        return ResponseEntity.ok()
                .body(BaseResponse.<MaterialResponse>builder()
                        .message("Upload hoàn tất và học liệu đã sẵn sàng")
                        .data(responseDTO)
                        .build());
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<?> getDownloadUrl(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @PathVariable UUID id
    ) {
        String downloadUrl = materialBusinessService.getDownloadUrl(id, currentUser.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("materialId", id);
        response.put("downloadUrl", downloadUrl);
        response.put("expiresIn", "15 minutes");

        materialBusinessService.increaseDownloadCount(id);

        return ResponseEntity.ok()
                .body(BaseResponse.<Map<String, Object>>builder()
                        .message("Link tải đã được tạo")
                        .data(response)
                        .build());
    }

    @GetMapping("/upload-status")
    public ResponseEntity<?> getUploadStatus(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestParam String uploadId,
            @RequestParam String objectKey) {

        String redisKey = "upload:session:" + uploadId;
        Map<Object, Object> sessionData = redisTemplate.opsForHash().entries(redisKey);

        if (sessionData == null || sessionData.isEmpty()) {
            throw new AppException(ErrorCode.ERROR_SESSION);
        }

        UUID sessionUserId = UUID.fromString(sessionData.get("userId").toString());
        String sessionObjectKey = sessionData.get("objectKey").toString();

        if (!currentUser.getId().equals(sessionUserId) || !objectKey.equals(sessionObjectKey)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // 2. An toàn rồi, gọi Thủ thư (Storage Service) xuống kho đếm hàng
        List<Map<String, Object>> uploadedParts = storageService.listUploadedParts(bucketName, objectKey, uploadId);

        // 3. Trả kết quả về cho Frontend
        Map<String, Object> response = new HashMap<>();
        response.put("uploadId", uploadId);
        response.put("objectKey", objectKey);
        response.put("uploadedParts", uploadedParts);

        return ResponseEntity.ok()
                .body(BaseResponse.<Map<String, Object>>builder()
                        .message("Trạng thái upload đã được cập nhật")
                        .data(response)
                        .build());
    }

    @PutMapping("/{materialId}/move")
    public ResponseEntity<?> moveMaterial(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @PathVariable UUID materialId,
            @RequestBody UUID folderId
    ) {
        UUID targetFolderId = folderId.equals(UUID.fromString("00000000-0000-0000-0000-000000000000")) ? null : folderId;

        Material updatedMaterial = materialBusinessService.updateMaterialFolder(materialId, targetFolderId, currentUser.getId());

        return ResponseEntity.ok()
                .body(BaseResponse.<MaterialResponse>builder()
                        .message("Học liệu đã được di chuyển thành công")
                        .data(MaterialResponse.fromEntity(updatedMaterial))
                        .build());
    }

    @GetMapping("/{id}/view-url")
    public ResponseEntity<?> getViewUrl(@PathVariable UUID id) {
        String viewUrl = materialBusinessService.getViewUrl(id);

        materialBusinessService.increaseDownloadCount(id);

        return ResponseEntity.ok().body(BaseResponse.<String>builder()
                .message("Link xem trước đã được tạo")
                .data(viewUrl)
                .build(
        ));
    }

    @PutMapping("/{id}/update-material")
    public ResponseEntity<?> updateMaterial(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @PathVariable UUID id,
            @RequestBody MaterialUpdateDTO metadataUpdates
            ) {
        Material updatedMaterial = materialBusinessService.updateMaterial(id, metadataUpdates, currentUser.getId());

        return ResponseEntity.ok()
                .body(BaseResponse.<MaterialResponse>builder()
                        .message("Cập nhật thông tin học liệu thành công")
                        .data(MaterialResponse.fromEntity(updatedMaterial))
                        .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMaterial(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @PathVariable UUID id
    ) {
        materialBusinessService.deleteMaterial(id, currentUser.getId());

        return ResponseEntity.ok()
                .body(BaseResponse.<String>builder()
                        .message("Học liệu đã được xóa thành công")
                        .data(null)
                        .build());
    }

    private String getUUIDToDay() {
        Calendar calendar = Calendar.getInstance();
        int year = calendar.get(Calendar.YEAR);
        int month = calendar.get(Calendar.MONTH) + 1;
        int day = calendar.get(Calendar.DAY_OF_MONTH);
        return String.format("%04d%02d%02d", year, month, day);
    }
}
