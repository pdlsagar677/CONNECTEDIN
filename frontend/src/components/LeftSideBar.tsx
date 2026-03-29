import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Bookmark,
  Heart,
  Home,
  LogOut,
  MessageCircle,
  PlusSquare,
  Search,
  TrendingUp,
  User,
  Menu,
  X,
  Moon,
  Sun
} from "lucide-react";
import useTheme from "../hooks/useTheme";
import CreatePost from "./CreatePost";
import SearchPanel from "./SearchPanel";
import NotificationsDropdown from "./NotificationsDropdown";
import { setAuthUser } from "@/redux/authSlice";
import { setPosts, setSelectedPost } from "@/redux/postSlice";
import { RootState } from "@/redux/store";
import API from "@/lib/api";

const LeftSidebar: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user } = useSelector((store: RootState) => store.auth);
  const { likeNotification } = useSelector(
    (store: RootState) => store.realTimeNotification || { likeNotification: [] }
  );
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const notificationCount = useSelector((store: RootState) => store.notification?.unreadCount || 0);
  const unreadCounts = useSelector((store: RootState) => store.chat?.unreadCounts || {});
  const totalUnreadMessages = Object.values(unreadCounts).reduce((a: number, b: number) => a + b, 0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const logoutHandler = async () => {
    try {
      const res = await API.get("/users/logout");
      if (res.data.success) {
        dispatch(setAuthUser(null));
        dispatch(setSelectedPost(null));
        dispatch(setPosts([]));
        navigate("/login");
        toast.success(res.data.message);
        setMobileMenuOpen(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Logout failed");
    }
  };

  const handleNavClick = (textType: string) => {
    switch (textType) {
      case "Logout":
        logoutHandler();
        break;
      case "Create":
        setOpen(true);
        setMobileMenuOpen(false);
        break;
      case "Profile":
        if (user?._id) {
          navigate(`/profile/${user._id}`);
          setMobileMenuOpen(false);
        }
        break;
      case "Home":
        navigate("/");
        setMobileMenuOpen(false);
        break;
      case "Messages":
        navigate("/chat");
        setMobileMenuOpen(false);
        break;
      case "Search":
        setSearchOpen(true);
        setMobileMenuOpen(false);
        break;
      case "Explore":
        navigate("/explore");
        setMobileMenuOpen(false);
        break;
      case "Saved":
        navigate("/saved");
        setMobileMenuOpen(false);
        break;
      case "Notifications":
        setNotificationsOpen(true);
        setMobileMenuOpen(false);
        break;
    }
  };

  const navItems = [
    { icon: <Home className="w-6 h-6" />, text: "Home", path: "/" },
    { icon: <Search className="w-6 h-6" />, text: "Search", action: "search" },
    { icon: <TrendingUp className="w-6 h-6" />, text: "Explore", path: "/explore" },
    { icon: <MessageCircle className="w-6 h-6" />, text: "Messages", path: "/chat" },
    { icon: <Heart className="w-6 h-6" />, text: "Notifications", action: "notifications" },
    { icon: <PlusSquare className="w-6 h-6" />, text: "Create", action: "create" },
    { icon: <Bookmark className="w-6 h-6" />, text: "Saved", path: "/saved" },
    {
      icon: user?.profilePicture ? (
        <img
          src={user.profilePicture}
          alt="Profile"
          className="w-6 h-6 rounded-full object-cover"
        />
      ) : (
        <User className="w-6 h-6" />
      ),
      text: "Profile",
      path: user?._id ? `/profile/${user._id}` : "#",
    },
    { icon: <LogOut className="w-6 h-6" />, text: "Logout", action: "logout" },
  ];

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 hidden md:flex flex-col z-50">
        {/* Logo Section */}
        <div className="flex items-center gap-2 px-6 py-6 border-b border-gray-100 dark:border-gray-800">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1
            className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent cursor-pointer"
            onClick={() => navigate("/")}
          >
            ConnectIN
          </h1>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                if (item.path) {
                  navigate(item.path);
                } else if (item.action === "search") {
                  setSearchOpen(true);
                } else if (item.action === "notifications") {
                  setNotificationsOpen(true);
                } else if (item.action === "create") {
                  setOpen(true);
                } else if (item.action === "logout") {
                  logoutHandler();
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-800 transition-all duration-200 group"
            >
              <div className="text-gray-600 dark:text-gray-300 group-hover:text-blue-600 transition-colors">
                {item.icon}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600">
                {item.text}
              </span>
              
              {/* Notification Badge */}
              {item.text === "Notifications" && (notificationCount > 0 || likeNotification.length > 0) && (
                <span className="ml-auto bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full px-2 py-0.5">
                  {notificationCount || likeNotification.length}
                </span>
              )}
              {item.text === "Messages" && totalUnreadMessages > 0 && (
                <span className="ml-auto bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                  {totalUnreadMessages}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className='flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-800 transition-all duration-200 group mb-2'
        >
          <div className='text-gray-600 dark:text-gray-300'>
            {theme === 'dark' ? <Sun className='w-6 h-6' /> : <Moon className='w-6 h-6' />}
          </div>
          <span className='text-sm font-medium text-gray-700 dark:text-gray-200'>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>

        {/* User Info at Bottom */}
        <div className='flex items-center gap-2'>
                <Link to={`/profile/${user?._id}`}>
                  <div className="relative">
                    {user?.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt="profile"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                    )}
                  </div>
                </Link>
                <div>
                  <h1 className='font-semibold text-sm dark:text-gray-100'>
                    <Link to={`/profile/${user?._id}`}>{user?.username}</Link>
                  </h1>
                  <span className='text-gray-600 dark:text-gray-400 text-sm'>{user?.bio || 'Bio here...'}</span>
                </div>
              </div>
      </aside>

      {/* Mobile Header - Same as before */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm md:hidden h-14 px-4">
        <div className="flex justify-between items-center h-full">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1
              className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent cursor-pointer"
              onClick={() => navigate("/")}
            >
ConnectIn            </h1>
          </div>

          {/* Mobile Icons */}
          <div className="flex items-center gap-1">
            {/* Search Icon */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </button>

            {/* Notifications Icon */}
            <button
              onClick={() => setNotificationsOpen(true)}
              className="relative p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors"
              aria-label="Notifications"
            >
              <Heart className="w-5 h-5 text-gray-600" />
              {(notificationCount > 0 || likeNotification.length > 0) && (
                <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {notificationCount || likeNotification.length}
                </span>
              )}
            </button>

            {/* Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu Content */}
          <div className="absolute top-14 right-0 w-72 bg-white dark:bg-gray-900 shadow-2xl rounded-bl-2xl rounded-br-2xl animate-slideInRight max-h-[calc(100vh-56px)] overflow-y-auto">
            <div className="py-2">
              {/* User Info — tap to go to profile */}
              <div
                className="px-4 py-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
                onClick={() => { setMobileMenuOpen(false); navigate(`/profile/${user?._id}`); }}
              >
                <div className="flex items-center gap-3">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt="Profile"
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{user?.username || "User"}</p>
                  </div>
                </div>
              </div>

              {/* Navigation Items */}
              {navItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (item.path) {
                      navigate(item.path);
                    } else if (item.action === "search") {
                      setSearchOpen(true);
                    } else if (item.action === "notifications") {
                      setNotificationsOpen(true);
                    } else if (item.action === "create") {
                      setOpen(true);
                    } else if (item.action === "logout") {
                      logoutHandler();
                    }
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <div className="text-gray-600 dark:text-gray-300 group-hover:text-blue-600 transition-colors">
                    {item.icon}
                  </div>
                  <span className="text-gray-700 dark:text-gray-200 group-hover:text-blue-600 font-medium flex-1 text-left">
                    {item.text}
                  </span>
                  {item.text === "Notifications" && (notificationCount > 0 || likeNotification.length > 0) && (
                    <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full px-2 py-0.5">
                      {notificationCount || likeNotification.length}
                    </span>
                  )}
                </button>
              ))}

              {/* Theme toggle in mobile menu */}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors group"
              >
                <div className="text-gray-600 dark:text-gray-300">
                  {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                </div>
                <span className="text-gray-700 dark:text-gray-200 font-medium flex-1 text-left">
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spacing div removed — MainLayout handles md:ml-64 */}

      {/* Modals */}
      {open && <CreatePost open={open} setOpen={setOpen} />}
      <SearchPanel open={searchOpen} setOpen={setSearchOpen} />
      <NotificationsDropdown open={notificationsOpen} setOpen={setNotificationsOpen} />

      {/* Add animation keyframes */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default LeftSidebar;