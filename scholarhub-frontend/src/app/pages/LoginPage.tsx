import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
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
} from "@mui/icons-material";
import { AuthService } from "../services/AuthService";
import { SessionService } from "../services/SessionService";

const authService = new AuthService();
const sessionService = new SessionService();

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const redirectByRole = (userRole: string | undefined) => {
    navigate(userRole === "ADMIN" ? "/admin/dashboard" : "/search");
  };

  useEffect(() => {
    const checkSession = async () => {
      const token = sessionService.getStoredToken();
      const userData = sessionService.getStoredUser();

      if (token && userData && authService.isTokenValid(token)) {
        redirectByRole(userData.role);
        return;
      }

      const sessionData = await authService.verifySession();
      if (sessionData) {
        redirectByRole(sessionData.role);
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
      redirectByRole(userData.role);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Đăng nhập thất bại";
      
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
      {/* Left Side - Image and Branding */}
      <Box
        sx={{
          flex: 1,
          background: "linear-gradient(135deg, #1e3a8a 0%, #3b5998 100%)",
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
        {/* Background Image */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url('https://images.unsplash.com/photo-1595315343110-9b445a960442?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50cyUyMHN0dWR5aW5nJTIwbGlicmFyeXxlbnwxfHx8fDE3NzM5MTI1NjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.15,
          }}
        />

        {/* Content */}
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
              width: 120,
              height: 120,
              borderRadius: 3,
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
              mb: 4,
            }}
          >
            <Typography sx={{ fontSize: 48, fontWeight: 700 }}>SH</Typography>
          </Box>

          <Typography variant="h3" fontWeight={700} gutterBottom>
            ScholarHub
          </Typography>

          <Typography
            variant="h6"
            sx={{ opacity: 0.9, mt: 2, lineHeight: 1.6 }}
          >
            Nền tảng tra cứu tài liệu học tập thông minh cho học sinh và sinh
            viên.
          </Typography>

          <Box
            sx={{ mt: 6, display: "flex", gap: 4, justifyContent: "center" }}
          >
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h4" fontWeight={700}>
                10K+
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                Tài liệu
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h4" fontWeight={700}>
                5K+
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                Videos
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h4" fontWeight={700}>
                50K+
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                Sinh viên
              </Typography>
            </Box>
          </Box>
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
                background: "linear-gradient(135deg, #1e3a8a 0%, #3b5998 100%)",
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
              SH
            </Box>
            <Typography variant="h5" fontWeight={600} color="primary">
              ScholarHub
            </Typography>
          </Box>

          <Typography
            variant="h4"
            fontWeight={700}
            gutterBottom
            color="text.primary"
          >
            Chào mừng trở lại!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Đăng nhập vào tài khoản của bạn để tiếp tục tra cứu tài liệu học
            tập.
          </Typography>

          {/* Login Form */}
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

            <Box sx={{ textAlign: "right", mb: 3 }}>
              <Link
                href={import.meta.env.VITE_LINK_CONTACT}
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                sx={{ textDecoration: "none", color: "primary.main" }}
              >
                Quên mật khẩu?
              </Link>
            </Box>

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
                "Login"
              )}
            </Button>

            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="body2"
                color="text.secondary"
                component="span"
              >
                Chưa có tài khoản?{" "}
              </Typography>
              <Link
                href={import.meta.env.VITE_LINK_CONTACT}
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                sx={{ textDecoration: "none", color: "primary.main" }}
              >
                Liên hệ với giáo viên, nhà trường để được cấp tài khoản!
              </Link>
            </Box>
          </form>
        </Box>
      </Box>
    </Box>
  );
}
