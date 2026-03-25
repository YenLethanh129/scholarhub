package kmp.ct07.scholarhub.service.impl;

import kmp.ct07.scholarhub.dto.RegisterDTO;
import kmp.ct07.scholarhub.entity.User;
import kmp.ct07.scholarhub.enums.ErrorCode;
import kmp.ct07.scholarhub.enums.UserRole;
import kmp.ct07.scholarhub.exception.AppException;
import kmp.ct07.scholarhub.repository.UserRepository;
import kmp.ct07.scholarhub.security.JwtUtils;
import kmp.ct07.scholarhub.service.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService implements IUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @Override
    public String login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.EMAIL_NOT_REGISTERED));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new AppException(ErrorCode.PASSWORD_INCORRECT);
        }

        return jwtUtils.generateJwtToken(user);
    }

    @Override
    public void register(RegisterDTO request) {
        // 1. Check trùng Username
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USERNAME_ALREADY_EXISTED);
        }

        // 2. Check trùng Email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_REGISTERED);
        }

        // 3. Tạo Entity User mới
        User newUser = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .fullName(request.getFullName())
                .role(UserRole.STUDENT) // Mặc định đăng ký là Sinh viên
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        // 4. Lưu xuống DB
        userRepository.save(newUser);
    }

    @Override
    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.EMAIL_NOT_REGISTERED));
    }
}
