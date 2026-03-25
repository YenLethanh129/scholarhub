import { useNavigate } from "react-router";
import { Box, Button, Typography, Container, Paper } from "@mui/material";
import { BuildOutlined as BuildIcon } from "@mui/icons-material";

export function ServiceUnavailablePage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
            <BuildIcon
              sx={{
                fontSize: 80,
                color: "#3498db",
                animation: "rotate 2s linear infinite",
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
            503
          </Typography>

          <Typography
            variant="h4"
            sx={{
              color: "#34495e",
              mb: 2,
              fontWeight: 600,
            }}
          >
            Server Đang Bảo Trì
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
            Scholar Hub đang bảo trì hệ thống. Chúng tôi sẽ trở lại sớm. Xin lỗi
            vì sự bất tiện này!
          </Typography>

          <Box
            sx={{
              backgroundColor: "#ecf0f1",
              padding: 2.5,
              borderRadius: 2,
              mb: 4,
              border: "1px solid #bdc3c7",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: "#34495e",
                fontWeight: 600,
                mb: 1,
              }}
            >
              Thời gian bảo trì dự kiến: 30 phút
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#7f8c8d",
                display: "block",
              }}
            >
              Vui lòng quay lại sau.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button
              variant="contained"
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
                  boxShadow: "0 10px 25px rgba(102, 126, 234, 0.4)",
                },
              }}
            >
              Kiểm Tra Lại
            </Button>
            <Button
              variant="outlined"
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
                },
              }}
            >
              Về Trang Chủ
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
            Mã lỗi: 503 | Scholar Hub
          </Typography>

          <style>{`
            @keyframes rotate {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </Paper>
      </Container>
    </Box>
  );
}
