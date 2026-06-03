import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Button,
  IconButton,
  Paper,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Divider,
  Card,
  CardActionArea,
  Chip,
  InputBase,
  LinearProgress,
  Alert,
} from "@mui/material";
import {
  Search as SearchIcon,
  PictureAsPdf,
  VideoLibrary,
  Image as ImageIcon,
  Article,
  Description as FileIcon,
  Folder as FolderIcon,
  Logout as LogoutIcon,
  MenuBook as LibraryIcon,
} from "@mui/icons-material";
import { AuthService } from "../services/AuthService";
import { SearchService } from "../services/SearchService";
import { SessionService } from "../services/SessionService";
import { SearchQuery } from "../models/SearchQuery";
import type { MaterialDocument } from "../models/Material";

const authService = new AuthService();
const searchService = new SearchService();
const sessionService = new SessionService();

interface ResultRow {
  id: string;
  name: string;
  type: string;
  size: string;
  folder: string;
  description: string;
  uploadDate: string;
  tags: string[];
}

/** Dữ liệu mẫu khi dev không gọi được API (không cookie / backend tắt). */
const MOCK_DOCUMENTS: ResultRow[] = [
  {
    id: "f1",
    name: "Arrays and Lists.pdf",
    type: "pdf",
    size: "2.3 MB",
    folder: "Computer Science / Data Structures",
    description:
      "Comprehensive guide to arrays, linked lists, and dynamic arrays",
    uploadDate: "2024-03-15",
    tags: ["Data Structures", "Programming"],
  },
  {
    id: "f2",
    name: "Trees and Graphs.pptx",
    type: "pptx",
    size: "5.1 MB",
    folder: "Computer Science / Data Structures",
    description: "Presentation on binary trees, BST, and graph algorithms",
    uploadDate: "2024-03-14",
    tags: ["Data Structures", "Graphs"],
  },
  {
    id: "f3",
    name: "Sorting Tutorial.mp4",
    type: "video",
    size: "45 MB",
    folder: "Computer Science / Algorithms",
    description:
      "Video lecture on various sorting algorithms with demonstrations",
    uploadDate: "2024-03-18",
    tags: ["Algorithms", "Video Lecture"],
  },
  {
    id: "f4",
    name: "Algorithm Analysis.mp4",
    type: "video",
    size: "38 MB",
    folder: "Computer Science / Algorithms",
    description: "Time and space complexity analysis tutorial",
    uploadDate: "2024-03-10",
    tags: ["Algorithms", "Complexity"],
  },
  {
    id: "f5",
    name: "Derivatives.pdf",
    type: "pdf",
    size: "3.2 MB",
    folder: "Mathematics / Calculus",
    description: "Derivatives rules and applications with examples",
    uploadDate: "2024-03-12",
    tags: ["Calculus", "Mathematics"],
  },
  {
    id: "f6",
    name: "Linear Algebra Slides.pptx",
    type: "pptx",
    size: "4.8 MB",
    folder: "Mathematics / Linear Algebra",
    description: "Introduction to matrices and vector spaces",
    uploadDate: "2024-03-08",
    tags: ["Linear Algebra", "Mathematics"],
  },
];

function guessTypeFromTitle(title: string): string {
  const lower = title.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (/\.(mp4|webm|mov|mkv)$/.test(lower)) return "video";
  if (/\.(pptx?|ppt)$/.test(lower)) return "pptx";
  if (/\.(docx?|doc)$/.test(lower)) return "docx";
  if (/\.(xlsx?|xls)$/.test(lower)) return "xlsx";
  if (/\.(png|jpe?g|gif|webp|svg)$/.test(lower)) return "image";
  return "other";
}

function mapMaterialDocument(doc: MaterialDocument): ResultRow {
  const name = doc.title || "Untitled";
  const sizeInBytes = doc.size ?? 0;
  let formattedSize = "—";
  if (sizeInBytes > 0) {
    const mb = sizeInBytes / (1024 * 1024);
    if (mb < 1) {
      const kb = sizeInBytes / 1024;
      formattedSize = `${kb.toFixed(1)} KB`;
    } else if (mb < 1024) {
      formattedSize = `${mb.toFixed(1)} MB`;
    } else {
      const gb = mb / 1024;
      formattedSize = `${gb.toFixed(1)} GB`;
    }
  }

  return {
    id: doc.id,
    name,
    type: doc.type ? doc.type.toLowerCase() : guessTypeFromTitle(name),
    size: formattedSize,
    folder: "—",
    description: doc.description || doc.metadata || "",
    uploadDate: doc.createdAt || "",
    tags: doc.tags ?? [],
  };
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getFileIcon(type: string) {
  const iconProps = { sx: { fontSize: 40 } };
  switch (type) {
    case "pdf":
      return (
        <PictureAsPdf {...iconProps} sx={{ fontSize: 40, color: "#dc2626" }} />
      );
    case "docx":
      return <Article {...iconProps} sx={{ fontSize: 40, color: "#1e3a8a" }} />;
    case "pptx":
      return (
        <FileIcon {...iconProps} sx={{ fontSize: 40, color: "#fb923c" }} />
      );
    case "video":
      return (
        <VideoLibrary {...iconProps} sx={{ fontSize: 40, color: "#7c3aed" }} />
      );
    case "image":
      return (
        <ImageIcon {...iconProps} sx={{ fontSize: 40, color: "#059669" }} />
      );
    default:
      return (
        <FileIcon {...iconProps} sx={{ fontSize: 40, color: "#6b7280" }} />
      );
  }
}

// Normalize Vietnamese text by removing diacritics
function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .toLowerCase();
}

// Convert file size string ("100 KB", "2.3 MB", etc.) to MB
function convertSizeToMB(sizeStr: string): number {
  if (sizeStr === "—" || !sizeStr.trim()) return -1;

  const parts = sizeStr.trim().split(/\s+/);
  if (parts.length < 2) return -1;

  const value = parseFloat(parts[0]);
  const unit = parts[1].toUpperCase();

  if (Number.isNaN(value)) return -1;

  switch (unit) {
    case "KB":
      return value / 1024; // Convert KB to MB
    case "MB":
      return value;
    case "GB":
      return value * 1024; // Convert GB to MB
    default:
      return -1;
  }
}

export function SearchResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qParam = searchParams.get("q");
  const initialQuery = qParam ?? "";

  const [user, setUser] = useState<{ name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);
  const [fileTypeFilter, setFileTypeFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState("all");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null,
  );

  useEffect(() => {
    const storedUser = localStorage.getItem("user_data");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser({ name: userData.fullName || "User" });
      } catch (e) {
        navigate("/");
      }
      return;
    }
    navigate("/");
  }, [navigate]);

  const handleLogout = async () => {
    try {
      // BE sẽ set cookie trống (invalidate) qua `Set-Cookie`.
      await authService.logout();
    } finally {
      // Clear debounce timer on logout
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      // Clear all auth-related localStorage items
      localStorage.removeItem("user_data");
      localStorage.removeItem("scholar_hub_token");
      localStorage.removeItem("JWT_TOKENT");
      // Best-effort: xóa cookie nếu nó không phải HttpOnly.
      document.cookie = "JWT_TOKENT=; Max-Age=0; path=/;";
      navigate("/");
    }
  };

  useEffect(() => {
    setSearchQuery(initialQuery);
    // Clear debounce timer when URL query changes
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }
  }, [initialQuery]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  useEffect(() => {
    let cancelled = false;
    let timeout: NodeJS.Timeout | null = null;

    (async () => {
      // Only show loading for new searches (avoid flickering on filters)
      timeout = setTimeout(() => {
        if (!cancelled) setLoading(true);
      }, 300); // Show loading only if it takes > 300ms

      setLoadError(null);
      setUsingMock(false);
      try {
        // keyword null/empty: không gửi query param → backend trả toàn bộ.
        const docs = await searchService.search(new SearchQuery(qParam));

        if (cancelled) return;
        if (timeout) clearTimeout(timeout);
        const mapped = docs.map(mapMaterialDocument);

        setRows(mapped);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        if (timeout) clearTimeout(timeout);
        const status = (e as { status?: number }).status;
        if (status === 401) {
          await handleLogout();
          return;
        }
        if (import.meta.env.DEV) {
          setRows(MOCK_DOCUMENTS);
          setUsingMock(true);
          setLoadError(null);
        } else {
          setRows([]);
          setLoadError(
            e instanceof Error ? e.message : "Không tải được kết quả",
          );
        }
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [qParam, navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
    else navigate("/search");
  };

  // Live search with 1s debounce
  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);

    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer - 500ms debounce
    const timer = setTimeout(() => {
      const q = value.trim();
      if (q) {
        navigate(`/search?q=${encodeURIComponent(q)}`);
      } else {
        navigate("/search");
      }
    }, 500);

    setDebounceTimer(timer);
  };

  const handleFileTypeChange = (type: string) => {
    setFileTypeFilter((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const filterResults = () => {
    let results = rows.filter((doc) => {
      const query = normalizeText(initialQuery);
      if (!query) return true;
      return (
        normalizeText(doc.name).includes(query) ||
        normalizeText(doc.description).includes(query) ||
        doc.tags.some((tag) => normalizeText(tag).includes(query))
      );
    });

    if (fileTypeFilter.length > 0) {
      results = results.filter((doc) =>
        fileTypeFilter.some((f) => {
          if (f === "video") return doc.type === "video";
          if (f === "image") return doc.type === "image";
          if (f === "document") {
            // Backend returns type "DOCUMENT" which maps to "document" (lowercase)
            // Also accept specific file types
            return (
              doc.type === "document" ||
              ["pdf", "docx", "pptx", "xlsx", "xls"].includes(doc.type)
            );
          }
          return false;
        }),
      );
    }

    const now = new Date();
    if (dateFilter === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      results = results.filter((doc) => {
        if (!doc.uploadDate) return true;
        return new Date(doc.uploadDate) >= weekAgo;
      });
    } else if (dateFilter === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      results = results.filter((doc) => {
        if (!doc.uploadDate) return true;
        return new Date(doc.uploadDate) >= monthAgo;
      });
    }

    if (sizeFilter === "small") {
      results = results.filter((doc) => {
        const sizeInMB = convertSizeToMB(doc.size);
        return sizeInMB >= 0 && sizeInMB < 5;
      });
    } else if (sizeFilter === "large") {
      results = results.filter((doc) => {
        const sizeInMB = convertSizeToMB(doc.size);
        return sizeInMB >= 5;
      });
    }

    return results;
  };

  const filteredResults = filterResults();

  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    const normalizedQuery = normalizeText(query);
    const normalizedText = normalizeText(text);

    // Find first match in normalized text
    const matchIndex = normalizedText.indexOf(normalizedQuery);
    if (matchIndex === -1) {
      return text; // No match found
    }

    // Map normalized position to original text position
    let originalIndex = 0;
    let normalizedIndex = 0;

    for (let i = 0; i < text.length && normalizedIndex < matchIndex; i++) {
      const char = text[i];
      const normalized = normalizeText(char);
      normalizedIndex += normalized.length;
      if (normalizedIndex <= matchIndex) {
        originalIndex = i + 1;
      }
    }

    // Find match end position
    let endIndex = originalIndex;
    let matchedNormLength = 0;
    for (
      let i = originalIndex;
      i < text.length && matchedNormLength < normalizedQuery.length;
      i++
    ) {
      const char = text[i];
      const normalized = normalizeText(char);
      matchedNormLength += normalized.length;
      endIndex = i + 1;
    }

    // Build highlighted result
    const parts: React.ReactNode[] = [];
    const beforeMatch = text.substring(0, originalIndex);
    const matchedText = text.substring(originalIndex, endIndex);
    const afterMatch = text.substring(endIndex);

    if (beforeMatch) parts.push(beforeMatch);

    parts.push(
      <strong
        key="match"
        style={{ backgroundColor: "#fef3c7", fontWeight: 700 }}
      >
        {matchedText}
      </strong>,
    );

    if (afterMatch) {
      // Recursively highlight remaining text for multiple matches
      const highlightedAfter = highlightText(afterMatch, query);
      if (Array.isArray(highlightedAfter)) {
        parts.push(...highlightedAfter);
      } else {
        parts.push(highlightedAfter);
      }
    }

    return parts;
  };

  const querySummary = initialQuery.trim()
    ? `"${initialQuery}"`
    : "tất cả tài liệu";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Force scrollbar space reservation to prevent layout shift when scrollbar appears/disappears */}
      <style>{`html { overflow-y: scroll; }`}</style>
      <AppBar
        position="sticky"
        sx={{
          bgcolor: "white",
          color: "text.primary",
          boxShadow: 1,
          zIndex: 1100,
        }}
      >
        <Toolbar>
          {/* Logo */}
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

          {/* Search (centered) */}
          <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}>
            <Box
              component="form"
              onSubmit={handleSearch}
              sx={{
                width: "100%",
                maxWidth: 720,
                display: "flex",
                alignItems: "center",
                bgcolor: "#f3f4f6",
                borderRadius: 2,
                px: 2,
                py: 0.5,
              }}
            >
              <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />
              <InputBase
                placeholder="Tìm kiếm tài liệu..."
                value={searchQuery}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                sx={{ width: "100%", fontSize: 15 }}
              />
            </Box>
          </Box>

          {/* Right items */}
          <Box
            sx={{
              ml: "auto",
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, md: 2 },
            }}
          >
            {sessionService.canAccessExplorer() && (
              <Button
                variant="text"
                startIcon={<LibraryIcon />}
                onClick={() => navigate("/explorer")}
                sx={{
                  color: "text.secondary",
                  minWidth: "auto",
                  display: { xs: "none", md: "inline-flex" },
                  "& .MuiButton-startIcon": { mr: 0.5 },
                }}
              >
                Thư viện
              </Button>
            )}

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

      {loading ? <LinearProgress /> : null}

      <Box
        sx={{
          display: "flex",
          flexGrow: 1,
          bgcolor: "#f9fafb",
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        <Paper
          sx={{
            width: { xs: "100%", md: 280 },
            p: 3,
            borderRadius: 0,
            borderRight: { md: "1px solid #e5e7eb" },
            borderBottom: { xs: "1px solid #e5e7eb", md: "none" },
            position: { md: "sticky" },
            top: { md: 64 },
            height: { md: "calc(100vh - 64px)" },
            overflowY: { md: "auto" },
          }}
        >
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Bộ Lọc Kết Quả
          </Typography>

          <Divider sx={{ my: 2 }} />

          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1 }}>
              Loại Tài Liệu
            </FormLabel>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={fileTypeFilter.includes("video")}
                    onChange={() => handleFileTypeChange("video")}
                  />
                }
                label="Video"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={fileTypeFilter.includes("image")}
                    onChange={() => handleFileTypeChange("image")}
                  />
                }
                label="Image"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={fileTypeFilter.includes("document")}
                    onChange={() => handleFileTypeChange("document")}
                  />
                }
                label="Tài liệu (PDF, DOCX, PPT)"
              />
            </FormGroup>
          </FormControl>

          <Divider sx={{ my: 2 }} />

          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1 }}>
              Thời Gian Tải Lên
            </FormLabel>
            <RadioGroup
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <FormControlLabel
                value="all"
                control={<Radio />}
                label="Tất cả thời gian"
              />
              <FormControlLabel
                value="week"
                control={<Radio />}
                label="7 ngày qua"
              />
              <FormControlLabel
                value="month"
                control={<Radio />}
                label="30 ngày qua"
              />
            </RadioGroup>
          </FormControl>

          <Divider sx={{ my: 2 }} />

          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1 }}>
              Kích Thước Tệp
            </FormLabel>
            <RadioGroup
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
            >
              <FormControlLabel
                value="all"
                control={<Radio />}
                label="Tất cả kích thước"
              />
              <FormControlLabel
                value="small"
                control={<Radio />}
                label="Nhỏ (< 5 MB)"
              />
              <FormControlLabel
                value="large"
                control={<Radio />}
                label="Lớn (≥ 5 MB)"
              />
            </RadioGroup>
          </FormControl>
        </Paper>

        <Box sx={{ flexGrow: 1, p: 3 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Tìm kiếm bất cứ tài liệu nào bạn cần!
          </Typography>

          {usingMock ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Đang dùng dữ liệu mẫu (dev): không gọi được API hoặc chưa đăng
              nhập hợp lệ.
            </Alert>
          ) : null}

          {loadError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {loadError}
            </Alert>
          ) : null}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Tìm thấy {filteredResults.length} kết quả cho {querySummary}
          </Typography>

          {!loading && filteredResults.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <SearchIcon sx={{ fontSize: 80, color: "#d1d5db", mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Không tìm thấy kết quả nào cho {querySummary}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Thử điều chỉnh từ khóa hoặc bỏ bớt bộ lọc để có nhiều kết quả
                hơn.
              </Typography>
            </Box>
          ) : null}

          {!loading && filteredResults.length > 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {filteredResults.map((result) => (
                <Card
                  key={result.id}
                  elevation={0}
                  sx={{
                    border: "1px solid #e5e7eb",
                    "&:hover": {
                      boxShadow: 2,
                      borderColor: "primary.main",
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() =>
                      navigate(`/viewer/${result.id}`, {
                        state: {
                          returnTo: `/search`,
                          searchQuery: initialQuery,
                        },
                      })
                    }
                    sx={{ p: 2 }}
                  >
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ flexShrink: 0 }}>
                        {getFileIcon(result.type)}
                      </Box>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="h6" sx={{ mb: 0.5 }}>
                          {highlightText(result.name, initialQuery)}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          {highlightText(result.description, initialQuery)}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                            flexWrap: "wrap",
                          }}
                        >
                          <FolderIcon
                            sx={{ fontSize: 14, color: "text.secondary" }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {result.folder}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            • {result.size}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            •{" "}
                            {result.uploadDate
                              ? new Date(result.uploadDate).toLocaleDateString()
                              : "—"}
                          </Typography>
                        </Box>
                        <Box
                          sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}
                        >
                          {result.tags.map((tag, index) => (
                            <Chip key={index} label={tag} size="small" />
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}
