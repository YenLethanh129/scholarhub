package kmp.ct07.scholarhub.service;

import org.springframework.web.multipart.MultipartFile;

public interface IDocumentConverterService {
    byte[] convertOfficeToPdf(byte[] fileBytes, String filename);
}
