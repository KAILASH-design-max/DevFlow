"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ListTodo,
  Columns3,
  BarChart3,
  Settings,
  Bell,
  Search,
  LogOut,
  Sparkles,
  Plus,
  Rocket,
  HelpCircle,
  History,
  Command,
  X,
  ArrowRight,
  UserCheck,
  Check,
  ChevronDown,
  Layers,
  FileText,
  Keyboard,
  Compass,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
  PanelLeft,
} from "lucide-react";
import { useUiStore } from "@/lib/store";
import CreateIssueModal from "@/components/CreateIssueModal";

const DEMO_USERS = [
  { id: "u1", name: "Alice Chen", role: "Engineering Lead", email: "alice@devflow.io" },
  { id: "u2", name: "Bob Martinez", role: "Fullstack Engineer", email: "bob@devflow.io" },
  { id: "u3", name: "Carol Zhang", role: "QA Engineer", email: "carol@devflow.io" },
  { id: "u4", name: "David Kim", role: "DevOps Engineer", email: "david@devflow.io" },
];

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/issues", icon: ListTodo, label: "Issues", badge: 5 },
  { href: "/dashboard/board", icon: Columns3, label: "Board" },
  { href: "/dashboard/deployments", icon: Rocket, label: "Deployments" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

const SHORTCUT_CATEGORIES = [
  {
    category: "Navigation",
    icon: Compass,
    shortcuts: [
      { keys: ["G", "D"], description: "Go to Dashboard Overview", href: "/dashboard" },
      { keys: ["G", "I"], description: "Go to Issues & Backlog", href: "/dashboard/issues" },
      { keys: ["G", "B"], description: "Go to Kanban Sprint Board", href: "/dashboard/board" },
      { keys: ["G", "A"], description: "Go to Engineering Analytics", href: "/dashboard/analytics" },
      { keys: ["G", "K"], description: "Go to Documentation & Knowledge Hub", href: "/dashboard/docs" },
      { keys: ["G", "H"], description: "Go to Help Center & Support Hub", href: "/dashboard/support" },
      { keys: ["G", "P"], description: "Go to Deployments & Releases", href: "/dashboard/deployments" },
      { keys: ["G", "S"], description: "Go to Workspace Settings", href: "/dashboard/settings" },
    ],
  },
  {
    category: "Quick Actions",
    icon: Zap,
    shortcuts: [
      { keys: ["⌘ / Ctrl", "K"], description: "Open Search & Command Palette" },
      { keys: ["["], description: "Toggle Sidebar Collapse / Expand" },
      { keys: ["C"], description: "Create New AI-Assisted Issue", href: "/dashboard/issues" },
      { keys: ["/"], description: "Quick focus search bar" },
    ],
  },
  {
    category: "General",
    icon: Keyboard,
    shortcuts: [
      { keys: ["?"], description: "Open Keyboard Shortcuts Help" },
      { keys: ["ESC"], description: "Close any modal or popover" },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(DEMO_USERS[0]);
  const [unreadCount, setUnreadCount] = useState(2);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [shortcutSearch, setShortcutSearch] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { openCreateIssue } = useUiStore();

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const gSequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isGActiveRef = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        setUser(DEMO_USERS[0]);
      }
    } else {
      localStorage.setItem("user", JSON.stringify(DEMO_USERS[0]));
      setUser(DEMO_USERS[0]);
    }

    const savedSidebar = localStorage.getItem("isSidebarCollapsed");
    if (savedSidebar === "true") {
      setIsSidebarCollapsed(true);
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("isSidebarCollapsed", String(next));
      return next;
    });
  };

  // Click outside listeners
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global Keydown listener for Shortcuts, Navigation & Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Global Escape (always works)
      if (e.key === "Escape") {
        setIsCommandOpen(false);
        setIsUpgradeOpen(false);
        setIsShortcutsOpen(false);
        setIsUserMenuOpen(false);
        setIsNotifOpen(false);
        return;
      }

      // Cmd+K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
        return;
      }

      // Cmd+B / Ctrl+B -> Toggle Sidebar
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      if (isInput) return;

      // "[" -> Toggle Sidebar
      if (e.key === "[") {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Question Mark "?" -> Open Shortcuts Modal
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // Slash "/" -> Quick focus search / Command palette
      if (e.key === "/" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsCommandOpen(true);
        return;
      }

      // "C" -> Create Issue
      if (e.key.toLowerCase() === "c" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        openCreateIssue();
        return;
      }

      // Two-key "G" sequence navigation
      if (e.key.toLowerCase() === "g" && !isGActiveRef.current) {
        isGActiveRef.current = true;
        if (gSequenceTimeoutRef.current) clearTimeout(gSequenceTimeoutRef.current);
        gSequenceTimeoutRef.current = setTimeout(() => {
          isGActiveRef.current = false;
        }, 1200);
        return;
      }

      if (isGActiveRef.current) {
        isGActiveRef.current = false;
        if (gSequenceTimeoutRef.current) clearTimeout(gSequenceTimeoutRef.current);

        const k = e.key.toLowerCase();
        if (k === "d") {
          e.preventDefault();
          router.push("/dashboard");
        } else if (k === "i") {
          e.preventDefault();
          router.push("/dashboard/issues");
        } else if (k === "b") {
          e.preventDefault();
          router.push("/dashboard/board");
        } else if (k === "a") {
          e.preventDefault();
          router.push("/dashboard/analytics");
        } else if (k === "k") {
          e.preventDefault();
          router.push("/dashboard/docs");
        } else if (k === "h") {
          e.preventDefault();
          router.push("/dashboard/support");
        } else if (k === "p") {
          e.preventDefault();
          router.push("/dashboard/deployments");
        } else if (k === "s") {
          e.preventDefault();
          router.push("/dashboard/settings");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (gSequenceTimeoutRef.current) clearTimeout(gSequenceTimeoutRef.current);
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const handleSwitchUser = (selected: typeof DEMO_USERS[0]) => {
    const updated = {
      id: selected.id,
      name: selected.name,
      email: selected.email,
      role: selected.role,
    };
    localStorage.setItem("user", JSON.stringify(updated));
    setUser(updated);
    setIsUserMenuOpen(false);
  };

  const quickNavItems = [
    { label: "Dashboard Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Issues & Backlog", href: "/dashboard/issues", icon: ListTodo },
    { label: "Kanban Board", href: "/dashboard/board", icon: Columns3 },
    { label: "Deployments & Releases", href: "/dashboard/deployments", icon: Rocket },
    { label: "Engineering Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { label: "Documentation & Knowledge Hub", href: "/dashboard/docs", icon: FileText },
    { label: "Help Center & Support Hub", href: "/dashboard/support", icon: HelpCircle },
    { label: "Workspace Settings", href: "/dashboard/settings", icon: Settings },
  ].filter((item) =>
    item.label.toLowerCase().includes(commandQuery.toLowerCase())
  );

  const mockIssues = [
    { id: "PHX-1042", title: "Implement OAuth2 flow for third-party integrations", status: "in_progress" },
    { id: "PHX-1089", title: "Refactor dashboard metrics service for performance", status: "todo" },
    { id: "PHX-1104", title: "Add AI smart label generator to issue drawer", status: "in_review" },
    { id: "PHX-998", title: "Fix coupon validation race condition", status: "done" },
  ].filter(
    (i) =>
      i.title.toLowerCase().includes(commandQuery.toLowerCase()) ||
      i.id.toLowerCase().includes(commandQuery.toLowerCase())
  );

  const filteredShortcuts = SHORTCUT_CATEGORIES.map((cat) => ({
    ...cat,
    shortcuts: cat.shortcuts.filter((s) =>
      s.description.toLowerCase().includes(shortcutSearch.toLowerCase()) ||
      s.keys.some((k) => k.toLowerCase().includes(shortcutSearch.toLowerCase()))
    ),
  })).filter((cat) => cat.shortcuts.length > 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden antialiased font-sans">
      {/* ─── SideNavBar ─────────────────────────────────── */}
      <aside
        className={`${
          isSidebarCollapsed ? "w-[68px]" : "w-[260px]"
        } bg-white border-r border-slate-200 flex flex-col h-screen overflow-y-auto overflow-x-hidden transition-all duration-200 z-30 flex-shrink-0 shadow-[1px_0_4px_rgba(0,0,0,0.02)] relative group/sidebar`}
      >
        {/* Brand / Logo + Collapse Toggle */}
        <div className={`p-4 ${isSidebarCollapsed ? "px-3 justify-center" : "px-5 justify-between"} flex items-center gap-3 border-b border-slate-100/60`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-600 shadow-sm shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0 truncate">
                <h1 className="font-sans text-base font-bold text-slate-900 tracking-tight leading-none">
                  DevFlow
                </h1>
                <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500 font-semibold mt-1 truncate">
                  Engineering Team
                </p>
              </div>
            )}
          </div>

          {!isSidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="Close Sidebar (Press [)"
              aria-label="Close Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Button: New Issue */}
        <div className={`my-4 ${isSidebarCollapsed ? "px-3" : "px-4"}`}>
          {isSidebarCollapsed ? (
            <button
              onClick={() => openCreateIssue()}
              className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center transition-colors shadow-sm cursor-pointer"
              title="New Issue (Press C)"
            >
              <Plus className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => openCreateIssue()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2.5 px-4 font-sans text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition-all duration-150 shadow-sm hover:shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Issue</span>
            </button>
          )}
        </div>

        {/* Main Navigation Links */}
        <nav className={`flex-1 ${isSidebarCollapsed ? "px-2 space-y-1.5" : "px-3 space-y-1"}`}>
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`flex items-center ${
                  isSidebarCollapsed ? "justify-center h-10 w-full px-0" : "justify-between px-3.5 py-2.5"
                } rounded-lg transition-all duration-150 text-left ${
                  isActive
                    ? "text-indigo-700 font-semibold bg-indigo-50/80 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"}`}>
                  <item.icon
                    className={`w-4.5 h-4.5 shrink-0 ${
                      isActive ? "text-indigo-600" : "text-slate-500"
                    }`}
                  />
                  {!isSidebarCollapsed && (
                    <span className="text-sm truncate">{item.label}</span>
                  )}
                </div>

                {!isSidebarCollapsed && item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isActive
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Navigation (Shortcuts, Docs, Collapse indicator) */}
        <div className={`p-2 border-t border-slate-100 mt-auto space-y-1 ${isSidebarCollapsed ? "text-center" : ""}`}>
          <button
            onClick={() => setIsShortcutsOpen(true)}
            title={isSidebarCollapsed ? "Shortcuts (?)" : undefined}
            className={`w-full flex items-center ${
              isSidebarCollapsed ? "justify-center h-9 px-0" : "justify-between px-3 py-2"
            } rounded-lg text-left text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors text-xs font-medium cursor-pointer`}
          >
            <div className="flex items-center gap-3">
              <Keyboard className="w-4 h-4 text-slate-500 shrink-0" />
              {!isSidebarCollapsed && <span>Shortcuts</span>}
            </div>
            {!isSidebarCollapsed && (
              <kbd className="font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-semibold">
                ?
              </kbd>
            )}
          </button>

          <Link
            href="/dashboard/docs"
            title={isSidebarCollapsed ? "Documentation" : undefined}
            className={`w-full flex items-center ${
              isSidebarCollapsed ? "justify-center h-9 px-0" : "gap-3 px-3 py-2"
            } rounded-lg text-left text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors text-xs font-medium`}
          >
            <FileText className="w-4 h-4 text-slate-500 shrink-0" />
            {!isSidebarCollapsed && <span>Documentation</span>}
          </Link>

          <Link
            href="/dashboard/support"
            title={isSidebarCollapsed ? "Support & Help" : undefined}
            className={`w-full flex items-center ${
              isSidebarCollapsed ? "justify-center h-9 px-0" : "gap-3 px-3 py-2"
            } rounded-lg text-left text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors text-xs font-medium`}
          >
            <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
            {!isSidebarCollapsed && <span>Support &amp; Help</span>}
          </Link>

          {isSidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="w-full flex items-center justify-center h-9 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Expand Sidebar (Press [)"
              aria-label="Expand Sidebar"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* ─── Main Viewport & Header ─────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 z-20 flex justify-between items-center px-6 transition-all duration-200 shadow-xs gap-4">
          {/* Left: Sidebar Toggle Button & Search Bar */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer"
              title={isSidebarCollapsed ? "Expand Sidebar (Press [)" : "Close Sidebar (Press [)"}
              aria-label="Toggle Sidebar"
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-indigo-600" />
              ) : (
                <PanelLeft className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Search Bar */}
            <div
              onClick={() => setIsCommandOpen(true)}
              className="flex items-center w-72 md:w-80 lg:w-96 relative cursor-pointer group"
            >
              <Search className="absolute left-3 w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              <input
                readOnly
                className="w-full bg-slate-50 border border-slate-200 group-hover:border-indigo-300 rounded-lg py-2 pl-9 pr-14 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-colors cursor-pointer"
                placeholder="Search issues, projects, or press ⌘K..."
                type="text"
              />
              <div className="absolute right-2.5 flex items-center gap-1">
                <span className="font-mono text-[10px] text-slate-500 border border-slate-200 bg-white rounded px-1.5 py-0.5 flex items-center gap-0.5 shadow-2xs font-medium">
                  <Command className="w-2.5 h-2.5" />K
                </span>
              </div>
            </div>
          </div>

          {/* Actions & Profile */}
          <div className="flex items-center gap-2.5">
            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors relative cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white" />
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2.5 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-900">
                      Notifications
                    </span>
                    <span className="font-mono text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                      2 New
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    <div className="p-3.5 hover:bg-slate-50 transition-colors cursor-pointer">
                      <p className="text-xs text-slate-800">
                        <span className="font-semibold text-slate-900">Bob Martinez</span> commented on <span className="text-indigo-600 font-medium">PHX-1042</span>
                      </p>
                      <span className="text-[11px] text-slate-400 mt-1 block">15 mins ago</span>
                    </div>
                    <div className="p-3.5 hover:bg-slate-50 transition-colors cursor-pointer">
                      <p className="text-xs text-slate-800">
                        <span className="font-semibold text-slate-900">AI Assistant</span> generated smart subtasks for <span className="text-indigo-600 font-medium">PHX-1089</span>
                      </p>
                      <span className="text-[11px] text-slate-400 mt-1 block">2 hours ago</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent History Button */}
            <button
              onClick={() => setIsCommandOpen(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Recent History"
            >
              <History className="w-4 h-4" />
            </button>

            {/* Upgrade Plan Button */}
            <button
              onClick={() => setIsUpgradeOpen(true)}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Upgrade</span>
            </button>

            {/* User Profile & Role Switcher */}
            <div className="relative ml-1" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 focus:outline-none cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-xs font-bold text-white shadow-xs">
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-fade-in">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
                    <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {user.role || "Lead Engineer"}
                    </span>
                  </div>

                  <div className="py-1">
                    <div className="px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                      Switch Profile Role (RBAC)
                    </div>
                    {DEMO_USERS.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleSwitchUser(u)}
                        className={`w-full px-4 py-2 text-left flex items-center justify-between text-xs hover:bg-slate-50 transition-colors ${
                          user.email === u.email ? "text-indigo-600 font-semibold bg-indigo-50/50" : "text-slate-700"
                        }`}
                      >
                        <div className="flex-1 truncate">
                          <span className="block truncate font-medium">{u.name}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{u.role}</span>
                        </div>
                        {user.email === u.email && <UserCheck className="w-4 h-4 text-indigo-600" />}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 relative">{children}</main>
      </div>



      {/* ─── Keyboard Shortcuts Help Modal ───────────────── */}
      {isShortcutsOpen && (
        <div
          onClick={() => setIsShortcutsOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Keyboard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Keyboard Shortcuts
                  </h3>
                  <p className="text-xs text-slate-500">
                    Navigate DevFlow effortlessly with quick key commands
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="hidden sm:inline-block font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                  ESC
                </kbd>
                <button
                  onClick={() => setIsShortcutsOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Search inside shortcuts */}
            <div className="px-5 pt-3.5 pb-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={shortcutSearch}
                  onChange={(e) => setShortcutSearch(e.target.value)}
                  placeholder="Filter shortcuts by name or key..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            {/* Shortcuts Content List */}
            <div className="max-h-[60vh] overflow-y-auto p-5 pt-2 space-y-5">
              {filteredShortcuts.map((section, sIdx) => {
                const Icon = section.icon;
                return (
                  <div key={sIdx} className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                      <Icon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{section.category}</span>
                    </div>

                    <div className="bg-slate-50/60 rounded-xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden">
                      {section.shortcuts.map((item, iIdx) => (
                        <div
                          key={iIdx}
                          onClick={() => {
                            if (item.href) {
                              setIsShortcutsOpen(false);
                              router.push(item.href);
                            }
                          }}
                          className={`p-3 flex items-center justify-between text-xs transition-colors ${
                            item.href ? "hover:bg-indigo-50/50 cursor-pointer group" : ""
                          }`}
                        >
                          <span className="text-slate-700 font-medium group-hover:text-indigo-900 transition-colors">
                            {item.description}
                          </span>

                          <div className="flex items-center gap-1.5 shrink-0 ml-3">
                            {item.keys.map((k, kIdx) => (
                              <span key={kIdx} className="flex items-center gap-1">
                                <kbd className="font-mono text-[11px] font-bold bg-white text-slate-800 px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                                  {k}
                                </kbd>
                                {kIdx < item.keys.length - 1 && (
                                  <span className="text-[10px] text-slate-400 font-medium">then</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {filteredShortcuts.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No keyboard shortcuts matching &quot;{shortcutSearch}&quot;
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-[11px] text-slate-500 px-5">
              <span>Press <kbd className="font-mono text-[10px] bg-white border border-slate-200 px-1 py-0.5 rounded font-bold text-slate-700">?</kbd> anywhere to toggle this guide</span>
              <span className="text-indigo-600 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> DevFlow Quick Keys
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Global Command Palette (⌘K) ───────────────── */}
      {isCommandOpen && (
        <div
          onClick={() => setIsCommandOpen(false)}
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Search Input */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/60">
              <Search className="w-5 h-5 text-indigo-600" />
              <input
                autoFocus
                type="text"
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                placeholder="Type a command, search issue, or jump to view..."
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                onClick={() => setIsCommandOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-3">
              {/* Quick Create Action */}
              <div className="px-2 py-1">
                <button
                  onClick={() => {
                    setIsCommandOpen(false);
                    openCreateIssue();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 transition-colors text-xs font-semibold cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-indigo-600" />
                    <span>Create New AI-Assisted Issue</span>
                  </div>
                  <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-700">
                    C
                  </span>
                </button>
              </div>

              {/* Issues Found */}
              {mockIssues.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Issues
                  </div>
                  <div className="space-y-1">
                    {mockIssues.map((issue) => (
                      <Link
                        key={issue.id}
                        href={`/dashboard/issues/${issue.id}`}
                        onClick={() => setIsCommandOpen(false)}
                        className="w-full px-3 py-2.5 text-left rounded-lg hover:bg-slate-100 text-xs text-slate-800 flex items-center justify-between transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="font-mono text-xs font-semibold text-indigo-600">
                            {issue.id}
                          </span>
                          <span className="truncate text-slate-800 font-medium">{issue.title}</span>
                        </div>
                        <span className="text-[10px] uppercase font-mono text-slate-600 px-2 py-0.5 rounded bg-slate-100 shrink-0 ml-2 font-medium">
                          {issue.status.replace("_", " ")}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Items */}
              {quickNavItems.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Navigation
                  </div>
                  <div className="space-y-1">
                    {quickNavItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsCommandOpen(false)}
                          className="w-full px-3 py-2 text-left rounded-lg hover:bg-slate-100 text-xs text-slate-800 flex items-center justify-between transition-colors font-medium"
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 text-indigo-600" />
                            <span>{item.label}</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] font-medium text-slate-500 px-4">
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span>&uarr;&darr; Navigate</span>
                <span>&crarr; Select</span>
                <span>ESC Close</span>
              </div>
              <span className="text-indigo-600 flex items-center gap-1 font-semibold text-xs">
                <Sparkles className="w-3.5 h-3.5" /> DevFlow AI
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Enterprise Upgrade Modal ──────────────────── */}
      {isUpgradeOpen && (
        <div
          onClick={() => setIsUpgradeOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col relative"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsUpgradeOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg bg-slate-100 border border-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="p-8 text-center bg-slate-50 border-b border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                Upgrade to DevFlow Enterprise
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto mt-1">
                Unlock real-time AI code analysis, sprint forecasting, and advanced collaboration tools.
              </p>
            </div>

            {/* Plans Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-white border border-slate-200 flex flex-col justify-between shadow-2xs">
                <div>
                  <span className="text-xs font-mono text-slate-500 uppercase tracking-wider font-semibold">Team Pro</span>
                  <div className="text-2xl font-bold text-slate-900 my-2">
                    $19 <span className="text-xs font-normal text-slate-500">/ seat / month</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600 mt-4">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Up to 25 developers
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> AI Issue Breakdown
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Unlimited Kanban Boards
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => setIsUpgradeOpen(false)}
                  className="mt-6 w-full py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  Current Plan
                </button>
              </div>

              <div className="p-5 rounded-xl bg-white border-2 border-indigo-600 flex flex-col justify-between relative shadow-md">
                <div className="absolute -top-3 right-4 bg-indigo-600 text-white text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                  Recommended
                </div>
                <div>
                  <span className="text-xs font-mono text-indigo-600 uppercase tracking-wider font-bold">Enterprise AI</span>
                  <div className="text-2xl font-bold text-slate-900 my-2">
                    $49 <span className="text-xs font-normal text-slate-500">/ seat / month</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700 mt-4">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-indigo-600" /> Unlimited seats &amp; teams
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-indigo-600" /> Automated PR summaries
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-indigo-600" /> SSO &amp; Custom RBAC roles
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-indigo-600" /> Dedicated SLA support
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => setIsUpgradeOpen(false)}
                  className="mt-6 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Create Issue Modal */}
      <CreateIssueModal />
    </div>
  );
}
