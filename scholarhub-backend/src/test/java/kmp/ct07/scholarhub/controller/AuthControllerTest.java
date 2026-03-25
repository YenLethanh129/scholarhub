package kmp.ct07.scholarhub.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import kmp.ct07.scholarhub.dto.LoginDTO;
import kmp.ct07.scholarhub.security.AuthTokenFilter;
import kmp.ct07.scholarhub.security.JwtUtils;
import kmp.ct07.scholarhub.security.UserDetailsServiceImpl;
import kmp.ct07.scholarhub.service.IUserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// Chỉ load AuthController, không load toàn bộ App -> Nhẹ
@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false) // Tạm tắt Security Filter để test Logic Controller thuần
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private IUserService userService;

    @Autowired
    private ObjectMapper objectMapper; // Để convert Object -> JSON String

    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private UserDetailsServiceImpl userDetailsService;

    @MockBean
    private AuthTokenFilter authTokenFilter;

    @Test
    void testLogin_Success() throws Exception {
        // 1. Giả lập Service trả về token xịn khi gọi login
        String fakeToken = "ey...fake-jwt-token";
        when(userService.login("student@kma.edu.vn", "123456"))
                .thenReturn(fakeToken);

        // 2. Tạo request body
        LoginDTO loginRequest = new LoginDTO();
        loginRequest.setEmail("student@kma.edu.vn");
        loginRequest.setPassword("123456");

        // 3. Gọi API và kiểm tra
        mockMvc.perform(post("/api/v1/auth/login")
                        .contextPath("/api/v1") // Đảm bảo đúng context path nếu bạn có cấu hình
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest))
                        .with(csrf())) // Pass CSRF check
                .andExpect(status().isOk()) // Mong đợi 200 OK
                .andExpect(header().exists("Set-Cookie")); // Header có Set-Cookie
    }

    @Test
    void testLogin_Failure_WrongPassword() throws Exception {
        // 1. Giả lập Service ném lỗi khi login sai
        when(userService.login(anyString(), anyString()))
                .thenThrow(new RuntimeException("Mật khẩu không chính xác!"));

        LoginDTO loginRequest = new LoginDTO();
        loginRequest.setEmail("bad@kma.edu.vn");
        loginRequest.setPassword("wrongpass");

        // 3. Gọi API và kiểm tra
        mockMvc.perform(post("/api/v1/auth/login")
                        .contextPath("/api/v1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized()) // Mong đợi 401 Unauthorized (như ta đã sửa code AuthController)
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Mật khẩu không chính xác!")));
    }

    @Test
    void testLogin_Failure_Validation() throws Exception {
        // Test trường hợp để trống Email/Pass
        LoginDTO emptyRequest = new LoginDTO();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contextPath("/api/v1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(emptyRequest)))
                .andExpect(status().isBadRequest()); // Mong đợi 400 Bad Request (do @Valid fail)
    }
}