import { AppBar, Toolbar, Typography, Button, Avatar, Box } from "@mui/material";
import { Search as SearchIcon, Person as PersonIcon } from "@mui/icons-material";
import { useNavigate } from "react-router";
import { useState } from "react";

interface NavigationProps {
  user?: { name: string; avatar?: string } | null;
  onSearch?: (query: string) => void;
}

export function Navigation({ user, onSearch }: NavigationProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: "#1976d2", boxShadow: 1 }}>
      <Toolbar sx={{ gap: 2 }}>
        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }} onClick={() => navigate("/")}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "bold",
            }}
          >
            SH
          </Box>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600, color: "white" }}>
            Scholar Hub
          </Typography>
        </Box>

        {/* Search Bar */}
        <Box
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{
            flexGrow: 1,
            maxWidth: 600,
            mx: 4,
            display: "flex",
            alignItems: "center",
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            borderRadius: 1,
            px: 2,
            py: 0.5,
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.25)",
            },
            "&:focus-within": {
              backgroundColor: "rgba(255, 255, 255, 0.25)",
            },
          }}
        >
          <SearchIcon sx={{ color: "rgba(255, 255, 255, 0.7)", mr: 1 }} />
          <input
            type="text"
            placeholder="Tìm kiếm tài liệu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              backgroundColor: "transparent",
              color: "white",
              width: "100%",
              fontSize: "14px",
            }}
          />
        </Box>

        {/* User Section */}
        {user ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar
              sx={{ width: 32, height: 32, bgcolor: "#667eea", cursor: "pointer" }}
            >
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
            <Typography sx={{ color: "white", fontSize: 14 }}>{user.name}</Typography>
          </Box>
        ) : (
          <Button
            variant="outlined"
            sx={{
              color: "white",
              borderColor: "rgba(255, 255, 255, 0.5)",
              "&:hover": {
                borderColor: "white",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
            startIcon={<PersonIcon />}
            onClick={() => navigate("/login")}
          >
            Login
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
