package kmp.ct07.scholarhub.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import kmp.ct07.scholarhub.enums.UserRole;
import lombok.Data;

@Data
public class RegisterDTO {
    @NotBlank(message = "Username không được để trống")
    @Size(min = 3, max = 50, message = "Username phải từ 3-50 ký tự")
    private String username;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    @NotNull(message= "Vai trò của người dùng không xác định!")
    private UserRole role;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
    private String password;

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(min = 3, max = 100, message = "Họ và tên phải từ 3-100 ký tự")
    private String fullName;
}