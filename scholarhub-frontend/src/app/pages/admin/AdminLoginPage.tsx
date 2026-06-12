import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  AdminPanelSettings as AdminIcon,
} from "@mui/icons-material";
import { AuthService } from "../../services/AuthService";
import { SessionService } from "../../services/SessionService";

const authService = new AuthService();
const sessionService = new SessionService();

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const checkSession = async () => {
      const token = sessionService.getStoredToken();
      const userData = sessionService.getStoredUser();

      if (token && userData && userData.isAdmin && authService.isTokenValid(token)) {
        navigate("/admin/dashboard");
        return;
      }

      const sessionData = await authService.verifySession();
      if (sessionData?.isAdmin) {
        navigate("/admin/dashboard");
      }
    };

    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.email.trim() || !formData.password) {
      return;
    }

    setSubmitting(true);
    try {
      const userData = await authService.login({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (userData.role !== "ADMIN") {
        setErrorMessage("Bạn không có quyền truy cập trang quản trị.");
        return;
      }

      navigate("/admin/dashboard");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Đăng nhập thất bại";
      setErrorMessage(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        bgcolor: "#ffffff",
      }}
    >
      {/* Left Side - Admin Branding */}
      <Box
        sx={{
          flex: 1,
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          p: 6,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZG1pbiUyMG9mZmljZXxlbnwxfHx8fDE3NzM5MTI1NjV8MA&ixlib=rb-4.1.0&q=80&w=1080')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.1,
          }}
        />

        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            maxWidth: 500,
          }}
        >
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: 3,
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
              mb: 4,
            }}
          >
            <AdminIcon sx={{ fontSize: 48 }} />
          </Box>

          <Typography variant="h3" fontWeight={700} gutterBottom>
            ScholarHub Admin
          </Typography>

          <Typography
            variant="h6"
            sx={{ opacity: 0.8, mt: 2, lineHeight: 1.6, fontWeight: 400 }}
          >
            Trang quản trị hệ thống. Vui lòng đăng nhập bằng tài khoản quản trị
            viên để tiếp tục.
          </Typography>
        </Box>
      </Box>

      {/* Right Side - Login Form */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 4,
          bgcolor: "#f9fafb",
        }}
      >
        <Box sx={{ maxWidth: 420, width: "100%" }}>
          {/* Mobile Logo */}
          <Box
            sx={{
              display: { xs: "block", md: "none" },
              textAlign: "center",
              mb: 4,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold",
                fontSize: 24,
                margin: "0 auto",
                mb: 2,
              }}
            >
              AD
            </Box>
            <Typography variant="h5" fontWeight={600} color="primary">
              Admin Login
            </Typography>
          </Box>

          <Typography
            variant="h4"
            fontWeight={700}
            gutterBottom
            color="text.primary"
          >
            Đăng nhập quản trị
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Nhập thông tin tài khoản quản trị viên để truy cập bảng điều khiển.
          </Typography>

          <form onSubmit={handleSubmit}>
            {errorMessage ? (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
                onClose={() => setErrorMessage(null)}
              >
                {errorMessage}
              </Alert>
            ) : null}

            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              required
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Mật khẩu"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={submitting}
              sx={{
                mb: 3,
                py: 1.5,
                fontSize: 16,
              }}
            >
              {submitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Đăng nhập"
              )}
            </Button>

            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="body2"
                color="text.secondary"
                component="span"
              >
                Quay lại{" "}
              </Typography>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate("/")}
                sx={{ textTransform: "none", fontWeight: 500 }}
              >
                trang đăng nhập chính
              </Button>
            </Box>
          </form>
        </Box>
      </Box>
    </Box>
  );
}
