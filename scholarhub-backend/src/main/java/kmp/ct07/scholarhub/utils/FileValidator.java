package kmp.ct07.scholarhub.utils;

import java.util.Set;

public class FileValidator {
    // Max: 15GB
    public static final long MAX_FILE_SIZE = 15L * 1024 * 1024 * 1024;

    public static void validateFileSize(long fileSize) {
        if (fileSize > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Dung lượng file vượt quá giới hạn 15GB.");
        }
    }

    public static void validateExtension(String fileName, Set<String> allowedExtensions, String groupName) {
        String extension = getExtension(fileName);
        if (!allowedExtensions.contains(extension)) {
            throw new IllegalArgumentException("Định dạng file không được hỗ trợ cho nhóm " + groupName + ": " + extension);
        }
    }

    public static String getExtension(String fileName) {
        if (fileName == null) return "";
        fileName = fileName.split("\\?")[0].split("#")[0];
        int lastDot = fileName.lastIndexOf(".");
        if (lastDot == -1) return "";
        return fileName.substring(lastDot + 1).toLowerCase();
    }
}
