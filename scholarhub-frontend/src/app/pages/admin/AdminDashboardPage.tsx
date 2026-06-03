import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  Avatar,
  IconButton,
  Divider,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import {
  Logout as LogoutIcon,
  PersonAdd as PersonAddIcon,
  AdminPanelSettings as AdminIcon,
  School as SchoolIcon,
  People as PeopleIcon,
} from "@mui/icons-material";
import { toast } from "sonner";
import { AuthService } from "../../services/AuthService";
import { SessionService } from "../../services/SessionService";
import { ApiConfigService } from "../../services/ApiConfigService";
import type { User } from "../../models/User";

const authService = new AuthService();
const sessionService = new SessionService();
const apiConfig = new ApiConfigService();

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
  });

  useEffect(() => {
    const storedUser = sessionService.getStoredUser();
    if (!storedUser) {
      navigate("/");
      return;
    }
    if (!storedUser.isAdmin) {
      navigate("/");
      return;
    }
    setUser(storedUser);
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      navigate("/");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formData.username.trim() || !formData.email.trim() || !formData.password || !formData.fullName.trim()) {
      setErrorMessage("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (formData.username.length < 3) {
      setErrorMessage("Tên đăng nhập phải có ít nhất 3 ký tự");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${apiConfig.getApiBase()}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const text = await res.text();
      let body: Record<string, any> = { message: text };
      if (text) {
        try { body = JSON.parse(text); } catch { body = { message: text }; }
      }

      if (!res.ok) {
        throw new Error(body.message || `Đăng ký thất bại (${res.status})`);
      }

      setSuccessMessage(body.message || "Đăng ký thành công! Vui lòng đăng nhập.");
      toast.success("Tạo tài khoản thành công!");
      setFormData({ username: "", email: "", password: "", fullName: "" });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Đăng ký thất bại";
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", bgcolor: "#f3f4f6" }}>
      <AppBar position="static" sx={{ bgcolor: "white", color: "text.primary", boxShadow: 1 }}>
        <Toolbar>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1,
              background: "linear-gradient(135deg, #1e3a8a 0%, #3b5998 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "bold",
              mr: 2,
            }}
          >
            SH
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "primary.main", flexGrow: 1 }}>
            ScholarHub Admin
          </Typography>

          {user && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mr: 2 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main" }}>
                {user.fullName.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="body2" sx={{ display: { xs: "none", sm: "block" } }}>
                {user.fullName}
              </Typography>
            </Box>
          )}

          <IconButton onClick={handleLogout} sx={{ color: "text.secondary" }}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, width: "100%", mx: "auto" }}>
        <Typography variant="h4" fontWeight={700} gutterBottom sx={{ mb: 1 }}>
          Bảng Điều Khiển
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Quản lý người dùng và hệ thống ScholarHub
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                <PersonAddIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Tạo Người Dùng Mới
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
                  {successMessage}
                </Alert>
              )}

              {errorMessage && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
                  {errorMessage}
                </Alert>
              )}

              <Box component="form" onSubmit={handleRegister}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Tên đăng nhập"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      inputProps={{ minLength: 3, maxLength: 50 }}
                      helperText="3-50 ký tự"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Họ và tên"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      inputProps={{ minLength: 3, maxLength: 100 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Mật khẩu"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      inputProps={{ minLength: 6 }}
                      helperText="Ít nhất 6 ký tự"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={submitting}
                      startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <PersonAddIcon />}
                      sx={{ mt: 1, px: 4, py: 1.5 }}
                    >
                      {submitting ? "Đang xử lý..." : "Tạo Người Dùng"}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: "#e0e7ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AdminIcon sx={{ color: "#1e3a8a" }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Vai trò
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      Quản Trị Viên
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <PeopleIcon color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {user?.fullName || "Administrator"}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Hướng dẫn
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  Sử dụng biểu mẫu bên cạnh để tạo tài khoản mới cho giáo viên và sinh viên.
                  Tài khoản mới sẽ có thể đăng nhập ngay sau khi được tạo.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
