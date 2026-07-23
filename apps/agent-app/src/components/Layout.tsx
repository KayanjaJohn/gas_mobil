import { useState, useContext } from "react";
import { Outlet, useNavigate, useLocation, Navigate } from "react-router-dom";
import {
	Box,
	Drawer,
	AppBar,
	Toolbar,
	Typography,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	IconButton,
	Avatar,
	Chip,
	useTheme,
} from "@mui/material";
import {
	Dashboard,
	ShoppingCart,
	LocalShipping,
	Inventory,
	Assessment,
	Logout,
	Menu as MenuIcon,
	People as PeopleIcon,
	Brightness4 as Brightness4Icon,
	Brightness7 as Brightness7Icon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import ColorModeContext from "../theme";

const drawerWidth = 240;

const menuItems = [
	{ path: "/", label: "Dashboard", icon: <Dashboard /> },
	{ path: "/orders", label: "Orders", icon: <ShoppingCart /> },
	{ path: "/products", label: "Products", icon: <Inventory /> },
	{ path: "/customers", label: "Customers", icon: <PeopleIcon /> },
	{ path: "/drivers", label: "Drivers", icon: <LocalShipping /> },
	{ path: "/reports", label: "Reports", icon: <Assessment /> },
];

export default function Layout() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const theme = useTheme();
	const [mobileOpen, setMobileOpen] = useState(false);
	const colorMode = useContext(ColorModeContext);

	if (!user) return <Navigate to="/login" replace />;

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	const drawer = (
		<Box>
			<Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1 }}>
				<LocalShipping color="primary" />
				<Typography variant="h6" color="primary">
					GasMobil Agent
				</Typography>
			</Box>
			<Box sx={{ px: 2, pb: 1 }}>
				<Chip
					label={user.station?.name || "No Station"}
					color="primary"
					size="small"
					variant="outlined"
				/>
			</Box>
			<List>
				{menuItems.map((item) => (
					<ListItem
						button
						key={item.path}
						selected={location.pathname === item.path}
						onClick={() => {
							navigate(item.path);
							setMobileOpen(false);
						}}
						sx={{
							"&.Mui-selected": {
								bgcolor: "primary.light",
								color: "primary.contrastText",
								"& .MuiListItemIcon-root": { color: "inherit" },
							},
						}}
					>
						<ListItemIcon>{item.icon}</ListItemIcon>
						<ListItemText primary={item.label} />
					</ListItem>
				))}
			</List>
		</Box>
	);

	return (
		<Box sx={{ display: "flex" }}>
			<AppBar
				position="fixed"
				sx={{
					width: { md: `calc(100% - ${drawerWidth}px)` },
					ml: { md: `${drawerWidth}px` },
				}}
			>
				<Toolbar>
					<IconButton
						color="inherit"
						edge="start"
						onClick={() => setMobileOpen(!mobileOpen)}
						sx={{ mr: 2, display: { md: "none" } }}
					>
						<MenuIcon />
					</IconButton>
					<Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
						Station Agent Portal
					</Typography>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Avatar sx={{ width: 32, height: 32 }}>{user.name?.[0]}</Avatar>
						<Box sx={{ display: { xs: "none", sm: "block" } }}>
							<Typography variant="body2">{user.name}</Typography>
							<Typography variant="caption" sx={{ textTransform: "capitalize" }}>
								{user.role}
							</Typography>
						</Box>
						<IconButton color="inherit" onClick={handleLogout}>
							<Logout />
						</IconButton>
					</Box>
				</Toolbar>
			</AppBar>

			<Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
				<Drawer
					variant="temporary"
					open={mobileOpen}
					onClose={() => setMobileOpen(false)}
					ModalProps={{ keepMounted: true }}
					sx={{
						display: { xs: "block", md: "none" },
						"& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
					}}
				>
					{drawer}
				</Drawer>
				<Drawer
					variant="permanent"
					sx={{
						display: { xs: "none", md: "block" },
						"& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
					}}
					open
				>
					{drawer}
				</Drawer>
			</Box>

			<Box
				component="main"
				sx={{ flexGrow: 1, p: 3, width: { md: `calc(100% - ${drawerWidth}px)` }, mt: 8 }}
			>
				<Outlet />
			</Box>
			<Box
				sx={{
					position: "fixed",
					bottom: 16,
					right: 16,
					zIndex: theme.zIndex.tooltip,
					borderRadius: "50%",
					backgroundColor: theme.palette.background.paper,
					boxShadow: 3,
				}}
			>
				<IconButton onClick={colorMode.toggleColorMode} color="primary">
					{theme.palette.mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
				</IconButton>
			</Box>
		</Box>
	);
}
