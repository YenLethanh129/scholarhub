import { useNavigate } from "react-router";
import { Box, Button, Typography, Container, Paper } from "@mui/material";
import { ErrorOutline as ErrorIcon } from "@mui/icons-material";

export function ServerErrorPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #eb3349 0%, #f45c43 100%)",
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
            <ErrorIcon
              sx={{
                fontSize: 80,
                color: "#c0392b",
                animation: "bounce 2s ease-in-out infinite",
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
            500
          </Typography>

          <Typography
            variant="h4"
            sx={{
              color: "#34495e",
              mb: 2,
              fontWeight: 600,
            }}
          >
            Lỗi Máy Chủ Nội Bộ
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
            Xin lỗi, máy chủ gặp sự cố. Chúng tôi đang làm việc để khắc phục vấn
            đề này. Vui lòng thử lại sau.
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
              onClick={() => window.location.reload()}
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
              Tải Lại Trang
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
            Mã lỗi: 500 | Scholar Hub
          </Typography>

          <style>{`
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-20px); }
            }
          `}</style>
        </Paper>
      </Container>
    </Box>
  );
}
