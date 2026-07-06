import React, { useEffect, useState } from "react";
import { AdminService, UserProfile } from "@/services/adminService";
import { useLanguage } from "@/components/common/LanguageContext";
import { Search, UserCheck, UserX, Shield, Eye, Calendar, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UserManager() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  
  // Selected user for details modal
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await AdminService.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users list:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleSuspension = async (user: UserProfile) => {
    const nextStatus = !user.suspended;
    const confirmMsg = nextStatus 
      ? `Are you sure you want to SUSPEND user ${user.name}? They will lose platform access.`
      : `Are you sure you want to ACTIVATE user ${user.name}?`;
    
    if (!confirm(confirmMsg)) return;

    try {
      await AdminService.updateUserSuspensionStatus(user.uid, nextStatus);
      alert(`User account suspension status updated.`);
      
      // Update local state
      setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, suspended: nextStatus } : u));
      if (selectedUser?.uid === user.uid) {
        setSelectedUser(prev => prev ? { ...prev, suspended: nextStatus } : null);
      }
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === "All" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Filtering Header Panel */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white border border-gray-150 p-4 rounded-3xl shrink-0 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search users by name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-10 pr-4 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-xs text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
          >
            <option value="All">All Roles</option>
            <option value="farmer">Farmers</option>
            <option value="customer">Customers</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* Users table */}
      {loading ? (
        <div className="text-center py-20 text-gray-500 font-semibold">
          <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <span>Loading users registry...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-150 rounded-3xl text-gray-400">
          No users match the active criteria.
        </div>
      ) : (
        <div className="bg-white border border-gray-150 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs text-gray-500 font-bold uppercase border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4">Registration</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800 text-sm">{user.name}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Mail size={12} /> {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase ${
                        user.role === "admin"
                          ? "bg-red-50 text-red-700 border-red-100"
                          : user.role === "farmer"
                          ? "bg-green-50 text-green-700 border-green-100"
                          : "bg-blue-50 text-blue-700 border-blue-100"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase ${
                        user.suspended
                          ? "bg-red-100 text-red-700 border-red-200"
                          : "bg-green-100 text-green-700 border-green-200"
                      }`}>
                        {user.suspended ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400 font-medium">
                      {user.createdAt?.seconds 
                        ? new Date(user.createdAt.seconds * 1000).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setSelectedUser(user)}
                        className="text-xs font-semibold py-1 rounded-lg border-gray-200"
                      >
                        <Eye size={12} className="mr-1" /> View Profile
                      </Button>
                      
                      <Button
                        onClick={() => handleToggleSuspension(user)}
                        className={`text-xs font-bold py-1 px-3.5 rounded-lg border ${
                          user.suspended
                            ? "bg-green-700 hover:bg-green-800 text-white"
                            : "bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                        }`}
                      >
                        {user.suspended ? (
                          <>
                            <UserCheck size={12} className="mr-1 inline" /> Activate
                          </>
                        ) : (
                          <>
                            <UserX size={12} className="mr-1 inline" /> Suspend
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Details Modal overlay */}
      {selectedUser && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setSelectedUser(null)} />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-8 border border-gray-150 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            
            {/* Modal header */}
            <div className="border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800">User Profile Details</h3>
              <p className="text-xs text-gray-400 mt-1">Platform Account Verification Identifier: {selectedUser.uid}</p>
            </div>

            {/* Profile fields */}
            <div className="space-y-4 text-sm text-gray-700">
              <div className="flex justify-between items-center border-b pb-2.5">
                <span className="text-gray-400 font-medium">Full Name:</span>
                <span className="font-bold text-gray-800">{selectedUser.name}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2.5">
                <span className="text-gray-400 font-medium">Email Address:</span>
                <span className="font-semibold text-gray-800">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2.5">
                <span className="text-gray-400 font-medium">Platform Role:</span>
                <span className="font-bold capitalize text-green-700">{selectedUser.role}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2.5">
                <span className="text-gray-400 font-medium">Marketplace Seller:</span>
                <span className="font-semibold text-gray-800">{selectedUser.isSeller ? "Yes" : "No"}</span>
              </div>
              {selectedUser.sellerProfile && (
                <>
                  <div className="flex justify-between items-center border-b pb-2.5">
                    <span className="text-gray-400 font-medium">Shop Name:</span>
                    <span className="font-bold text-gray-800">{selectedUser.sellerProfile.businessName}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2.5">
                    <span className="text-gray-400 font-medium">Seller Rating:</span>
                    <span className="font-bold text-amber-500">★ {selectedUser.sellerProfile.rating.toFixed(1)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center border-b pb-2.5">
                <span className="text-gray-400 font-medium">Registration Date:</span>
                <span className="font-medium text-gray-600">
                  {selectedUser.createdAt?.seconds 
                    ? new Date(selectedUser.createdAt.seconds * 1000).toLocaleString()
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2.5">
                <span className="text-gray-400 font-medium">Account Status:</span>
                <span className={`font-bold px-2 py-0.5 rounded border text-xs ${
                  selectedUser.suspended
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-green-50 text-green-700 border-green-200"
                }`}>
                  {selectedUser.suspended ? "Suspended" : "Active"}
                </span>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2 rounded-xl"
              >
                Close
              </Button>
              <Button
                onClick={() => handleToggleSuspension(selectedUser)}
                className={`font-bold px-5 py-2 rounded-xl border ${
                  selectedUser.suspended
                    ? "bg-green-700 hover:bg-green-800 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {selectedUser.suspended ? "Activate User" : "Suspend User"}
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
