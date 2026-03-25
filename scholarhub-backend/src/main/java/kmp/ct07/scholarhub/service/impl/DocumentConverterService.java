package kmp.ct07.scholarhub.service.impl;

import kmp.ct07.scholarhub.enums.ErrorCode;
import kmp.ct07.scholarhub.exception.AppException;
import kmp.ct07.scholarhub.service.IDocumentConverterService;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DocumentConverterService implements IDocumentConverterService {

    @Value("${gotenberg.url}")
    private String GOTENBERG_URL;
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public byte[] convertOfficeToPdf(byte[] fileBytes, String filename) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

            ByteArrayResource fileAsResource = new ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() {
                    return filename;
                }
            };

            body.add("files", fileAsResource);
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<byte[]> response = restTemplate.postForEntity(GOTENBERG_URL, requestEntity, byte[].class);

            if (response.getStatusCode().is2xxSuccessful()) {
                return response.getBody();
            } else {
                throw new AppException(ErrorCode.GOTENBERG_FAILED);
            }
        } catch (Exception e) {
            throw new AppException(ErrorCode.GOTENBERG_FAILED);
        }
    }
}
