package kmp.ct07.scholarhub.service;

import kmp.ct07.scholarhub.dto.RegisterDTO;
import kmp.ct07.scholarhub.entity.User;

public interface IUserService {
    String login(String email, String password);

    void register(RegisterDTO request); // Thêm hàm này

    User getByEmail(String email);
}
