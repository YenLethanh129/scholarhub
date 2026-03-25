import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  initUpload,
  getPresignedUrls,
  completeUpload,
  getUploadStatus,
} from "../api/upload";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import {
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  CheckCircle as CheckIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
}

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  currentFolderId?: string | null;
  currentFolderName?: string;
}

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

export function UploadModal({
  open,
  onClose,
  currentFolderId,
  currentFolderName,
}: UploadModalProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Clean up cache and reset state when dialog opens
  useEffect(() => {
    if (open) {
      // Reset uploadFiles list to avoid showing old uploads
      setUploadFiles([]);

      // Remove all stale upload cache from localStorage
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("upload_session_")) {
          localStorage.removeItem(key);
        }
      });
    }
  }, [open]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      addFiles(files);
    }
  };

  const addFiles = (files: File[]) => {
    const newUploadFiles: UploadFile[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: "pending",
    }));
    setUploadFiles((prev) => [...prev, ...newUploadFiles]);
  };

  const removeFile = (id: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const performUpload = async (fileId: string) => {
    const fileItem = uploadFiles.find((f) => f.id === fileId);
    if (!fileItem) return;
    const file = fileItem.file;

    setUploadFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: "uploading", progress: 0 } : f,
      ),
    );

    const fileCacheKey = `upload_session_${file.name}_${file.size}`;
    let uploadId: string | null = null;
    let objectKey: string | null = null;
    let uploadedParts: any[] = [];
    const totalParts = Math.ceil(file.size / CHUNK_SIZE);

    // Show loading toast
    const toastId = toast.loading(`Đang tải lên ${file.name}...`, {
      position: "bottom-right",
    });

    try {
      const savedSession = localStorage.getItem(fileCacheKey);
      if (savedSession) {
        const sessionData = JSON.parse(savedSession);
        try {
          const statusData = await getUploadStatus(
            sessionData.uploadId,
            sessionData.objectKey,
          );
          uploadId = statusData.uploadId;
          objectKey = statusData.objectKey;
          uploadedParts = statusData.uploadedParts || [];
        } catch (e) {
          localStorage.removeItem(fileCacheKey);
        }
      }

      if (!uploadId) {
        const initData = await initUpload(
          file.name,
          file.size,
          file.type || "application/octet-stream",
          currentFolderId || null,
        );
        uploadId = initData.uploadId;
        objectKey = initData.objectKey;
        localStorage.setItem(
          fileCacheKey,
          JSON.stringify({ uploadId, objectKey }),
        );
      }

      const missingParts: number[] = [];
      for (let i = 1; i <= totalParts; i++) {
        if (!uploadedParts.find((p) => p.partNumber === i)) {
          missingParts.push(i);
        }
      }

      let presignedUrls: Record<string, string> = {};
      if (missingParts.length > 0) {
        presignedUrls = await getPresignedUrls(
          uploadId!,
          objectKey!,
          missingParts,
        );
      }

      let successCount = uploadedParts.length;
      let progress = Math.round((successCount / totalParts) * 100);
      setUploadFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, progress } : f)),
      );

      for (let i = 0; i < totalParts; i++) {
        const partNumber = i + 1;
        if (uploadedParts.find((p) => p.partNumber === partNumber)) {
          continue;
        }

        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const uploadUrl = presignedUrls[partNumber];
        const putRes = await fetch(uploadUrl, {
          method: "PUT",
          body: chunk,
        });
        if (!putRes.ok) throw new Error(`Lỗi up mảnh ${partNumber}`);

        const eTag = putRes.headers.get("ETag") || "";
        uploadedParts.push({ partNumber, eTag });

        successCount++;
        progress = Math.round((successCount / totalParts) * 100);
        setUploadFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, progress } : f)),
        );

        // Update toast with progress
        toast.loading(`Đang tải lên ${file.name}... ${progress}%`, {
          id: toastId,
          position: "bottom-right",
        });
      }

      uploadedParts.sort((a, b) => a.partNumber - b.partNumber);
      await completeUpload(
        uploadId!,
        objectKey!,
        file.name,
        "Uploaded via Explorer",
        uploadedParts,
      );
      localStorage.removeItem(fileCacheKey);

      // Update file to completed state
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, progress: 100, status: "completed" } : f,
        ),
      );

      // Show success toast with close option
      toast.success(`${file.name} tải lên thành công!`, {
        id: toastId,
        position: "bottom-right",
        action: {
          label: "Đóng",
          onClick: () => toast.dismiss(toastId),
        },
      });

      // Auto-remove completed file after 1 second
      setTimeout(() => {
        setUploadFiles((prev) => prev.filter((f) => f.id !== fileId));
      }, 1000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Upload failed";

      setUploadFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, status: "error" } : f)),
      );

      // Show error toast
      toast.error(`Lỗi tải lên ${file.name}: ${errorMsg}`, {
        id: toastId,
        position: "bottom-right",
        action: {
          label: "Đóng",
          onClick: () => toast.dismiss(toastId),
        },
      });
    }
  };

  const handleUploadAll = () => {
    const filesToUpload = uploadFiles.filter(
      (f) => f.status === "pending" || f.status === "error",
    );

    if (filesToUpload.length === 0) return;

    // Start all uploads
    for (const f of filesToUpload) {
      performUpload(f.id);
    }

    // Close the dialog immediately
    handleClose();
  };

  const handleClose = () => {
    const isUploading = uploadFiles.some((f) => f.status === "uploading");
    if (
      isUploading &&
      !confirm("Đang có file upload. Bạn có muốn đóng không?")
    ) {
      return;
    }
    setUploadFiles([]);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Tải Lên Tài Liệu
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        {currentFolderName && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Uploading to: {currentFolderName}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        {/* Drop Zone */}
        <Box
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            border: "2px dashed",
            borderColor: isDragging ? "primary.main" : "#d1d5db",
            borderRadius: 2,
            p: 4,
            textAlign: "center",
            bgcolor: isDragging ? "primary.50" : "#f9fafb",
            transition: "all 0.2s",
            cursor: "pointer",
            mb: 3,
          }}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <UploadIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Drag and drop files here
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            or click to browse
          </Typography>
          <Button variant="outlined" component="span">
            Browse Files
          </Button>
          <input
            id="file-input"
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
        </Box>

        {/* File List */}
        {uploadFiles.length > 0 && (
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Files ({uploadFiles.length})
            </Typography>
            <List>
              {uploadFiles.map((uploadFile) => (
                <ListItem
                  key={uploadFile.id}
                  sx={{
                    bgcolor: "#f9fafb",
                    borderRadius: 1,
                    mb: 1,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <ListItemIcon>
                    {uploadFile.status === "completed" ? (
                      <CheckIcon color="success" />
                    ) : (
                      <FileIcon color="action" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={uploadFile.file.name}
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(uploadFile.file.size)}
                        </Typography>
                        {uploadFile.status === "uploading" && (
                          <Box sx={{ mt: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={uploadFile.progress}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ mt: 0.5 }}
                            >
                              {Math.round(uploadFile.progress)}%
                            </Typography>
                          </Box>
                        )}
                        {uploadFile.status === "completed" && (
                          <Typography
                            variant="caption"
                            color="success.main"
                            sx={{ display: "block", mt: 0.5 }}
                          >
                            Upload completed
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    {uploadFile.status !== "uploading" && (
                      <IconButton
                        edge="end"
                        onClick={() => removeFile(uploadFile.id)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} variant="outlined">
          Đóng
        </Button>
        <Button
          onClick={handleUploadAll}
          variant="contained"
          color="success"
          disabled={
            uploadFiles.length === 0 ||
            uploadFiles.every(
              (f) => f.status === "completed" || f.status === "uploading",
            )
          }
        >
          Tải lên
        </Button>
      </DialogActions>
    </Dialog>
  );
}
