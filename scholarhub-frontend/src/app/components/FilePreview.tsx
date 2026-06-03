import { useState, useEffect } from "react";
import {
  Box,
  CircularProgress,
  Alert,
  Typography,
  Button,
  Paper,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { MaterialService } from "../services/MaterialService";

const materialService = new MaterialService();

interface FilePreviewProps {
  fileId: string;
  fileName: string;
  fileType: string;
  viewUrl: string;
}

export function FilePreview({
  fileId,
  fileName,
  fileType,
  viewUrl,
}: FilePreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Normalize and detect file type
  const normalizedType = fileType.toLowerCase().replace(/\./g, "");

  // Get file extension from fileName
  const fileExtension = fileName.toLowerCase().split(".").pop() || "";

  // Determine file category from both backend type and file extension
  const getFileCategory = () => {
    // Check backend type first
    if (normalizedType === "video") return "video";
    if (normalizedType === "image") return "image";
    if (normalizedType === "pdf") return "pdf";
    if (normalizedType === "document") return "document";

    // Check extension
    if (
      ["mp4", "webm", "mkv", "avi", "mov", "flv", "m4v"].includes(fileExtension)
    )
      return "video";
    if (
      ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(
        fileExtension,
      )
    )
      return "image";
    if (["pdf"].includes(fileExtension)) return "pdf";
    if (["docx", "doc", "xlsx", "xls", "pptx", "ppt"].includes(fileExtension))
      return "document";

    return "unknown";
  };

  const fileCategory = getFileCategory();

  useEffect(() => {
    const loadPreview = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!viewUrl) {
          setError("URL xem trước không có sẵn");
          setLoading(false);
          return;
        }

        // PDF & Document: Fetch blob từ viewUrl
        if (fileCategory === "pdf" || fileCategory === "document") {
          try {
            const response = await fetch(viewUrl, {
              method: "GET",
              credentials: "include",
            });

            if (!response.ok) {
              setError(`Không thể tải file (${response.status})`);
              setLoading(false);
              return;
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setBlobUrl(url);
          } catch (err) {
            setError(
              "Lỗi khi tải file: " +
                (err instanceof Error ? err.message : "Unknown error"),
            );
            setLoading(false);
            return;
          }
        }

        setLoading(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Lỗi khi tải xem trước file",
        );
        setLoading(false);
      }
    };

    loadPreview();

    // Cleanup
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [viewUrl, fileId, fileCategory]);

  const handleDownload = async () => {
    try {
      setDownloadLoading(true);
      const dUrl = await materialService.getDownloadUrl(fileId);
      if (dUrl) {
        window.open(dUrl, "_blank");
      }
    } catch (err) {
      alert("Không thể tải xuống file");
    } finally {
      setDownloadLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <ErrorIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          {error}
        </Alert>
      </Box>
    );
  }

  // === PDF Preview ===
  if (fileCategory === "pdf") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6">{fileName}</Typography>
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            variant="contained"
          >
            Tải xuống
          </Button>
        </Box>
        <Box
          sx={{
            flex: 1,
            border: "1px solid #e5e7eb",
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          {blobUrl && (
            <iframe
              src={blobUrl}
              width="100%"
              height="100%"
              style={{ border: "none" }}
              title={`Preview: ${fileName}`}
            />
          )}
        </Box>
      </Box>
    );
  }

  // === Document Preview (DOCX, PPTX, etc. converted to PDF) ===
  if (fileCategory === "document") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6">{fileName}</Typography>
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            variant="contained"
          >
            Tải xuống
          </Button>
        </Box>
        <Box
          sx={{
            flex: 1,
            border: "1px solid #e5e7eb",
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          {blobUrl && (
            <iframe
              src={blobUrl}
              width="100%"
              height="100%"
              style={{ border: "none" }}
              title={`Preview: ${fileName}`}
            />
          )}
        </Box>
      </Box>
    );
  }

  // === Video Preview ===
  if (fileCategory === "video") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6">{fileName}</Typography>
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            variant="contained"
            disabled={downloadLoading}
          >
            {downloadLoading ? "\u0110ang xờ lý..." : "Tải xuống"}
          </Button>
        </Box>
        <Box
          sx={{
            flex: 1,
            bgcolor: "#000",
            borderRadius: 1,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <video
            src={viewUrl}
            controls
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
            title={`Preview: ${fileName}`}
          />
        </Box>
      </Box>
    );
  }

  // === Image Preview ===
  if (fileCategory === "image") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6">{fileName}</Typography>
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            variant="contained"
          >
            Tải xuống
          </Button>
        </Box>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#f3f4f6",
            borderRadius: 1,
            overflow: "auto",
            border: "1px solid #e5e7eb",
          }}
        >
          <img
            src={viewUrl}
            alt={fileName}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
          />
        </Box>
      </Box>
    );
  }

  // === Fallback for unknown types ===
  const handleDownloadBlob = () => {
    // Create a temporary download link for the blob
    const element = document.createElement("a");
    if (blobUrl) {
      element.href = blobUrl;
      element.download = fileName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } else {
      handleDownload();
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6">{fileName}</Typography>
        <Button
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          variant="contained"
          disabled={downloadLoading}
        >
          {downloadLoading ? "\u0110ang xờ lý..." : "Tải xuống"}
        </Button>
      </Box>

      <Paper
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 4,
          bgcolor: "#f9fafb",
          border: "2px dashed #d1d5db",
          borderRadius: 2,
        }}
      >
        <DocIcon sx={{ fontSize: 64, color: "#6b7280", mb: 2 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>
          Định dạng file không được hỗ trợ xem trước
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Loại file: {fileType}
        </Typography>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          disabled={downloadLoading}
        >
          {downloadLoading ? "\u0110ang xờ lý..." : "Tải xuống File"}
        </Button>
      </Paper>
    </Box>
  );
}
