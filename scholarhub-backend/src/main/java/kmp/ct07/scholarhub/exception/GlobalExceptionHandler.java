package kmp.ct07.scholarhub.exception;

import io.jsonwebtoken.ExpiredJwtException;
import kmp.ct07.scholarhub.enums.ErrorCode;
import kmp.ct07.scholarhub.response.BaseResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.nio.file.AccessDeniedException;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    // 1. BẮT LỖI NGHIỆP VỤ
    @ExceptionHandler(value = AppException.class)
    public ResponseEntity<Map<String, Object>> handlingAppException(AppException exception) {
        ErrorCode errorCode = exception.getErrorCode();

        // Chuẩn hóa JSON trả về cho Frontend
        Map<String, Object> response = new HashMap<>();
        response.put("code", errorCode.getCode());
        response.put("message", errorCode.getMessage());

        return ResponseEntity.status(errorCode.getHttpStatus()).body(response);
    }

    // 2. BẮT LỖI SPRING SECURITY (Không đủ quyền - 403)
    @ExceptionHandler(value = AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handlingAccessDeniedException(AccessDeniedException exception) {
        ErrorCode errorCode = ErrorCode.UNAUTHORIZED;

        Map<String, Object> response = new HashMap<>();
        response.put("code", errorCode.getCode());
        response.put("message", errorCode.getMessage());

        return ResponseEntity.status(errorCode.getHttpStatus()).body(response);
    }

    // 3. BẮT LỖI HỆ THỐNG (500) - Những lỗi vớ vẩn như NullPointer, IndexOutOfBound
    @ExceptionHandler(value = Exception.class)
    public ResponseEntity<Map<String, Object>> handlingRuntimeException(Exception exception) {
        log.error("Hệ thống xảy ra lỗi nghiêm trọng: ", exception); // Log lại để Backend sửa

        ErrorCode errorCode = ErrorCode.UNCATEGORIZED_EXCEPTION;

        Map<String, Object> response = new HashMap<>();
        response.put("code", errorCode.getCode());
        response.put("message", errorCode.getMessage()); // Dấu lỗi thật (không in NullPointer ra màn hình)

        return ResponseEntity.status(errorCode.getHttpStatus()).body(response);
    }

    // Bắt lỗi khi DTO vi phạm các điều kiện @NotBlank, @NotNull, @Size...
    @ExceptionHandler(value = org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<BaseResponse<Void>> handlingValidationException(org.springframework.web.bind.MethodArgumentNotValidException exception) {
        // Lấy cái tin nhắn lỗi đầu tiên (ví dụ: "Email không được để trống")
        String errorMessage = exception.getFieldError().getDefaultMessage();

        return ResponseEntity.status(400).body(BaseResponse.<Void>builder()
                .code(400)
                .message(errorMessage)
                .build());
    }
}