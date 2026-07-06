import React, { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/components/common/NotificationContext";
import NotificationCard from "./NotificationCard";
import { useLanguage } from "@/components/common/LanguageContext";
import { Bell, X, Check, Trash2, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotificationBell() {
  const { 
    notifications, 
    unreadCount, 
    markAllAsRead, 
    clearAllNotifications 
  } = useNotifications();

  const { language, t } = useLanguage();
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  
  const drawerRef = useRef<HTMLDivElement>(null);

  // Localized string helper map inside bell context
  const getLabel = (key: string): string => {
    const dict: Record<string, Record<string, string>> = {
      en: {
        title: "Notifications",
        search: "Search notifications...",
        clearAll: "Clear All",
        markAllRead: "Mark All Read",
        type: "Type",
        priority: "Priority",
        all: "All",
        empty: "No notifications found."
      },
      ta: {
        title: "அறிவிப்புகள்",
        search: "அறிவிப்புகளைத் தேடுக...",
        clearAll: "அழிக்கவும்",
        markAllRead: "அனைத்தையும் படித்ததாகக் குறி",
        type: "வகை",
        priority: "முன்னுரிமை",
        all: "அனைத்தும்",
        empty: "அறிவிப்புகள் எதுவும் இல்லை."
      },
      hi: {
        title: "अधिसूचनाएं",
        search: "अधिसूचनाएं खोजें...",
        clearAll: "साफ़ करें",
        markAllRead: "सभी पढ़े गए मार्क करें",
        type: "प्रकार",
        priority: "प्राथमिकता",
        all: "सभी",
        empty: "कोई अधिसूचना नहीं मिली।"
      }
    };
    const lang = language === "ta" || language === "hi" ? language : "en";
    return dict[lang][key] || dict["en"][key];
  };

  // Close drawer on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isOpen && drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch = 
      notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === "All" || notif.type === typeFilter;
    const matchesPriority = priorityFilter === "All" || notif.priority === priorityFilter;

    return matchesSearch && matchesType && matchesPriority;
  });

  return (
    <>
      {/* Bell Button trigger */}
      <button 
        onClick={() => setIsOpen(true)}
        className="relative p-2.5 hover:bg-gray-100/75 text-gray-600 rounded-full transition focus:outline-none select-none cursor-pointer"
        aria-label="Toggle notifications drawer"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-600 text-white font-extrabold text-[9px] min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 border-2 border-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Slide Drawer panel overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            ref={drawerRef}
            className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-350"
          >
            
            {/* Header segment */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="text-green-700" size={20} />
                <h3 className="font-bold text-gray-800 text-lg">{getLabel("title")}</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-50 text-red-700 text-xs font-black px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Operations controls block */}
            <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-100 flex gap-2 justify-between items-center shrink-0">
              <Button
                variant="outline"
                size="xs"
                onClick={() => markAllAsRead()}
                disabled={unreadCount === 0}
                className="text-xs font-semibold py-1 rounded-lg border-gray-200 text-gray-600"
              >
                <Check size={12} className="mr-1" /> {getLabel("markAllRead")}
              </Button>
              
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  if (confirm("Are you sure you want to clear all notification alerts?")) {
                    clearAllNotifications();
                  }
                }}
                disabled={notifications.length === 0}
                className="text-xs font-bold py-1 rounded-lg border-red-200 text-red-650 hover:bg-red-50"
              >
                <Trash2 size={12} className="mr-1" /> {getLabel("clearAll")}
              </Button>
            </div>

            {/* Filtering search blocks */}
            <div className="p-4 bg-white border-b border-gray-100 space-y-3 shrink-0">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-450" size={14} />
                <input
                  type="text"
                  placeholder={getLabel("search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-150 rounded-xl pl-9 pr-4 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white"
                />
              </div>

              {/* Advanced select filters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <SlidersHorizontal size={10} />
                    <span>{getLabel("type")}</span>
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-150 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none"
                  >
                    <option value="All">{getLabel("all")}</option>
                    <option value="Success">Success</option>
                    <option value="Info">Info</option>
                    <option value="Warning">Warning</option>
                    <option value="Error">Error</option>
                    <option value="AI Recommendation">AI Recommendation</option>
                    <option value="Marketplace">Marketplace</option>
                    <option value="Weather">Weather</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <SlidersHorizontal size={10} />
                    <span>{getLabel("priority")}</span>
                  </label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-150 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none"
                  >
                    <option value="All">{getLabel("all")}</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notifications scroll list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0 bg-gray-50/20">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-20 text-gray-400 text-xs">
                  {getLabel("empty")}
                </div>
              ) : (
                filteredNotifications.map((notif) => (
                  <NotificationCard key={notif.id} notification={notif} />
                ))
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
