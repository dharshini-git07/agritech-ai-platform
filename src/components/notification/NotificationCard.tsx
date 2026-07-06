import React from "react";
import { NotificationData, NotificationPriority, NotificationType } from "@/services/notificationService";
import { useNotifications } from "@/components/common/NotificationContext";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, Brain, Store, CloudSun, Trash2, Check } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotificationCard({ notification }: { notification: NotificationData }) {
  const { markAsRead, deleteNotification } = useNotifications();
  const router = useRouter();

  const getPriorityStyles = (priority: NotificationPriority) => {
    switch (priority) {
      case "Critical":
        return "border-l-4 border-l-red-650 bg-red-50/30 hover:bg-red-50/50";
      case "High":
        return "border-l-4 border-l-amber-500 bg-amber-50/10 hover:bg-amber-50/20";
      case "Medium":
        return "border-l-4 border-l-blue-500 hover:bg-gray-50";
      case "Low":
      default:
        return "border-l-4 border-l-gray-300 hover:bg-gray-50";
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "Success":
        return <CheckCircle2 className="text-green-600 shrink-0" size={18} />;
      case "Warning":
        return <AlertTriangle className="text-amber-500 shrink-0" size={18} />;
      case "Error":
      case "System":
        return <AlertCircle className="text-red-500 shrink-0" size={18} />;
      case "AI Recommendation":
        return <Brain className="text-purple-600 shrink-0" size={18} />;
      case "Marketplace":
        return <Store className="text-emerald-700 shrink-0" size={18} />;
      case "Weather":
        return <CloudSun className="text-sky-500 shrink-0" size={18} />;
      case "Info":
      default:
        return <Info className="text-gray-500 shrink-0" size={18} />;
    }
  };

  const handleCardClick = async () => {
    if (!notification.isRead && notification.id) {
      await markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  return (
    <div 
      className={`relative p-4 rounded-2xl border border-gray-150 transition cursor-pointer flex gap-3 items-start select-none ${getPriorityStyles(notification.priority)} ${
        notification.isRead ? "opacity-75" : ""
      }`}
      onClick={handleCardClick}
    >
      {/* Type category icon */}
      <div className="mt-0.5 shrink-0">
        {getIcon(notification.type)}
      </div>

      {/* Main text block */}
      <div className="flex-1 space-y-1 pr-6">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold text-gray-800 ${!notification.isRead ? "font-extrabold" : ""}`}>
            {notification.title}
          </span>
          <span className="text-[9px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 scale-90">
            {notification.priority}
          </span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed break-words">{notification.message}</p>
        <span className="text-[9px] text-gray-400 font-medium block">
          {notification.createdAt?.seconds 
            ? new Date(notification.createdAt.seconds * 1000).toLocaleString()
            : "Just now"}
        </span>
      </div>

      {/* Actions side bar */}
      <div 
        className="absolute right-2 top-2 flex flex-col gap-1 opacity-60 hover:opacity-100 transition"
        onClick={(e) => e.stopPropagation()}
      >
        {!notification.isRead && notification.id && (
          <button 
            onClick={() => markAsRead(notification.id!)}
            title="Mark as Read"
            className="p-1 text-gray-400 hover:text-green-700 hover:bg-gray-100 rounded-lg transition"
          >
            <Check size={14} />
          </button>
        )}
        {notification.id && (
          <button 
            onClick={() => deleteNotification(notification.id!)}
            title="Delete Notification"
            className="p-1 text-gray-400 hover:text-red-650 hover:bg-gray-100 rounded-lg transition"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
