# Dùng môi trường Java 21 siêu nhẹ
FROM eclipse-temurin:21-jdk-alpine

# Thư mục làm việc bên trong container
WORKDIR /app

# Copy file JAR sau khi build vào container
COPY target/*.jar app.jar

# Mở port 8080 cho Frontend gọi
EXPOSE 8080

# Lệnh khởi chạy
ENTRYPOINT ["java", "-jar", "app.jar"]