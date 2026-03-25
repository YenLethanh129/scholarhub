import React from "react";
import { useNavigate } from "react-router";
import { Box, Button, Typography, Container, Paper } from "@mui/material";
import { ErrorOutline as ErrorIcon } from "@mui/icons-material";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch React errors and display error page
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {}

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

/**
 * Fallback UI for error boundary
 */
function ErrorFallback({ error }: { error: Error | null }) {
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
            Ôi!
          </Typography>

          <Typography
            variant="h4"
            sx={{
              color: "#34495e",
              mb: 2,
              fontWeight: 600,
            }}
          >
            Đã Xảy Ra Lỗi
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "#7f8c8d",
              mb: 3,
              fontSize: 16,
              lineHeight: 1.6,
            }}
          >
            Xin lỗi, ứng dụng gặp sự cố không mong muốn. Chúng tôi đang làm việc
            để khắc phục vấn đề.
          </Typography>

          {error && (
            <Box
              sx={{
                backgroundColor: "#ecf0f1",
                padding: 2,
                borderRadius: 2,
                mb: 3,
                border: "1px solid #bdc3c7",
                textAlign: "left",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "#c0392b",
                  fontWeight: 600,
                  mb: 1,
                }}
              >
                Chi Tiết Lỗi:
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "#34495e",
                  fontFamily: "monospace",
                  fontSize: 12,
                  wordBreak: "break-word",
                }}
              >
                {error.message}
              </Typography>
            </Box>
          )}

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
              }}
            >
              Tải Lại Trang
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
            Scholar Hub
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
