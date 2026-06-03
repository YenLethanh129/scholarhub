import { useState, useRef, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress,
  Typography,
  Box,
  Alert,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from "@mui/material";
import {
  Close as CloseIcon,
  CheckCircle,
  ErrorOutline,
} from "@mui/icons-material";
import { toast } from "sonner";
import { UploadService } from "../services/UploadService";
import type { InitUploadRequest, CompleteUploadRequest } from "../models/Upload";

const uploadService = new UploadService();

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

interface UploadTask {
  file: File;
  folderId?: string;
  title?: string;
  description?: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
  uploadId?: string;
  objectKey?: string;
  uploadedParts?: Array<{ partNumber: number; eTag: string }>;
}

interface Props {
  open: boolean;
  onClose: () => void;
  folderId?: string;
  onUploadComplete?: () => void;
}

export function UploadManager({
  open,
  onClose,
  folderId,
  onUploadComplete,
}: Props) {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [toastIds, setToastIds] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up cache and reset state when dialog opens
  useEffect(() => {
    if (open) {
      // Reset tasks list to avoid showing old uploads
      setTasks([]);
      setToastIds({});

      // Remove all stale upload cache from localStorage
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("upload_session_")) {
          localStorage.removeItem(key);
        }
      });
    }
  }, [open]);

  const handleSelectFiles = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFilesSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      const newTasks: UploadTask[] = files.map((file) => ({
        file,
        folderId,
        title: file.name,
        progress: 0,
        status: "pending",
      }));

      setTasks((prev) => [...prev, ...newTasks]);
    },
    [folderId],
  );

  const uploadTask = useCallback(
    async (task: UploadTask) => {
      const { file } = task;
      const cacheKey = `upload_session_${file.name}_${file.size}`;
      const taskKey = `${file.name}_${file.size}`;

      // Show loading toast
      const toastId = toast.loading(`Đang tải lên ${file.name}...`, {
        position: "bottom-right",
      });

      setToastIds((prev) => ({ ...prev, [taskKey]: toastId as string }));

      setTasks((prev) =>
        prev.map((t) => (t === task ? { ...t, status: "uploading" } : t)),
      );

      try {
        const totalParts = Math.ceil(file.size / CHUNK_SIZE);
        let { uploadId, objectKey, uploadedParts = [] } = task;

        // Check for existing session in localStorage
        const savedSession = localStorage.getItem(cacheKey);
        if (savedSession && !uploadId) {
          const sessionData = JSON.parse(savedSession);
          try {
            const statusData = await uploadService.getStatus(
              sessionData.uploadId,
              sessionData.objectKey,
            );
            uploadId = statusData.uploadId;
            objectKey = statusData.objectKey;
            uploadedParts = statusData.uploadedParts || [];
          } catch {
            localStorage.removeItem(cacheKey);
          }
        }

        // Init upload if not exists
        if (!uploadId) {
          const initReq: InitUploadRequest = {
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type || "application/octet-stream",
            folderID: task.folderId || null,
          };
          const initData = await uploadService.initUpload(initReq);
          uploadId = initData.uploadId;
          objectKey = initData.objectKey;
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ uploadId, objectKey }),
          );
        }

        // Calculate missing parts
        const missingParts: number[] = [];
        for (let i = 1; i <= totalParts; i++) {
          if (!uploadedParts.find((p) => p.partNumber === i)) {
            missingParts.push(i);
          }
        }

        // Get presigned URLs for missing parts
        let presignedUrls: Record<number, string> = {};
        if (missingParts.length > 0) {
          presignedUrls = await uploadService.getPresignedUrls(
            uploadId,
            objectKey,
            missingParts,
          );
        }

        // Upload chunks
        for (let i = 0; i < totalParts; i++) {
          const partNumber = i + 1;

          const existingPart = uploadedParts.find(
            (p) => p.partNumber === partNumber,
          );
          if (existingPart) {
            const progress = Math.round((partNumber / totalParts) * 100);
            setTasks((prev) =>
              prev.map((t) => (t === task ? { ...t, progress } : t)),
            );
            // Update toast with progress
            toast.loading(`Đang tải lên ${file.name}... ${progress}%`, {
              id: toastId as string,
              position: "bottom-right",
            });
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

          if (!putRes.ok) throw new Error(`Upload chunk ${partNumber} failed`);

          const eTag = putRes.headers.get("ETag");
          if (!eTag) throw new Error(`No ETag for chunk ${partNumber}`);

          uploadedParts.push({ partNumber, eTag });

          const progress = Math.round(((i + 1) / totalParts) * 100);
          setTasks((prev) =>
            prev.map((t) => (t === task ? { ...t, progress } : t)),
          );

          // Update toast with progress
          toast.loading(`Đang tải lên ${file.name}... ${progress}%`, {
            id: toastId as string,
            position: "bottom-right",
          });
        }

        // Complete upload
        uploadedParts.sort((a, b) => a.partNumber - b.partNumber);

        const completeReq: CompleteUploadRequest = {
          uploadId,
          objectKey,
          title: task.title || file.name,
          description: task.description,
          folderId: task.folderId,
          parts: uploadedParts,
        };

        await uploadService.completeUpload(completeReq);

        localStorage.removeItem(cacheKey);

        // Update task to completed state
        setTasks((prev) =>
          prev.map((t) =>
            t === task ? { ...t, status: "completed", progress: 100 } : t,
          ),
        );

        // Show success toast with close option
        toast.success(`${file.name} tải lên thành công!`, {
          id: toastId as string,
          position: "bottom-right",
          action: {
            label: "Đóng",
            onClick: () => toast.dismiss(toastId as string),
          },
        });

        // Auto-remove completed file after 1 second
        setTimeout(() => {
          setTasks((prev) => prev.filter((t) => t !== task));
        }, 1000);

        onUploadComplete?.();
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Upload failed";
        setTasks((prev) =>
          prev.map((t) =>
            t === task
              ? {
                  ...t,
                  status: "error",
                  error: errorMsg,
                }
              : t,
          ),
        );

        // Show error toast
        toast.error(`Lỗi tải lên ${file.name}: ${errorMsg}`, {
          id: toastId as string,
          position: "bottom-right",
          action: {
            label: "Đóng",
            onClick: () => toast.dismiss(toastId as string),
          },
        });
      }
    },
    [onUploadComplete],
  );

  const removeTask = useCallback((task: UploadTask) => {
    setTasks((prev) => prev.filter((t) => t !== task));
  }, []);

  const handleUploadAll = useCallback(() => {
    const pendingTasks = tasks.filter((t) => t.status === "pending");
    if (pendingTasks.length === 0) return;

    // Start all uploads
    for (const task of pendingTasks) {
      uploadTask(task);
    }

    // Close the dialog immediately
    onClose();
  }, [tasks, uploadTask, onClose]);

  const handleClose = useCallback(() => {
    const hasUploading = tasks.some((t) => t.status === "uploading");
    if (
      hasUploading &&
      !confirm("Đang có file upload. Bạn có muốn đóng không?")
    ) {
      return;
    }
    setTasks([]);
    setToastIds({});
    onClose();
  }, [tasks, onClose]);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={handleFilesSelected}
      />

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Tải Lên Tài Liệu
          <IconButton
            onClick={handleClose}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {tasks.length === 0 ? (
            <Alert severity="info">Chọn file để upload</Alert>
          ) : (
            <List>
              {tasks.map((task, idx) => (
                <ListItem
                  key={idx}
                  secondaryAction={
                    task.status === "completed" || task.status === "error" ? (
                      <IconButton onClick={() => removeTask(task)}>
                        <CloseIcon />
                      </IconButton>
                    ) : null
                  }
                >
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {task.status === "completed" ? (
                          <CheckCircle color="success" />
                        ) : task.status === "error" ? (
                          <ErrorOutline color="error" />
                        ) : null}
                        <Typography>{task.file.name}</Typography>
                      </Box>
                    }
                    secondary={
                      <>
                        {task.status === "uploading" && (
                          <LinearProgress
                            variant="determinate"
                            value={task.progress}
                            sx={{ mt: 1 }}
                          />
                        )}
                        {task.status === "error" && (
                          <Typography variant="caption" color="error">
                            {task.error}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleSelectFiles} variant="contained">
            Chọn file
          </Button>
          <Button
            onClick={handleUploadAll}
            variant="contained"
            color="success"
            disabled={
              tasks.length === 0 || tasks.every((t) => t.status !== "pending")
            }
          >
            Tải lên
          </Button>
          <Button onClick={handleClose}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
