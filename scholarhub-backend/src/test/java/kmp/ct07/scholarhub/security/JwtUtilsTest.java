package kmp.ct07.scholarhub.security;

import kmp.ct07.scholarhub.entity.User;
import kmp.ct07.scholarhub.enums.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilsTest {

    private JwtUtils jwtUtils;
    private User mockUser;

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();

        // Inject giá trị cấu hình (giả lập application.properties)
        // Lưu ý: Secret phải khớp Base64 nếu code của bạn decode Base64
        // Ở đây tôi dùng chuỗi test đơn giản và giả định bạn dùng keys.hmacShaKeyFor(bytes)
        // Nếu bạn dùng Base64 decode trong code chính, hãy đổi chuỗi này thành Base64 hợp lệ
        String secret = "DayLaChuoiBiMatDeTestUnitKMA2024PhaiDuDai32KyTuTroLenNheHihi";
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", secret);

        // Tạo user giả
        mockUser = User.builder()
                .id(UUID.randomUUID())
                .username("testuser")
                .role(UserRole.STUDENT)
                .build();
    }

    @Test
    void testGenerateAndValidateToken_Success() {
        // 1. Setup: Token sống 1 phút (60000ms)
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 60000);

        // 2. Action
        String token = jwtUtils.generateJwtToken(mockUser);

        // 3. Assert
        assertNotNull(token);
        assertTrue(jwtUtils.validateJwtToken(token));
        assertEquals("testuser", jwtUtils.getUsernameFromJwtToken(token));
        assertEquals(mockUser.getId(), jwtUtils.getUserIdFromJwtToken(token));
    }

    @Test
    void testValidateToken_Expired() throws InterruptedException {
        // 1. Setup: Token chỉ sống 1ms (Hết hạn ngay lập tức)
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 1);

        // 2. Action
        String token = jwtUtils.generateJwtToken(mockUser);

        // Chờ 10ms để chắc chắn token hết hạn
        Thread.sleep(10);

        // 3. Assert
        assertFalse(jwtUtils.validateJwtToken(token), "Token hết hạn phải trả về false");
    }

    @Test
    void testValidateToken_Malformed() {
        String invalidToken = "token.nay.bi.sai";
        assertFalse(jwtUtils.validateJwtToken(invalidToken));
    }
}