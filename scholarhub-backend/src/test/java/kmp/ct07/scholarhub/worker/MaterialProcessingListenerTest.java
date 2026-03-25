package kmp.ct07.scholarhub.worker;

import kmp.ct07.scholarhub.entity.Material;
import kmp.ct07.scholarhub.entity.User;
import kmp.ct07.scholarhub.enums.MaterialStatus;
import kmp.ct07.scholarhub.enums.MaterialType;
import kmp.ct07.scholarhub.event.MaterialUploadedEvent;
import kmp.ct07.scholarhub.repository.MaterialRepository;
import kmp.ct07.scholarhub.service.IDocumentConverterService;
import kmp.ct07.scholarhub.service.IStorageService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;

/**
 * Test MaterialProcessingListener
 * 
 * Kiểm tra:
 * 1. Event được nhận đúng
 * 2. Office document được convert thành PDF
 * 3. Trạng thái Material được cập nhật đúng
 * 4. Error handling hoạt động tốt
 */
@SpringBootTest
@Slf4j
public class MaterialProcessingListenerTest {

    @Autowired
    private MaterialProcessingListener materialProcessingListener;

    @MockitoBean
    private MaterialRepository materialRepository;

    @MockitoBean
    private IStorageService storageService;

    @MockitoBean
    private IDocumentConverterService documentConverterService;

    private UUID testMaterialId;
    private Material testMaterial;
    private User testUser;

    @BeforeEach
    void setUp() {
        // Setup test data
        testMaterialId = UUID.randomUUID();
        testUser = User.builder()
                .id(UUID.randomUUID())
                .username("testuser")
                .build();

        testMaterial = Material.builder()
                .id(testMaterialId)
                .title("test-document.docx")
                .minioObjectName("uploads/test-document.docx")
                .type(MaterialType.DOCUMENT)
                .status(MaterialStatus.PENDING)
                .owner(testUser)
                .size(1024L)
                .downloadCount(0)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("✅ Should process Office document and convert to PDF")
    void testProcessOfficeDocument() throws Exception {
        // Arrange
        MaterialUploadedEvent event = new MaterialUploadedEvent(
                testMaterialId,
                "uploads/test-document.docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );

        // Mock repository
        when(materialRepository.findById(testMaterialId))
                .thenReturn(Optional.of(testMaterial));

        // Mock storage service - trả về InputStream
        byte[] mockFileBytes = "mock docx content".getBytes();
        java.io.InputStream mockInputStream = new java.io.ByteArrayInputStream(mockFileBytes);
        when(storageService.getObject(anyString(), anyString()))
                .thenReturn(mockInputStream);

        // Mock document converter - trả về PDF bytes
        byte[] mockPdfBytes = "mock pdf content".getBytes();
        when(documentConverterService.convertOfficeToPdf(any(), anyString()))
                .thenReturn(mockPdfBytes);

        // Act
        materialProcessingListener.handleMaterialUploadedEvent(event);

        // Wait for async processing
        Thread.sleep(1000);

        // Assert
        verify(materialRepository, times(2)).findById(testMaterialId);
        verify(storageService, times(1)).getObject(anyString(), anyString());
        verify(documentConverterService, times(1)).convertOfficeToPdf(any(), anyString());
        verify(storageService, times(1)).uploadFile(anyString(), anyString(), any(), anyLong(), anyString());
        verify(materialRepository, times(1)).save(argThat(m -> 
            m.getStatus() == MaterialStatus.READY &&
            m.getPreviewObjectName() != null
        ));

        log.info("✅ Test passed: Office document conversion successful");
    }

    @Test
    @DisplayName("✅ Should set preview to original for PDF files")
    void testProcessPdfDocument() throws Exception {
        // Arrange
        testMaterial.setMinioObjectName("uploads/test-document.pdf");
        testMaterial.setTitle("test-document.pdf");

        MaterialUploadedEvent event = new MaterialUploadedEvent(
                testMaterialId,
                "uploads/test-document.pdf",
                "application/pdf"
        );

        when(materialRepository.findById(testMaterialId))
                .thenReturn(Optional.of(testMaterial));

        // Act
        materialProcessingListener.handleMaterialUploadedEvent(event);

        // Wait for async processing
        Thread.sleep(500);

        // Assert
        verify(storageService, never()).getObject(anyString(), anyString());
        verify(documentConverterService, never()).convertOfficeToPdf(any(), anyString());
        verify(materialRepository, times(1)).save(argThat(m -> 
            m.getStatus() == MaterialStatus.READY &&
            m.getPreviewObjectName().equals(testMaterial.getMinioObjectName())
        ));

        log.info("✅ Test passed: PDF document direct preview set");
    }

    @Test
    @DisplayName("❌ Should handle exception gracefully")
    void testErrorHandling() throws Exception {
        // Arrange
        MaterialUploadedEvent event = new MaterialUploadedEvent(
                testMaterialId,
                "uploads/test-document.docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );

        // Mock to throw exception
        when(materialRepository.findById(testMaterialId))
                .thenThrow(new RuntimeException("Database error"));

        // Act - should not throw exception due to try-catch
        assertThatNoException().isThrownBy(() -> 
            materialProcessingListener.handleMaterialUploadedEvent(event)
        );

        // Wait for async processing
        Thread.sleep(500);

        log.info("✅ Test passed: Exception handled gracefully");
    }

    @Test
    @DisplayName("✅ Should extract extension correctly")
    void testExtensionExtraction() {
        // Test reflection to access private method
        try {
            java.lang.reflect.Method method = MaterialProcessingListener.class
                    .getDeclaredMethod("getExtension", String.class);
            method.setAccessible(true);

            // Test cases
            assertThat((String) method.invoke(materialProcessingListener, "document.docx"))
                    .isEqualTo("docx");
            assertThat((String) method.invoke(materialProcessingListener, "file.PDF"))
                    .isEqualTo("pdf");
            assertThat((String) method.invoke(materialProcessingListener, "image.JPEG"))
                    .isEqualTo("jpeg");
            assertThat((String) method.invoke(materialProcessingListener, "noextension"))
                    .isEmpty();

            log.info("✅ Test passed: Extension extraction works correctly");
        } catch (Exception e) {
            throw new RuntimeException("Failed to test extension extraction", e);
        }
    }
}

