import { useNavigate } from "react-router";
import { Box, Button, Typography, Container, Paper } from "@mui/material";
import { BlockOutlined as BlockIcon } from "@mui/icons-material";

export function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            padding: { xs: 3, md: 4 },
            textAlign: "center",
            borderRadius: 3,
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}
        >
          <Box sx={{ mb: 3 }}>
            <BlockIcon
              sx={{
                fontSize: 80,
                color: "#e67e22",
                animation: "spin 2s linear infinite",
              }}
            />
          </Box>

          <Typography
            variant="h1"
            sx={{
              fontSize: 72,
              fontWeight: 700,
              color: "#2c3e50",
              mb: 1,
              letterSpacing: -2,
            }}
          >
            403
          </Typography>

          <Typography
            variant="h4"
            sx={{
              color: "#34495e",
              mb: 2,
              fontWeight: 600,
            }}
          >
            Truy Cập Bị Từ Chối
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "#7f8c8d",
              mb: 4,
              fontSize: 16,
              lineHeight: 1.6,
            }}
          >
            Bạn không có quyền truy cập tài nguyên này. Nếu bạn cho rằng đây là
            một lỗi, vui lòng liên hệ với quản trị viên.
          </Typography>

          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => navigate("/")}
              sx={{
                paddingX: 4,
                paddingY: 1.5,
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 2,
                textTransform: "none",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 10px 25px rgba(102, 126, 234, 0.4)",
                },
              }}
            >
              Về Trang Chủ
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={() => navigate(-1)}
              sx={{
                paddingX: 4,
                paddingY: 1.5,
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 2,
                textTransform: "none",
                "&:hover": {
                  transform: "translateY(-2px)",
                },
              }}
            >
              Quay Lại
            </Button>
          </Box>

          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: 4,
              color: "#bdc3c7",
            }}
          >
            Mã lỗi: 403 | Scholar Hub
          </Typography>

          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </Paper>
      </Container>
    </Box>
  );
}
