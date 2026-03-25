package kmp.ct07.scholarhub.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class InitUploadRequestDTO {
    private String fileName;
    private long fileSize;
    private String contentType;
    private UUID folderID;
}
