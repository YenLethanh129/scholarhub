import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { toast } from "sonner";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Paper,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  Description as FileIcon,
} from "@mui/icons-material";
import { MaterialService } from "../services/MaterialService";
import { FilePreview } from "../components/FilePreview";
import type { Material } from "../models/Material";

const materialService = new MaterialService();

export function MediaViewerPage() {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState =
    (location.state as {
      returnTo?: string;
      searchQuery?: string;
      currentFolder?: string;
      folderPath?: Array<{ id: string; name: string }>;
    }) || {};

  const [fileData, setFileData] = useState<MaterialDetail | null>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if (!fileId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [detail, vUrl] = await Promise.all([
          materialService.getDetail(fileId),
          materialService.getViewUrl(fileId),
        ]);
        if (cancelled) return;

        setFileData(detail);
        setViewUrl(vUrl);
      } catch (e) {
        if (cancelled) return;
        const errorMsg = e instanceof Error ? e.message : String(e);

        setError(errorMsg || "Không thể tải file");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fileId]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !fileData) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error || "File not found"}</Alert>
        <Box sx={{ mt: 2 }}>
          <IconButton onClick={() => navigate(-1)}>
            <BackIcon />
          </IconButton>
        </Box>
      </Box>
    );
  }

  const fileType = (fileData.type || "").toLowerCase();

  const formatSize = (bytes?: number): string => {
    if (!bytes) return "—";
    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      const kb = bytes / 1024;
      return `${kb.toFixed(1)} KB`;
    } else if (mb < 1024) {
      return `${mb.toFixed(1)} MB`;
    } else {
      const gb = mb / 1024;
      return `${gb.toFixed(1)} GB`;
    }
  };

  const handleDownload = async () => {
    if (!fileId) return;
    try {
      setDownloadLoading(true);
      const dUrl = await getViewUrl(fileId);
      if (dUrl) {
        window.open(dUrl, "_blank");
      }
    } catch (err) {
      alert("Không thể tải xuống file");
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleEditClick = () => {
    if (fileData) {
      setEditTitle(fileData.title);
      setEditDescription(fileData.description || "");
      setEditDialogOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!fileId || !fileData) return;

    try {
      setEditLoading(true);
      const updatedData = await materialService.update(
        fileId,
        editTitle,
        editDescription || null,
      );
      // Update file data with returned response instead of reloading
      setFileData((prev) => (prev ? { ...prev, ...updatedData } : updatedData));
      setEditDialogOpen(false);
      toast.success("File updated successfully!");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update file";
      toast.error(errorMsg);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "#f3f4f6",
      }}
    >
      {/* Top Bar */}
      <AppBar
        position="static"
        sx={{ bgcolor: "white", color: "text.primary", boxShadow: 1 }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => {
              // If there's a return path with search query, navigate to search with query
              if (
                navigationState.returnTo === "/search" &&
                navigationState.searchQuery
              ) {
                navigate(
                  `/search?q=${encodeURIComponent(navigationState.searchQuery)}`,
                );
              }
              // If there's a return path to explorer, navigate back to explorer
              else if (navigationState.returnTo === "/explorer") {
                navigate("/explorer", {
                  state: {
                    currentFolder: navigationState.currentFolder,
                    folderPath: navigationState.folderPath,
                  },
                });
              }
              // Default: use browser back
              else {
                navigate(-1);
              }
            }}
            sx={{ mr: 2 }}
          >
            <BackIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: 600 }}
          >
            {fileData.title}
          </Typography>
          <IconButton onClick={handleEditClick} title="Edit file">
            <EditIcon />
          </IconButton>
          <IconButton onClick={handleDownload} disabled={downloadLoading}>
            <DownloadIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box
        sx={{
          display: "flex",
          flexGrow: 1,
          overflow: "hidden",
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        {/* Viewer Area (70%) */}
        <Box
          sx={{
            flex: { xs: "1", md: "0 0 70%" },
            display: "flex",
            flexDirection: "column",
            p: { xs: 2, md: 3 },
            bgcolor: "#f3f4f6",
            overflow: "auto",
          }}
        >
          {viewUrl && (
            <FilePreview
              fileId={fileId || ""}
              fileName={fileData.title || "File"}
              fileType={fileType}
              viewUrl={viewUrl}
            />
          )}
        </Box>

        {/* Metadata Sidebar (30%) */}
        <Box
          sx={{
            flex: "0 0 30%",
            bgcolor: "white",
            p: 3,
            overflowY: "auto",
            borderLeft: "1px solid #e5e7eb",
          }}
        >
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Thông tin tài liệu
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* Description */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Mô tả
            </Typography>
            <Typography variant="body2">
              {fileData.description || fileData.metadata || "—"}
            </Typography>
          </Box>

          {/* Metadata */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Dữ liệu chi tiết
            </Typography>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Kích thước
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {formatSize(fileData.size)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Ngày tải lên
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {fileData.createdAt
                    ? new Date(fileData.createdAt).toLocaleDateString()
                    : "—"}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Loại file
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {fileData.type || "—"}
                </Typography>
              </Box>

              {fileData.owner && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Người tải lên
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {fileData.owner.fullName || fileData.owner.username || "—"}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Tags */}
          {fileData.tags && fileData.tags.length > 0 && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Tags
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                  {fileData.tags.map((tag: string, index: number) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      sx={{
                        bgcolor: "#e0e7ff",
                        color: "#1e3a8a",
                        fontWeight: 500,
                      }}
                    />
                  ))}
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
            </>
          )}

          {/* File Actions Info */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Số lượng tải xuống
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {fileData.downloadCount ?? 0}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Edit File Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit File</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Title"
            fullWidth
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            margin="normal"
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={editLoading}
          >
            {editLoading ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
