package kmp.ct07.scholarhub.enums;

public enum MaterialStatus {
    PENDING, // Moi tao record, chua upload xong
    PROCESSING, // Dang upload, dang xu ly file
    READY, // Da upload xong, san sang su dung
    ERROR // Upload that bai, co the do loi file, loi mang, loi server,
}
