import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { toast } from "sonner";
import {
  getClipboardItem,
  setClipboardItem,
  clearClipboard,
  hasClipboardItem,
  isClipboardFile,
  isClipboardFolder,
} from "../utils/clipboard";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Breadcrumbs,
  Link,
  Card,
  CardActionArea,
  CardContent,
  Menu,
  MenuItem,
  Divider,
  InputBase,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  PictureAsPdf,
  VideoLibrary,
  Image as ImageIcon,
  Article,
  Description as FileIcon,
  Logout as LogoutIcon,
  ExpandMore,
  ChevronRight,
  Search as SearchIcon,
  Home as HomeIcon,
  Menu as MenuIcon,
  ContentCut as MoveIcon,
  ContentPaste as PasteIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { UploadManager } from "../components/UploadManager";
import { FolderItem, FileItem } from "../components/FolderTree";
import {
  getFolderTree,
  getFolderContents,
  createFolder,
  deleteFolder,
  moveFolder,
} from "../api/folders";
import {
  moveMaterial,
  updateMaterial,
  getDownloadUrl,
  deleteMaterial,
} from "../api/materials";
import { logout as apiLogout } from "../api/auth";

const DRAWER_WIDTH = 280;

interface CurrentView {
  folderId: string;
  path: Array<{ id: string; name: string }>;
}

function getFileIcon(type: string, size: number = 48) {
  const iconProps = { sx: { fontSize: size } };
  switch (type) {
    case "pdf":
      return (
        <PictureAsPdf
          {...iconProps}
          sx={{ fontSize: size, color: "#dc2626" }}
        />
      );
    case "docx":
      return (
        <Article {...iconProps} sx={{ fontSize: size, color: "#1e3a8a" }} />
      );
    case "pptx":
      return (
        <FileIcon {...iconProps} sx={{ fontSize: size, color: "#fb923c" }} />
      );
    case "video":
      return (
        <VideoLibrary
          {...iconProps}
          sx={{ fontSize: size, color: "#7c3aed" }}
        />
      );
    case "image":
      return (
        <ImageIcon {...iconProps} sx={{ fontSize: size, color: "#059669" }} />
      );
    default:
      return (
        <FileIcon {...iconProps} sx={{ fontSize: size, color: "#6b7280" }} />
      );
  }
}

function FolderTreeNode({
  folder,
  level = 0,
  onFolderClick,
  onFolderContextMenu,
  onDragStart,
  onDragOver,
  onDrop,
  selectedId,
}: {
  folder: FolderItem;
  level?: number;
  onFolderClick: (folder: FolderItem) => void;
  onFolderContextMenu?: (event: React.MouseEvent, folder: FolderItem) => void;
  onDragStart?: (event: React.DragEvent, folder: FolderItem) => void;
  onDragOver?: (event: React.DragEvent, folder: FolderItem) => void;
  onDrop?: (event: React.DragEvent, folder: FolderItem) => void;
  selectedId?: string;
}) {
  const [open, setOpen] = useState(level === 0);
  const [dragOver, setDragOver] = useState(false);

  const handleToggle = () => {
    setOpen(!open);
  };

  const hasChildren = folder.children && folder.children.length > 0;

  return (
    <>
      <ListItem
        disablePadding
        draggable
        onDragStart={(e) => onDragStart?.(e, folder)}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
          onDragOver?.(e, folder);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onDrop?.(e, folder);
        }}
        onContextMenu={(e) => onFolderContextMenu?.(e, folder)}
        sx={{
          bgcolor: dragOver ? "action.hover" : undefined,
          transition: "background-color 0.2s",
        }}
      >
        <ListItemButton
          onClick={() => {
            if (hasChildren) {
              handleToggle();
            }
            onFolderClick(folder);
          }}
          selected={selectedId === folder.id}
          sx={{ pl: 2 + level * 2 }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            {hasChildren ? open ? <ExpandMore /> : <ChevronRight /> : null}
          </ListItemIcon>
          <ListItemIcon sx={{ minWidth: 36 }}>
            {open ? (
              <FolderOpenIcon sx={{ color: "#fb923c" }} />
            ) : (
              <FolderIcon sx={{ color: "#fbbf24" }} />
            )}
          </ListItemIcon>
          <ListItemText
            primary={folder.name}
            primaryTypographyProps={{ fontSize: 14 }}
          />
        </ListItemButton>
      </ListItem>

      {hasChildren && open && (
        <List disablePadding>
          {folder.children!.map((child) => (
            <FolderTreeNode
              key={child.id}
              folder={child}
              level={level + 1}
              onFolderClick={onFolderClick}
              onFolderContextMenu={onFolderContextMenu}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              selectedId={selectedId}
            />
          ))}
        </List>
      )}
    </>
  );
}

export function ExplorerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState =
    (location.state as {
      currentFolder?: string;
      folderPath?: Array<{ id: string; name: string }>;
    }) || {};

  const [user, setUser] = useState<{ name: string } | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [folderTree, setFolderTree] = useState<FolderItem[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [contentsLoading, setContentsLoading] = useState(false);
  const [subfolders, setSubfolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentView, setCurrentView] = useState<CurrentView>({
    folderId: "root",
    path: [
      { id: "library", name: "" },
      { id: "root", name: "Thư Viện" },
    ],
  });
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    item: any;
    type:
      | "background"
      | "folderTree"
      | "contentFolder"
      | "contentFile"
      | "treeBackground";
  } | null>(null);
  const [draggedFolder, setDraggedFolder] = useState<FolderItem | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0); // Trigger for reload

  // File operations state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<FileItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [renameValue, setRenameValue] = useState("");

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    type: "file" | "folder";
  } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user_data");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/");
    }

    // Restore folder view from navigation state (e.g., coming back from file viewer)
    if (navigationState.folderPath && navigationState.currentFolder) {
      // Ensure library item is at the beginning if not already there
      const restoredPath = navigationState.folderPath;
      if (
        restoredPath &&
        restoredPath.length > 0 &&
        restoredPath[0].id !== "library"
      ) {
        restoredPath.unshift({ id: "library", name: "" });
      }
      setCurrentView({
        folderId: navigationState.currentFolder,
        path: restoredPath || [
          { id: "library", name: "" },
          { id: "root", name: "Thư Viện" },
        ],
      });
    }
  }, [navigate, navigationState.folderPath, navigationState.currentFolder]);

  const handleLogout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      localStorage.removeItem("scholar_hub_token");
      localStorage.removeItem("JWT_TOKENT");
      // Best-effort xóa cookie nếu BE không set HttpOnly.
      document.cookie = "JWT_TOKENT=; Max-Age=0; path=/;";
      navigate("/");
    }
  }, [navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const buildPath = (
    folders: FolderItem[],
    targetId: string,
    currentPath: Array<{ id: string; name: string }> = [],
  ): Array<{ id: string; name: string }> | null => {
    for (const folder of folders) {
      const newPath = [...currentPath, { id: folder.id, name: folder.name }];
      if (folder.id === targetId) return newPath;
      if (folder.children) {
        const found = buildPath(folder.children, targetId, newPath);
        if (found) return found;
      }
    }
    return null;
  };

  const handleFolderClick = (folder: FolderItem) => {
    let path = buildPath(folderTree, folder.id);
    if (!path) {
      path = [...currentView.path, { id: folder.id, name: folder.name }].filter(
        (item, idx, arr) => arr.findIndex((x) => x.id === item.id) === idx,
      );
    }
    // Ensure library item is at the beginning
    if (path && path[0]?.id !== "library") {
      path.unshift({ id: "library", name: "" });
    }
    setCurrentView({
      folderId: folder.id,
      path: path || currentView.path,
    });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setTreeLoading(true);
      try {
        const tree = await getFolderTree();
        if (cancelled) return;
        setFolderTree(tree);
      } catch (e) {
        const status = (e as { status?: number }).status;
        if (status === 401) {
          await handleLogout();
          return;
        }
        if (!cancelled) setFolderTree([]);
      } finally {
        if (!cancelled) setTreeLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [handleLogout, reloadTrigger]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setContentsLoading(true);
      try {
        const { folders, files } = await getFolderContents(
          currentView.folderId,
        );
        if (cancelled) return;
        setSubfolders(folders);
        setFiles(files);
      } catch (e) {
        const status = (e as { status?: number }).status;
        if (status === 401) {
          await handleLogout();
          return;
        }
        if (!cancelled) {
          setSubfolders([]);
          setFiles([]);
        }
      } finally {
        if (!cancelled) setContentsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentView.folderId, handleLogout]);

  const handleContextMenu = (
    event: React.MouseEvent,
    item: any,
    type: "contentFolder" | "contentFile" | "folderTree",
  ) => {
    event.preventDefault();
    event.stopPropagation();
    // Close previous menu immediately before opening new one
    setContextMenu(null);
    // Use setTimeout to ensure menu is properly closed and reopened
    setTimeout(() => {
      setContextMenu({
        mouseX: event.clientX - 2,
        mouseY: event.clientY - 4,
        item,
        type,
      });
    }, 0);
    return false;
  };

  const handleBackgroundContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    // Close previous menu immediately before opening new one
    setContextMenu(null);
    // Use setTimeout to ensure menu is properly closed and reopened
    setTimeout(() => {
      setContextMenu({
        mouseX: event.clientX - 2,
        mouseY: event.clientY - 4,
        item: null,
        type: "background",
      });
    }, 0);
    return false;
  };

  const handleTreeBackgroundContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    // Close previous menu immediately before opening new one
    setContextMenu(null);
    // Use setTimeout to ensure menu is properly closed and reopened
    setTimeout(() => {
      setContextMenu({
        mouseX: event.clientX - 2,
        mouseY: event.clientY - 4,
        item: null,
        type: "treeBackground",
      });
    }, 0);
    return false;
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleCreateFolder = async () => {
    const name = prompt("Enter folder name:");
    if (name) {
      try {
        const parentId =
          currentView.folderId === "root" ? undefined : currentView.folderId;
        await createFolder(name, parentId);
        toast.success("Scholar Hub thông báo: Thư mục đã tạo thành công!");
        setReloadTrigger((prev) => prev + 1);
      } catch (err) {
        toast.error("Scholar Hub thông báo: Tạo thư mục thất bại");
      }
    }
    handleCloseContextMenu();
  };

  const handleTreeCreateFolder = async () => {
    if (!contextMenu?.item) return;
    const folder = contextMenu.item as FolderItem;
    const name = prompt(`Create folder inside '${folder.name}':`);
    if (name) {
      try {
        await createFolder(name, folder.id);
        toast.success("Scholar Hub thông báo: Thư mục đã tạo thành công!");
        setReloadTrigger((prev) => prev + 1);
      } catch (err) {
        toast.error("Scholar Hub thông báo: Tạo thư mục thất bại");
      }
    }
    handleCloseContextMenu();
  };

  const handleTreeRootCreateFolder = async () => {
    const name = prompt("Create root folder name:");
    if (name) {
      try {
        await createFolder(name, null);
        toast.success("Scholar Hub thông báo: Thư mục gốc đã tạo thành công!");
        setReloadTrigger((prev) => prev + 1);
      } catch (err) {
        toast.error("Scholar Hub thông báo: Tạo thư mục thất bại");
      }
    }
    handleCloseContextMenu();
  };

  const handleDeleteFolder = async () => {
    if (!contextMenu?.item) return;
    const folder = contextMenu.item as FolderItem;
    setDeleteTarget({
      id: folder.id,
      name: folder.name,
      type: "folder",
    });
    setDeleteDialogOpen(true);
    handleCloseContextMenu();
  };

  const handleDeleteFile = async () => {
    if (!contextMenu?.item) return;
    const file = contextMenu.item as FileItem;
    setDeleteTarget({
      id: file.id,
      name: file.name,
      type: "file",
    });
    setDeleteDialogOpen(true);
    handleCloseContextMenu();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === "folder") {
        await deleteFolder(deleteTarget.id);
        toast.success(
          `Scholar Hub thông báo: Thư mục '${deleteTarget.name}' đã xóa thành công`,
          {
            duration: 3000,
          },
        );
        setReloadTrigger((prev) => prev + 1);
      } else {
        await deleteMaterial(deleteTarget.id);
        toast.success(
          `Scholar Hub thông báo: Tệp '${deleteTarget.name}' đã xóa thành công`,
          {
            duration: 3000,
          },
        );
        setFiles((prevFiles) =>
          prevFiles.filter((f) => f.id !== deleteTarget.id),
        );
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Lỗi không xác định";
      toast.error(`Scholar Hub thông báo: Xóa thất bại - ${errorMsg}`, {
        duration: 3000,
      });
    }

    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const handleMoveFolder = async () => {
    if (!contextMenu?.item) return;
    const folder = contextMenu.item as FolderItem;

    // Copy folder to clipboard
    setClipboardItem(folder.id, folder.name, "folder", "move");
    toast.success(`Scholar Hub thông báo: '${folder.name}' đã sao chép`, {
      description: "Sẵn sàng để di chuyển - sử dụng Dán. Hết hạn trong 5 phút",
    });
    handleCloseContextMenu();
  };

  const handlePasteFolder = async () => {
    const clipboardItem = getClipboardItem();
    if (!clipboardItem) {
      toast.error("Scholar Hub thông báo: Không có gì để dán");
      return;
    }

    const targetFolderId = currentView.folderId;
    if (clipboardItem.id === targetFolderId) {
      toast.error(
        "Scholar Hub thông báo: Không thể di chuyển thư mục vào chính nó",
      );
      return;
    }

    try {
      await moveFolder(clipboardItem.id, targetFolderId);
      clearClipboard();
      toast.success(
        `Scholar Hub thông báo: '${clipboardItem.name}' đã di chuyển đến '${
          currentView.path[currentView.path.length - 1].name
        }'`,
      );

      // Reload both folder tree and contents of current folder (same as handlePasteFile)
      try {
        const tree = await getFolderTree();
        setFolderTree(tree);

        const { folders, files } = await getFolderContents(targetFolderId);
        setSubfolders(folders);
        setFiles(files);
      } catch (err) {
        // Fallback to full reload if partial reload fails
        setReloadTrigger((prev) => prev + 1);
      }
    } catch (err) {
      toast.error("Scholar Hub thông báo: Không thể di chuyển thư mục");
    }
    handleCloseContextMenu();
  };

  // File operation handlers
  const handleMoveFile = async () => {
    if (!contextMenu?.item) return;
    const file = contextMenu.item as FileItem;

    // Copy file to clipboard
    setClipboardItem(file.id, file.name, "file", "move");
    toast.success(`Scholar Hub thông báo: '${file.name}' đã sao chép`, {
      description: "Sẵn sàng để di chuyển - sử dụng Dán. Hết hạn trong 5 phút",
    });
    handleCloseContextMenu();
  };

  const handleDownloadFile = async () => {
    if (!contextMenu?.item) return;
    const file = contextMenu.item as FileItem;

    try {
      const downloadUrl = await getDownloadUrl(file.id);
      // Create temporary link and trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Scholar Hub thông báo: Đang tải xuống '${file.name}'...`);
    } catch (err) {
      toast.error("Scholar Hub thông báo: Không thể tải xuống tệp");
    }
    handleCloseContextMenu();
  };

  const handleEditFile = () => {
    if (!contextMenu?.item) return;
    const file = contextMenu.item as FileItem;
    setEditingFile(file);
    setEditTitle(file.name);
    setEditDescription("");
    setEditDialogOpen(true);
    handleCloseContextMenu();
  };

  const handleRenameFile = () => {
    if (!contextMenu?.item) return;
    const file = contextMenu.item as FileItem;
    setEditingFile(file);
    setRenameValue(file.name);
    setRenameDialogOpen(true);
    handleCloseContextMenu();
  };

  const handleSaveEdit = async () => {
    if (!editingFile) return;

    try {
      const updatedMaterial = await updateMaterial(
        editingFile.id,
        editTitle,
        editDescription,
      );
      // Update file in the current files list instead of full reload
      setFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.id === editingFile.id ? { ...f, name: updatedMaterial.title } : f,
        ),
      );
      toast.success("Scholar Hub thông báo: Tệp đã cập nhật thành công!");
    } catch (err) {
      toast.error("Scholar Hub thông báo: Không thể cập nhật tệp");
    } finally {
      setEditDialogOpen(false);
      setEditingFile(null);
    }
  };

  const handleSaveRename = async () => {
    if (!editingFile) return;

    try {
      const updatedMaterial = await updateMaterial(
        editingFile.id,
        renameValue,
        null,
      );
      // Update file in the current files list instead of full reload
      setFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.id === editingFile.id ? { ...f, name: updatedMaterial.title } : f,
        ),
      );
      toast.success("Scholar Hub thông báo: Tệp đã đổi tên thành công!");
    } catch (err) {
      toast.error("Scholar Hub thông báo: Không thể đổi tên tệp");
    } finally {
      setRenameDialogOpen(false);
      setEditingFile(null);
    }
  };

  const handlePasteFile = async () => {
    const clipboardItem = getClipboardItem();
    if (!clipboardItem) {
      toast.error("Nothing to paste");
      return;
    }

    const targetFolderId = currentView.folderId;

    try {
      if (isClipboardFile()) {
        // Move file to current folder
        await moveMaterial(clipboardItem.id, targetFolderId);
        clearClipboard();
        toast.success(
          `'${clipboardItem.name}' moved to '${
            currentView.path[currentView.path.length - 1].name
          }'`,
        );
      } else if (isClipboardFolder()) {
        // Move folder to current folder
        await moveFolder(clipboardItem.id, targetFolderId);
        clearClipboard();
        toast.success(
          `'${clipboardItem.name}' moved to '${
            currentView.path[currentView.path.length - 1].name
          }'`,
        );
      }

      // Reload both folder tree and contents of current folder
      try {
        const tree = await getFolderTree();
        setFolderTree(tree);

        const { folders, files } = await getFolderContents(targetFolderId);
        setSubfolders(folders);
        setFiles(files);
      } catch (err) {
        // Fallback to full reload if partial reload fails
        setReloadTrigger((prev) => prev + 1);
      }
    } catch (err) {
      toast.error("Failed to move item");
    }
    handleCloseContextMenu();
  };

  const handleFileDoubleClick = (fileId: string) => {
    navigate(`/viewer/${fileId}`, {
      state: {
        returnTo: `/explorer`,
        currentFolder: currentView.folderId,
        folderPath: currentView.path,
      },
    });
  };

  const handleDragStart = (event: React.DragEvent, folder: FolderItem) => {
    setDraggedFolder(folder);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (event: React.DragEvent, targetFolder: FolderItem) => {
    event.preventDefault();
    if (draggedFolder && draggedFolder.id !== targetFolder.id) {
      event.dataTransfer.dropEffect = "move";
    }
  };

  const handleDrop = async (
    event: React.DragEvent,
    targetFolder: FolderItem,
  ) => {
    event.preventDefault();
    if (!draggedFolder || draggedFolder.id === targetFolder.id) {
      setDraggedFolder(null);
      return;
    }

    try {
      await moveFolder(draggedFolder.id, targetFolder.id);
      toast.success(`Moved '${draggedFolder.name}' to '${targetFolder.name}'`);

      // Reload folder tree and contents if moving to current folder
      try {
        const tree = await getFolderTree();
        setFolderTree(tree);

        // If target folder is current folder, reload its contents
        if (targetFolder.id === currentView.folderId) {
          const { folders, files } = await getFolderContents(targetFolder.id);
          setSubfolders(folders);
          setFiles(files);
        }
      } catch (err) {
        // Fallback to full reload if partial reload fails
        setReloadTrigger((prev) => prev + 1);
      }
    } catch (err) {
      toast.error("Failed to move folder");
    } finally {
      setDraggedFolder(null);
    }
  };

  const reloadData = useCallback(async () => {
    try {
      const tree = await getFolderTree();
      setFolderTree(tree);
      const { folders, files } = await getFolderContents(currentView.folderId);
      setSubfolders(folders);
      setFiles(files);
    } catch (err) {}
  }, [currentView.folderId]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Top Bar */}
      <AppBar
        position="static"
        sx={{ bgcolor: "white", color: "text.primary", boxShadow: 1 }}
      >
        <Toolbar>
          {/* Mobile Menu Icon */}
          <IconButton
            edge="start"
            onClick={() => setMobileDrawerOpen(true)}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mr: { xs: 1, md: 2 },
            }}
          >
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
              }}
            >
              SH
            </Box>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 600,
                color: "primary.main",
                display: { xs: "none", sm: "block" },
              }}
            >
              ScholarHub
            </Typography>
          </Box>

          {/* Search (center) */}
          <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}>
            <Box
              component="form"
              onSubmit={handleSearch}
              sx={{
                width: "100%",
                maxWidth: { xs: 520, md: 720 },
                display: "flex",
                alignItems: "center",
                bgcolor: "#f3f4f6",
                borderRadius: 2,
                px: 2,
                py: 0.5,
                "&:focus-within": {
                  bgcolor: "#e5e7eb",
                  boxShadow: 1,
                },
              }}
            >
              <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />
              <InputBase
                placeholder="Tìm kiếm tài liệu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ width: "100%", fontSize: 15 }}
              />
            </Box>
          </Box>

          <Box
            sx={{
              ml: "auto",
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, md: 2 },
            }}
          >
            <Button
              variant="text"
              startIcon={
                <UploadIcon
                  sx={{ display: { xs: "none", sm: "inline-flex" }, mr: 0.5 }}
                />
              }
              onClick={() => setUploadModalOpen(true)}
              sx={{
                color: "text.secondary",
                minWidth: "auto",
                display: { xs: "none", md: "inline-flex" },
                "& .MuiButton-startIcon": { mr: 0.5 },
              }}
            >
              Tải lên
            </Button>

            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: "secondary.main",
                cursor: "pointer",
              }}
            >
              {(user?.name?.charAt(0) ?? "?").toUpperCase()}
            </Avatar>
            <Button
              startIcon={
                <LogoutIcon sx={{ display: { xs: "none", sm: "inline" } }} />
              }
              onClick={handleLogout}
              sx={{ color: "text.secondary", minWidth: "auto" }}
            >
              <Typography sx={{ display: { xs: "none", sm: "block" } }}>
                Đăng Xuất
              </Typography>
              <LogoutIcon sx={{ display: { xs: "block", sm: "none" } }} />
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex", flexGrow: 1 }}>
        {/* Desktop Sidebar */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            width: DRAWER_WIDTH,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
              position: "relative",
              borderRight: "1px solid #e5e7eb",
            },
          }}
        >
          <Divider />

          <List
            sx={{ flexGrow: 1, overflow: "auto" }}
            onContextMenu={handleTreeBackgroundContextMenu}
          >
            {treeLoading ? (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Đang tải thư mục...
                </Typography>
              </Box>
            ) : (
              folderTree.map((folder) => (
                <FolderTreeNode
                  key={folder.id}
                  folder={folder}
                  onFolderClick={handleFolderClick}
                  onFolderContextMenu={(e, f) =>
                    handleContextMenu(e, f, "folderTree")
                  }
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  selectedId={currentView.folderId}
                />
              ))
            )}
          </List>
        </Drawer>

        {/* Mobile Sidebar */}
        <Drawer
          variant="temporary"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
            },
          }}
        >
          <Divider />

          <List
            sx={{ flexGrow: 1, overflow: "auto" }}
            onContextMenu={handleTreeBackgroundContextMenu}
          >
            {treeLoading ? (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Đang tải thư mục...
                </Typography>
              </Box>
            ) : (
              folderTree.map((folder) => (
                <FolderTreeNode
                  key={folder.id}
                  folder={folder}
                  onFolderClick={(f) => {
                    handleFolderClick(f);
                    setMobileDrawerOpen(false);
                  }}
                  onFolderContextMenu={(e, f) =>
                    handleContextMenu(e, f, "folderTree")
                  }
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  selectedId={currentView.folderId}
                />
              ))
            )}
          </List>
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, bgcolor: "#f9fafb" }}
          onContextMenu={handleBackgroundContextMenu}
        >
          {/* Back Button & Breadcrumbs */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            {currentView.path.length > 2 && (
              <IconButton
                size="small"
                onClick={() => {
                  const newPath = currentView.path.slice(0, -1);
                  const prevItem = newPath[newPath.length - 1];
                  // Special handling for "library" - always reset to root
                  if (prevItem.id === "library") {
                    setCurrentView({
                      folderId: "root",
                      path: [
                        { id: "library", name: "" },
                        { id: "root", name: "Thư Viện" },
                      ],
                    });
                  } else {
                    setCurrentView({
                      folderId: prevItem.id,
                      path: newPath,
                    });
                  }
                }}
                sx={{
                  bgcolor: "action.hover",
                  "&:hover": { bgcolor: "action.selected" },
                }}
                title="Quay lại"
              >
                <ArrowBackIcon sx={{ fontSize: 20 }} />
              </IconButton>
            )}
            <Breadcrumbs sx={{ fontSize: { xs: 14, md: 16 } }}>
              {currentView.path.map((pathItem, index) => (
                <Link
                  key={pathItem.id}
                  component="button"
                  variant="body2"
                  underline="hover"
                  color={
                    index === currentView.path.length - 1
                      ? "text.primary"
                      : "inherit"
                  }
                  onClick={() => {
                    const newPath = currentView.path.slice(0, index + 1);
                    // Special handling for "library" - always reset to root
                    if (pathItem.id === "library") {
                      setCurrentView({
                        folderId: "root",
                        path: [
                          { id: "library", name: "" },
                          { id: "root", name: "Thư Viện" },
                        ],
                      });
                    } else {
                      setCurrentView({ folderId: pathItem.id, path: newPath });
                    }
                  }}
                  sx={{
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    fontWeight:
                      index === currentView.path.length - 1 ? 600 : 400,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  {index === 0 && (
                    <HomeIcon sx={{ fontSize: 18, verticalAlign: "middle" }} />
                  )}
                  {pathItem.name}
                </Link>
              ))}
            </Breadcrumbs>
          </Box>

          {/* File Grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(1, 1fr)",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: 2,
            }}
          >
            {/* Subfolders */}
            {subfolders.map((folder) => (
              <Card
                key={folder.id}
                elevation={0}
                sx={{
                  border: "1px solid #e5e7eb",
                  "&:hover": {
                    boxShadow: 2,
                    borderColor: "primary.main",
                  },
                }}
                onContextMenu={(e) =>
                  handleContextMenu(e, folder, "contentFolder")
                }
              >
                <CardActionArea onClick={() => handleFolderClick(folder)}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <FolderIcon sx={{ fontSize: 48, color: "#fbbf24" }} />
                      <Typography variant="subtitle1" fontWeight={500}>
                        {folder.name}
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}

            {/* Files */}
            {files.map((file) => (
              <Card
                key={file.id}
                elevation={0}
                sx={{
                  border: "1px solid #e5e7eb",
                  cursor: "pointer",
                  "&:hover": {
                    boxShadow: 2,
                    borderColor: "primary.main",
                  },
                }}
                onContextMenu={(e) => handleContextMenu(e, file, "contentFile")}
              >
                <CardActionArea onClick={() => handleFileDoubleClick(file.id)}>
                  <CardContent>
                    <Box sx={{ textAlign: "center", mb: 1 }}>
                      {getFileIcon(file.type, 56)}
                    </Box>
                    <Typography
                      variant="body2"
                      fontWeight={500}
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {file.size}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Box>

          {!contentsLoading &&
            subfolders.length === 0 &&
            files.length === 0 && (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <FolderIcon sx={{ fontSize: 80, color: "#d1d5db", mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  This folder is empty
                </Typography>
              </Box>
            )}
        </Box>
      </Box>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        {contextMenu?.type === "background" && [
          <MenuItem
            key="bg-upload"
            onClick={() => {
              setUploadModalOpen(true);
              handleCloseContextMenu();
            }}
          >
            Tải Lên Tài Liệu
          </MenuItem>,
          <MenuItem key="bg-new-folder" onClick={handleCreateFolder}>
            Tạo Thư Mục Mới
          </MenuItem>,
        ]}

        {contextMenu?.type === "treeBackground" && [
          <MenuItem key="tbg-new-folder" onClick={handleTreeRootCreateFolder}>
            Tạo Thư Mục Mới
          </MenuItem>,
        ]}

        {contextMenu?.type === "folderTree" && [
          <MenuItem key="ft-create" onClick={handleTreeCreateFolder}>
            Tạo Thư Mục Mới
          </MenuItem>,
          <MenuItem key="ft-rename" onClick={handleCloseContextMenu}>
            Đổi Tên
          </MenuItem>,
          <MenuItem key="ft-move" onClick={handleMoveFolder}>
            <ListItemIcon>
              <MoveIcon fontSize="small" />
            </ListItemIcon>
            Di Chuyển
          </MenuItem>,
          <Divider key="ft-div" />,
          <MenuItem
            key="ft-delete"
            onClick={handleDeleteFolder}
            sx={{ color: "error.main" }}
          >
            Xóa
          </MenuItem>,
        ]}

        {contextMenu?.type === "background" &&
          hasClipboardItem() && [
            <MenuItem key="bg-paste" onClick={handlePasteFile}>
              <ListItemIcon>
                <PasteIcon fontSize="small" />
              </ListItemIcon>
              Dán
            </MenuItem>,
            <Divider key="bg-paste-div" />,
          ]}

        {contextMenu?.type === "contentFolder" && [
          <MenuItem key="c-rename" onClick={handleCloseContextMenu}>
            Đổi Tên
          </MenuItem>,
          <MenuItem key="c-move" onClick={handleMoveFolder}>
            <ListItemIcon>
              <MoveIcon fontSize="small" />
            </ListItemIcon>
            Di Chuyển
          </MenuItem>,
          hasClipboardItem() && [
            <Divider key="c-paste-div" />,
            <MenuItem key="c-paste" onClick={handlePasteFile}>
              <ListItemIcon>
                <PasteIcon fontSize="small" />
              </ListItemIcon>
              Dán
            </MenuItem>,
          ],
          <Divider key="c-div" />,
          <MenuItem
            key="c-delete"
            onClick={handleDeleteFolder}
            sx={{ color: "error.main" }}
          >
            Xóa
          </MenuItem>,
        ]}

        {contextMenu?.type === "contentFile" && [
          <MenuItem key="cf-edit" onClick={handleEditFile}>
            Chỉnh Sửa
          </MenuItem>,
          <MenuItem key="cf-rename" onClick={handleRenameFile}>
            Đổi Tên
          </MenuItem>,
          <MenuItem key="cf-move" onClick={handleMoveFile}>
            <ListItemIcon>
              <MoveIcon fontSize="small" />
            </ListItemIcon>
            Di Chuyển
          </MenuItem>,
          <MenuItem key="cf-download" onClick={handleDownloadFile}>
            Tải Xuống
          </MenuItem>,
          hasClipboardItem() && [
            <Divider key="cf-paste-div" />,
            <MenuItem key="cf-paste" onClick={handlePasteFile}>
              <ListItemIcon>
                <PasteIcon fontSize="small" />
              </ListItemIcon>
              Dán
            </MenuItem>,
          ],
          <Divider key="cf-div" />,
          <MenuItem
            key="cf-delete"
            onClick={handleDeleteFile}
            sx={{ color: "error.main" }}
          >
            Xóa
          </MenuItem>,
        ]}
      </Menu>

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
          <Button onClick={handleSaveEdit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename File Dialog */}
      <Dialog
        open={renameDialogOpen}
        onClose={() => setRenameDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Rename File</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="New Name"
            fullWidth
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveRename} variant="contained">
            Đổi Tên
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, color: "#d32f2f" }}>
          Scholar Hub thông báo
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Bạn có chắc muốn xóa{" "}
                {deleteTarget?.type === "folder" ? "thư mục" : "tệp"} "
                {deleteTarget?.name}"?
              </Typography>
            </Box>
          </Box>
          <Typography variant="caption" color="textSecondary">
            Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleCancelDelete} variant="outlined">
            Hủy
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            sx={{
              backgroundColor: "#d32f2f",
              "&:hover": {
                backgroundColor: "#b71c1c",
              },
            }}
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Modal */}
      <UploadManager
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        folderId={
          currentView.folderId === "root" ? undefined : currentView.folderId
        }
        onUploadComplete={reloadData}
      />
    </Box>
  );
}
