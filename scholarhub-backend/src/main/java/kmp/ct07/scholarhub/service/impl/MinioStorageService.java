package kmp.ct07.scholarhub.service.impl;

import io.minio.*;
import io.minio.http.Method;
import kmp.ct07.scholarhub.dto.CompleteUploadRequestDTO;
import kmp.ct07.scholarhub.dto.StatObject;
import kmp.ct07.scholarhub.enums.ErrorCode;
import kmp.ct07.scholarhub.exception.AppException;
import kmp.ct07.scholarhub.service.IStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class MinioStorageService implements IStorageService {

    private final MinioClient minioClient;
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Override
    public String uploadFile(String bucket, String filename, InputStream inputStream, long size, String contentType) {
        try {
            // Đảm bảo bucket tồn tại (Optional - có thể bỏ qua nếu chắc chắn bucket đã có)
            boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            if (!found) {
                throw new AppException(ErrorCode.BUCKET_NOT_FOUND);
            }

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(filename)
                            .stream(inputStream, size, -1) // -1 là partSize (để MinIO tự tính)
                            .contentType(contentType)
                            .build()
            );

            return filename;
        } catch (Exception e) {
            throw new AppException(ErrorCode.MINIO_UPLOAD_FAILED);
        }
    }

    @Override
    public InputStream getObject(String bucket, String filename) {
        try {
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucket)
                            .object(filename)
                            .build()
            );
        } catch (Exception e) {
            throw new AppException(ErrorCode.MINIO_GET_ERROR);
        }
    }

    @Override
    public StatObject getStat(String bucket, String objectKey) {
        try {
            io.minio.StatObjectResponse stat = minioClient.statObject(
                    io.minio.StatObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectKey)
                            .build()
            );

            kmp.ct07.scholarhub.dto.StatObject result = new kmp.ct07.scholarhub.dto.StatObject();
            result.setSize(stat.size());
            result.setContentType(stat.contentType());
            return result;
        } catch (Exception e) {
            throw new AppException(ErrorCode.MINIO_GET_ERROR);
        }
    }

    @Override
    public String initMultipartUpload(String bucket, String objectName, String contentType) {
        try {
            software.amazon.awssdk.services.s3.model.CreateMultipartUploadRequest request =
                    software.amazon.awssdk.services.s3.model.CreateMultipartUploadRequest.builder()
                    .bucket(bucket)
                    .key(objectName)
                    .contentType(contentType)
                    .build();

            software.amazon.awssdk.services.s3.model.CreateMultipartUploadResponse response =
                    s3Client.createMultipartUpload(request);

            return response.uploadId();
        } catch (Exception e) {
            throw new AppException(ErrorCode.MINIO_MULTIPART_UPLOAD_FAILED);
        }
    }

    @Override
    public Map<Integer, String> generatePresignedUrls(String bucket, String objectKey, String uploadId, List<Integer> partNumbers) {
        Map<Integer, String> presignedUrls = new HashMap<>();

        try {
            for (Integer partNumber : partNumbers) {
                // Tạo Request xin upload 1 part
                software.amazon.awssdk.services.s3.model.UploadPartRequest uploadPartRequest =
                        software.amazon.awssdk.services.s3.model.UploadPartRequest.builder()
                                .bucket(bucket)
                                .key(objectKey)
                                .uploadId(uploadId)
                                .partNumber(partNumber)
                                .build();

                // Yêu cầu ký tên vào Request đó (Có giá trị trong 3 tiếng)
                software.amazon.awssdk.services.s3.presigner.model.UploadPartPresignRequest presignRequest =
                        software.amazon.awssdk.services.s3.presigner.model.UploadPartPresignRequest.builder()
                                .signatureDuration(java.time.Duration.ofHours(3))
                                .uploadPartRequest(uploadPartRequest)
                                .build();

                // Sinh URL
                String url = s3Presigner.presignUploadPart(presignRequest).url().toString();
                presignedUrls.put(partNumber, url);
            }
            return presignedUrls;

        } catch (Exception e) {
            throw new AppException(ErrorCode.MINIO_PRESIGNED_URL_FAILED);
        }
    }

    @Override
    public void completeMultipartUpload(String bucket, String objectKey, String uploadId, List<CompleteUploadRequestDTO.PartETag> parts) {
        try {
            // Chuyển đổi DTO của mình sang Object của AWS SDK
            List<software.amazon.awssdk.services.s3.model.CompletedPart> completedParts = new java.util.ArrayList<>();
            for (var part : parts) {
                String eTag = part.getETag();
                if (eTag != null) {
                    // Xóa hết dấu ngoặc kép cũ (nếu có) để tránh bị nhân đôi (""ETag"")
                    eTag = eTag.replace("\"", "").trim();
                    // Bọc lại đúng 1 cặp ngoặc kép duy nhất
                    eTag = "\"" + eTag + "\"";
                }

                completedParts.add(software.amazon.awssdk.services.s3.model.CompletedPart.builder()
                        .partNumber(part.getPartNumber())
                        .eTag(eTag) // S3/MinIO dùng ETag để xác minh tính toàn vẹn
                        .build());
            }

            software.amazon.awssdk.services.s3.model.CompletedMultipartUpload completedMultipartUpload =
                    software.amazon.awssdk.services.s3.model.CompletedMultipartUpload.builder()
                            .parts(completedParts)
                            .build();

            software.amazon.awssdk.services.s3.model.CompleteMultipartUploadRequest request =
                    software.amazon.awssdk.services.s3.model.CompleteMultipartUploadRequest.builder()
                            .bucket(bucket)
                            .key(objectKey)
                            .uploadId(uploadId)
                            .multipartUpload(completedMultipartUpload)
                            .build();

            s3Client.completeMultipartUpload(request);
        } catch (Exception e) {
            throw new AppException(ErrorCode.MINIO_COMPLETED_UPLOAD_FAILED);
        }
    }

    @Override
    public void deleteObject(String bucket, String objectKey) {
        try {
            minioClient.removeObject(io.minio.RemoveObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .build());
        } catch (Exception e) {
            log.error("Không thể xóa file rác trên MinIO: {}", objectKey, e);
        }
    }

    @Override
    public List<Map<String, Object>> listUploadedParts(String bucketName, String objectKey, String uploadId) {
        try {
            software.amazon.awssdk.services.s3.model.ListPartsRequest request =
                    software.amazon.awssdk.services.s3.model.ListPartsRequest.builder()
                            .bucket(bucketName)
                            .key(objectKey)
                            .uploadId(uploadId)
                            .build();

            software.amazon.awssdk.services.s3.model.ListPartsResponse response = s3Client.listParts(request);

            // Duyệt qua danh sách các Part MinIO trả về và đóng gói lại
            return response.parts().stream().map(part -> {
                java.util.Map<String, Object> partData = new java.util.HashMap<>();
                partData.put("partNumber", part.partNumber());
                partData.put("eTag", part.eTag()); // ETag cực kỳ quan trọng để lát ráp file
                partData.put("size", part.size());
                return partData;
            }).collect(java.util.stream.Collectors.toList());

        } catch (software.amazon.awssdk.services.s3.model.NoSuchUploadException e) {
            // Phiên upload không tồn tại (có thể là do sai ID hoặc đã quá 24h bị MinIO xóa)
            log.warn("Không tìm thấy phiên upload để list parts. UploadID: {}", uploadId);
            return java.util.Collections.emptyList();
        } catch (Exception e) {
            log.error("Lỗi khi lấy danh sách parts từ MinIO: ", e);
            throw new AppException(ErrorCode.MINIO_GET_ERROR);
        }
    }

    @Override
    public String generateUrl(String bucketName, String objectKey, int expiryMinutes, boolean isDownload) {
        try {
            Map<String, String> reqParams = new HashMap<>();

            if (isDownload) {
                reqParams.put("response-content-disposition", "attachment"); // Yêu cầu trình duyệt tải về với tên file gốc
            } else {
                reqParams.put("response-content-disposition", "inline"); // Yêu cầu trình duyệt hỗ trợ xem trực tiếp thay vì tải về
            }
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(objectKey)
                            .expiry(expiryMinutes, TimeUnit.MINUTES)
                            .extraQueryParams(reqParams) // Thêm tham số để yêu cầu xem trực tiếp
                            .build()
            );
        } catch (Exception e) {
            log.error("Lỗi khi sinh URL: ", e);
            throw new AppException(ErrorCode.MINIO_PRESIGNED_URL_FAILED);
        }
    }
}