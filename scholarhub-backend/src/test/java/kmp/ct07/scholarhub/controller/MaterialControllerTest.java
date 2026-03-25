package kmp.ct07.scholarhub.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import kmp.ct07.scholarhub.dto.InitUploadRequestDTO;
import kmp.ct07.scholarhub.security.AuthTokenFilter;
import kmp.ct07.scholarhub.security.JwtUtils;
import kmp.ct07.scholarhub.security.UserDetailsServiceImpl;
import kmp.ct07.scholarhub.service.IStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MaterialController.class)
@AutoConfigureMockMvc(addFilters = false) // Tắt Security Filter để test riêng Controller
class MaterialControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private IStorageService storageService;

    // --- BẮT BUỘC PHẢI MOCK 2 BEAN NÀY CHO REDIS ---
    @MockBean
    private RedisTemplate<String, Object> redisTemplate;

    @MockBean
    private HashOperations<String, Object, Object> hashOperations;

    @MockBean
    private JwtUtils jwtUtils;

    // --- MOCK SECURITY BEANS ---
    @MockBean
    private UserDetailsServiceImpl userDetailsService;

    @MockBean
    private AuthTokenFilter authTokenFilter;

    @BeforeEach
    void setUp() {
        // Cực kỳ quan trọng: Giả lập để khi Controller gọi redisTemplate.opsForHash()
        // thì không bị dính lỗi NullPointerException
        when(redisTemplate.opsForHash()).thenReturn(hashOperations);
    }

    @Test
    void testInitUpload_Success() throws Exception {
        // 1. Chuẩn bị dữ liệu đầu vào
        UUID fakeUserId = UUID.randomUUID();
        UUID fakeFolderId = UUID.randomUUID();
        String fakeToken = "Bearer ey...token.gia";
        String fakeUploadId = "mock-upload-id-12345";

        InitUploadRequestDTO request = new InitUploadRequestDTO();
        request.setFileName("bai_giang_java.mp4");
        request.setFileSize(1024 * 1024 * 50); // 50MB
        request.setContentType("video/mp4");
        request.setFolderID(fakeFolderId);

        // 2. Giả lập hành vi (Mock behaviors)
        // Giải mã token giả sẽ trả về fakeUserId
        when(jwtUtils.getUserIdFromJwtToken(anyString())).thenReturn(fakeUserId);

        // Gọi Storage Service sẽ trả về fakeUploadId
        when(storageService.initMultipartUpload(any(), anyString(), eq("video/mp4")))
                .thenReturn(fakeUploadId);

        // 3. Thực thi & Kiểm tra (Execute & Assert)
        mockMvc.perform(post("/api/v1/materials/init-upload")
                        .contextPath("/api/v1")
                        .header("Authorization", fakeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.uploadId").value(fakeUploadId)) // Phải có uploadId
                .andExpect(jsonPath("$.objectKey").exists());          // Phải sinh ra objectKey
    }

    @Test
    void testInitUpload_Fail_FileTooLarge() throws Exception {
        InitUploadRequestDTO request = new InitUploadRequestDTO();
        request.setFileName("phim_4k_sieu_nang.mkv");
        request.setFileSize(16L * 1024 * 1024 * 1024); // 16GB (Cố tình vượt 15GB)
        request.setContentType("video/x-matroska");

        mockMvc.perform(post("/api/v1/materials/init-upload")
                        .contextPath("/api/v1")
                        .header("Authorization", "Bearer fake-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isBadRequest()) // Trả về 400
                .andExpect(content().string(org.hamcrest.Matchers.containsString("vượt quá giới hạn")));
    }

    @Test
    void testInitUpload_Fail_InvalidExtension() throws Exception {
        InitUploadRequestDTO request = new InitUploadRequestDTO();
        request.setFileName("virus_doc_hai.exe"); // Đuôi .exe không nằm trong Whitelist
        request.setFileSize(1024 * 1024 * 2); // 2MB
        request.setContentType("application/x-msdownload");

        mockMvc.perform(post("/api/v1/materials/init-upload")
                        .contextPath("/api/v1")
                        .header("Authorization", "Bearer fake-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isBadRequest()) // Trả về 400
                .andExpect(content().string(org.hamcrest.Matchers.containsString("không được hệ thống hỗ trợ")));
    }

    @Test
    void testGetPresignedUrls_Success() throws Exception {
        UUID fakeUserId = UUID.randomUUID();
        String fakeUploadId = "upload-123";
        String fakeObjectKey = "uploads/video.mp4";

        // Giả lập Dữ liệu Redis hợp lệ
        Map<Object, Object> mockRedisData = new HashMap<>();
        mockRedisData.put("userId", fakeUserId.toString());
        mockRedisData.put("objectKey", fakeObjectKey);

        when(jwtUtils.getUserIdFromJwtToken(anyString())).thenReturn(fakeUserId);
        when(hashOperations.entries("upload:session:" + fakeUploadId)).thenReturn(mockRedisData);

        // Giả lập Storage Service trả về link
        Map<Integer, String> mockUrls = new HashMap<>();
        mockUrls.put(1, "http://minio/link-part-1");
        mockUrls.put(2, "http://minio/link-part-2");

        when(storageService.generatePresignedUrls(any(), eq(fakeObjectKey), eq(fakeUploadId), any()))
                .thenReturn(mockUrls);

        mockMvc.perform(get("/api/v1/materials/presigned-urls")
                        .contextPath("/api/v1")
                        .header("Authorization", "Bearer fake-token")
                        .param("uploadId", fakeUploadId)
                        .param("objectKey", fakeObjectKey)
                        .param("partNumbers", "1,2")) // Spring tự convert thành List<Integer>
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.1").value("http://minio/link-part-1"))
                .andExpect(jsonPath("$.2").value("http://minio/link-part-2"));
    }

    @Test
    void testGetPresignedUrls_Fail_NotFound() throws Exception {
        // Giả lập Redis trả về rỗng (Session không tồn tại)
        when(hashOperations.entries(anyString())).thenReturn(new HashMap<>());

        mockMvc.perform(get("/api/v1/materials/presigned-urls")
                        .contextPath("/api/v1")
                        .header("Authorization", "Bearer fake-token")
                        .param("uploadId", "invalid-upload-id")
                        .param("objectKey", "some-key")
                        .param("partNumbers", "1"))
                .andExpect(status().isNotFound()) // Mong đợi 404
                .andExpect(content().string(org.hamcrest.Matchers.containsString("không tồn tại")));
    }

    @Test
    void testGetPresignedUrls_Fail_Forbidden() throws Exception {
        UUID currentUserId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID(); // Một ID khác!
        String fakeUploadId = "upload-123";
        String fakeObjectKey = "uploads/video.mp4";

        Map<Object, Object> mockRedisData = new HashMap<>();
        mockRedisData.put("userId", otherUserId.toString()); // Session thuộc về người khác
        mockRedisData.put("objectKey", fakeObjectKey);

        when(jwtUtils.getUserIdFromJwtToken(anyString())).thenReturn(currentUserId);
        when(hashOperations.entries("upload:session:" + fakeUploadId)).thenReturn(mockRedisData);

        mockMvc.perform(get("/api/v1/materials/presigned-urls")
                        .contextPath("/api/v1")
                        .header("Authorization", "Bearer fake-token")
                        .param("uploadId", fakeUploadId)
                        .param("objectKey", fakeObjectKey)
                        .param("partNumbers", "1"))
                .andExpect(status().isForbidden()) // Mong đợi 403
                .andExpect(content().string(org.hamcrest.Matchers.containsString("không có quyền")));
    }
}