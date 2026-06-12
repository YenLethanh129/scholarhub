package kmp.ct07.scholarhub.controller;

import jakarta.validation.Valid;
import kmp.ct07.scholarhub.dto.LoginDTO;
import kmp.ct07.scholarhub.dto.RegisterDTO;
import kmp.ct07.scholarhub.entity.User;
import kmp.ct07.scholarhub.response.BaseResponse;
import kmp.ct07.scholarhub.response.UserResponse;
import kmp.ct07.scholarhub.security.UserDetailsImpl;
import kmp.ct07.scholarhub.service.IUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final IUserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginDTO request
    ) {
        String token = userService.login(request.getEmail(), request.getPassword());
        User user = userService.getByEmail(request.getEmail());
        ResponseCookie cookie = ResponseCookie.from("JWT_TOKEN", token)
                .httpOnly(true)
                .secure(false)
                .path("/")
                .sameSite("Lax")
                .maxAge(24 * 60 * 60)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(BaseResponse.<Void>builder()
                        .message("Đăng nhập thành công!")
                        .data(null)
                        .build());
    }

    @GetMapping("/check")
    public ResponseEntity<?> checkAuth(@AuthenticationPrincipal UserDetailsImpl currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401)
                    .body(BaseResponse.<Void>builder()
                            .message("Chưa xác thực!")
                            .data(null)
                            .build());
        }
        User user = userService.getByEmail(currentUser.getEmail());

        return ResponseEntity.ok()
                .body(BaseResponse.<Void>builder()
                        .message("Đã xác thực!")
                        .build());
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserDetailsImpl currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401)
                    .body(BaseResponse.<Void>builder()
                            .message("Chưa xác thực!")
                            .data(null)
                            .build());
        }
        User user = userService.getByEmail(currentUser.getEmail());
        return ResponseEntity.ok()
                .body(BaseResponse.<String>builder()
                        .message("Thông tin người dùng hiện tại!")
                        .data(user.getRole().toString())
                        .build());
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout()
    {
        ResponseCookie cookie = ResponseCookie.from("JWT_TOKEN", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(BaseResponse.<Void>builder()
                        .message("Đăng xuất thành công!")
                        .data(null)
                        .build());
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterDTO request) {
        userService.register(request);
        return ResponseEntity.ok()
                .body(BaseResponse.<Void>builder()
                        .message("Đăng ký thành công! Vui lòng đăng nhập.")
                        .data(null)
                        .build());
    }
}
