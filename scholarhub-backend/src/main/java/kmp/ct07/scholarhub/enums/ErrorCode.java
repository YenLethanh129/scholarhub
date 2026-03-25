package kmp.ct07.scholarhub.enums;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    // 1. Nhóm lỗi hệ thống (System)
    UNCATEGORIZED_EXCEPTION(500, "Lỗi hệ thống không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    REDIS_CORRUPTED(500, "Dữ liệu Redis bị hỏng", HttpStatus.INTERNAL_SERVER_ERROR),

    // 2. Nhóm lỗi xác thực/phân quyền (Auth)
    UNAUTHENTICATED(401, "Bạn chưa đăng nhập hoặc Token không hợp lệ", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(403, "Bạn không có quyền thực hiện hành động này", HttpStatus.FORBIDDEN),
    EMAIL_ALREADY_REGISTERED(400, "Email đã được đăng ký", HttpStatus.BAD_REQUEST),
    EMAIL_NOT_REGISTERED(400, "Email chưa được đăng ký", HttpStatus.BAD_REQUEST),
    PASSWORD_INCORRECT(400, "Mật khẩu không đúng", HttpStatus.BAD_REQUEST),
    USERNAME_ALREADY_EXISTED(400, "Username đã tồn tại", HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND(404, "Không tìm thấy người dùng", HttpStatus.NOT_FOUND),

    // MinIO Errors
    BUCKET_NOT_FOUND(404, "Không tìm thấy bucket lưu trữ", HttpStatus.NOT_FOUND),
    MINIO_UPLOAD_FAILED(500, "Lỗi khi upload file lên MinIO", HttpStatus.INTERNAL_SERVER_ERROR),
    MINIO_GET_ERROR(500, "Lỗi khi lấy thông tin file từ MinIO", HttpStatus.INTERNAL_SERVER_ERROR),
    MINIO_FILE_ERROR(500, "Lỗi liên quan đến file trên MinIO", HttpStatus.INTERNAL_SERVER_ERROR),
    MINIO_MULTIPART_UPLOAD_FAILED(500, "Lỗi khi thực hiện multipart upload trên MinIO", HttpStatus.INTERNAL_SERVER_ERROR),
    MINIO_PRESIGNED_URL_FAILED(500, "Lỗi khi tạo pre-signed URL trên MinIO", HttpStatus.INTERNAL_SERVER_ERROR),
    MINIO_COMPLETED_UPLOAD_FAILED(500, "Lỗi khi hoàn tất multipart upload trên MinIO", HttpStatus.INTERNAL_SERVER_ERROR),


    // 3. Nhóm lỗi nghiệp vụ (Business Logic)
    ERROR_SESSION(404, "Phiên upload không tồn tại hoặc đã hết hạn", HttpStatus.NOT_FOUND),
    FOLDER_NOT_FOUND(404, "Không tìm thấy thư mục", HttpStatus.NOT_FOUND),
    FOLDER_NAME_EXISTED(400, "Tên thư mục đã tồn tại", HttpStatus.BAD_REQUEST),
    PARENT_FOLDER_NOT_FOUND(400, "Không tìm thấy thư mục cha", HttpStatus.BAD_REQUEST),
    FOLDER_RECURSIVE(400, "Không thể di chuyển thư mục vào chính nó hoặc thư mục con", HttpStatus.BAD_REQUEST),
    UPLOAD_FAILED(500, "Xử lý hoàn tất upload thất bại, đã dọn rác", HttpStatus.INTERNAL_SERVER_ERROR),

    MATERIAL_NOT_FOUND(404, "Không tìm thấy tài liệu", HttpStatus.NOT_FOUND),

    // 4. Nhóm lỗi liên quan đến file (File-related)
    GOTENBERG_FAILED(500, "Lỗi khi chuyển đổi file bằng Gotenberg", HttpStatus.INTERNAL_SERVER_ERROR),
    CONVERT_PDF_FAILED(500, "Lỗi khi chuyển đổi file sang PDF", HttpStatus.INTERNAL_SERVER_ERROR),

    FILE_NOT_FOUND(404, "Không tìm thấy file", HttpStatus.NOT_FOUND),
    FILE_TOO_LARGE(400, "Kích thước file vượt quá giới hạn", HttpStatus.BAD_REQUEST);

    private final int code;
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(int code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }
}