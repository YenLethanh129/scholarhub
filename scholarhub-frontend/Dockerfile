# GIAI ĐOẠN 1: Dùng Node.js để build ra thư mục /dist
FROM node:20-alpine as builder
WORKDIR /app

# Copy file cấu hình thư viện vào và cài đặt
COPY package*.json ./
RUN npm install

# Copy toàn bộ code và build
COPY . .
RUN npm run build

# GIAI ĐOẠN 2: Dùng Nginx để chạy bản build tĩnh
FROM nginx:alpine
# Xóa giao diện mặc định của Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copy thư mục dist từ Giai đoạn 1 sang ổ chứa của Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy file cấu hình Nginx (Sẽ tạo ở Bước 3)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]