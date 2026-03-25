package kmp.ct07.scholarhub.service;

import kmp.ct07.scholarhub.dto.StatObject;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

public interface IStorageService {
    /**
     * Upload file dạng stream lên Storage
     * @param bucket Tên bucket
     * @param filename Tên file lưu trữ
     * @param inputStream Luồng dữ liệu
     * @param size Kích thước file (MinIO cần biết trước size hoặc partSize)
     * @param contentType Loại file (video/mp4, application/pdf...)
     * @return Tên file đã lưu
     */
    String uploadFile(String bucket, String filename, InputStream inputStream, long size, String contentType);

    /**
     * Lấy luồng dữ liệu file để download/stream
     * @param bucket Tên bucket
     * @param filename Tên file cần lấy
     * @return InputStream
     */
    InputStream getObject(String bucket, String filename);
    /**
     * Lấy thông tin kỹ thuật của file (Size, ContentType) từ Storage
     * @param bucket Tên bucket
     * @param objectKey Tên file
     * @return StatObject
     */
    StatObject getStat(String bucket, String objectKey);

    // Thêm hàm này vào Interface
    /**
     * Khởi tạo Multipart Upload và trả về uploadId
     * @param bucket Tên bucket
     * @param objectName Tên file lưu trữ
     * @param contentType Loại file (video/mp4, application/pdf...)
     * @return uploadId để dùng cho các phần tiếp theo
     */
    String initMultipartUpload(String bucket, String objectName, String contentType);

    /**
     * Sinh danh sách Presigned URLs cho các Chunk (Parts)
     * @param bucket Tên bucket
     * @param objectKey Tên file lưu trữ
     * @param uploadId ID của Multipart Upload đã khởi tạo
     * @param partNumbers Danh sách số thứ tự của các phần (1, 2, 3...)
     * @return Map<partNumber, presignedUrl>
     */
    Map<Integer, String> generatePresignedUrls(String bucket, String objectKey, String uploadId, List<Integer> partNumbers);

    /**
     * Ghép các mảnh lại thành file hoàn chỉnh
     * @param bucket Tên bucket
     * @param objectKey Tên file lưu trữ
     * @param uploadId ID của Multipart Upload đã khởi tạo
     * @param parts
     */
    void completeMultipartUpload(String bucket, String objectKey, String uploadId, List<kmp.ct07.scholarhub.dto.CompleteUploadRequestDTO.PartETag> parts);

    //
    /**
     * Xóa file (Dùng để rollback hoặc user xóa file)
     * @param bucket Tên bucket
     * @param objectKey Tên file lưu trữ
     */
    void deleteObject(String bucket, String objectKey);

    /**
     * Lấy danh sách các chunk đã upload thành công của một file
     * @bucketName Tên bucket
     * @objectKey Tên file lưu trữ
     * @uploadId ID của Multipart Upload đã khởi tạo
     * @return List<Map<String, Object>> với mỗi Map chứa thông tin của một chunk đã upload, ví dụ: {"partNumber": 1, "eTag": "abc123", "size": 5242880}
     */
    List<Map<String, Object>> listUploadedParts(String bucketName, String objectKey, String uploadId);

    /**
     * Sinh URL để xem file trực tiếp trên trình duyệt (dành cho các file có thể xem được như PDF, hình ảnh, video), URL này cũng sẽ có thời hạn và chỉ cho phép xem chứ không cho phép tải về.
     * @param bucketName Tên bucket
     * @param objectKey Tên file lưu trữ
     * @param expiryMinutes Thời hạn của URL tính bằng phút
     * @param isDownload Link download hay link view
     * @return
     */
    String generateUrl(String bucketName, String objectKey, int expiryMinutes, boolean isDownload);
}