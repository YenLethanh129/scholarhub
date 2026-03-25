package kmp.ct07.scholarhub.response;

import kmp.ct07.scholarhub.entity.User;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserResponse {
    private String fullName;
    private String role;

    public static UserResponse fromEntity(User user) {
        return UserResponse.builder()
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }
}
