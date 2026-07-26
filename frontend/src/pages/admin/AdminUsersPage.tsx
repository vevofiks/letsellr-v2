import React, { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  Eye,
  X,
  Mail,
  MapPin,
  Building,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { adminService, type AdminUser, type VerificationRequest } from "@/services/adminService";

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"all" | "kyc" | "agencies" | "suspended">("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Selected User Modal state
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userModalOpen, setUserModalOpen] = useState<boolean>(false);

  // Status Change Confirmation Modal state
  const [statusModalOpen, setStatusModalOpen] = useState<boolean>(false);
  const [targetStatus, setTargetStatus] = useState<"active" | "suspended" | "inactive">("active");
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Load Users and Verifications from API
  const fetchData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const [usersData, verificationsData] = await Promise.all([
        adminService.getUsers(),
        adminService.getVerificationRequests(),
      ]);

      setUsers(usersData);
      setVerifications(verificationsData);
    } catch (err: any) {
      console.error("Failed to load user management data:", err);
      toast.error(err.response?.data?.detail || "Failed to load user accounts.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle User Status Change (Suspend / Activate)
  const handleUpdateUserStatus = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const updated = await adminService.updateUserStatus(selectedUser.id, targetStatus);
      
      toast.success(
        `User "${updated.name}" status updated to ${updated.status.toUpperCase()}.`
      );

      // Update state locally
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? { ...u, status: updated.status } : u))
      );
      setStatusModalOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      console.error("Status update error:", err);
      toast.error(err.response?.data?.detail || "Failed to update user status.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter users based on search, tab, role, and status
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery)) ||
      (u.location_city && u.location_city.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === "all" || u.role.toLowerCase() === roleFilter.toLowerCase();
    const matchesStatus = statusFilter === "all" || u.status.toLowerCase() === statusFilter.toLowerCase();

    let matchesTab = true;
    if (activeTab === "kyc") {
      matchesTab = u.verification_status === "pending";
    } else if (activeTab === "agencies") {
      matchesTab = u.role === "agency" || u.role === "owner";
    } else if (activeTab === "suspended") {
      matchesTab = u.status === "suspended";
    }

    return matchesSearch && matchesRole && matchesStatus && matchesTab;
  });

  // Reset pagination when search query or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter, activeTab, pageSize]);

  // Pagination calculations
  const totalUsers = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return <span style={{background:'#08060d',color:'#fff'}} className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">Super Admin</span>;
      case "agency":
        return <span style={{background:'rgba(170,59,255,0.1)',color:'#7c3aed',border:'1px solid rgba(170,59,255,0.3)'}} className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">Agency</span>;
      case "owner":
        return <span style={{background:'#D9F7E9',color:'#0B6E4F',border:'1px solid rgba(35,210,131,0.3)'}} className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">Owner</span>;
      default:
        return <span style={{background:'#f1f5f9',color:'#6b6375',border:'1px solid #e2e8f0'}} className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">Seeker</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return (
          <span style={{background:'#D9F7E9',color:'#0B6E4F',border:'1px solid rgba(35,210,131,0.3)'}} className="text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{background:'#23D283'}} />
            Active
          </span>
        );
      case "suspended":
        return (
          <span style={{background:'rgba(239,68,68,0.08)',color:'#ef4444',border:'1px solid rgba(239,68,68,0.2)'}} className="text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Suspended
          </span>
        );
      default:
        return (
          <span style={{background:'#f1f5f9',color:'#6B7280'}} className="text-[10px] font-black px-2 py-0.5 rounded-full capitalize">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Users & Agencies Management
            </h1>
            <span className="bg-slate-100 text-slate-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-slate-200">
              {users.length} Total Users
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Monitor platform accounts, verify identity documents, and manage permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[#086942]" : ""}`} />
            <span>Sync Accounts</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Total Accounts
            </span>
            <span className="text-xl font-black text-slate-900 leading-none block mt-0.5">
              {users.length}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 text-[#086942] flex items-center justify-center shrink-0 border border-emerald-100">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Active Users
            </span>
            <span className="text-xl font-black text-slate-900 leading-none block mt-0.5">
              {users.filter((u) => u.status === "active").length}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Owners & Agencies
            </span>
            <span className="text-xl font-black text-slate-900 leading-none block mt-0.5">
              {users.filter((u) => u.role === "agency" || u.role === "owner").length}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <UserX className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Suspended Accounts
            </span>
            <span className="text-xl font-black text-slate-900 leading-none block mt-0.5">
              {users.filter((u) => u.status === "suspended").length}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter Container */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{border:'1px solid oklch(0.922 0 0)',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 pb-0 overflow-x-auto" style={{borderBottom:'1px solid oklch(0.922 0 0)'}}>
          {([
            { id: 'all' as const, label: 'All Accounts', count: users.length, warning: false, danger: false },
            { id: 'agencies' as const, label: 'Owners & Agencies', count: users.filter((u) => u.role === 'agency' || u.role === 'owner').length, warning: false, danger: false },
            { id: 'kyc' as const, label: 'Verification Queue', count: verifications.length || users.filter((u) => u.verification_status === 'pending').length, warning: true, danger: false },
            { id: 'suspended' as const, label: 'Suspended', count: users.filter((u) => u.status === 'suspended').length, warning: false, danger: true },
          ]).map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3.5 pb-3 pt-1 text-[13px] font-semibold whitespace-nowrap cursor-pointer transition-all border-b-2 -mb-px"
                style={{
                  borderBottomColor: active ? '#23D283' : 'transparent',
                  color: active ? '#0B6E4F' : '#6b6375',
                  background: 'transparent',
                }}
              >
                {tab.label}
                <span
                  className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                  style={tab.warning
                    ? {background:'#FDE68A', color:'#92400E'}
                    : tab.danger
                    ? {background:'rgba(239,68,68,0.1)', color:'#ef4444'}
                    : active
                    ? {background:'#D9F7E9', color:'#0B6E4F'}
                    : {background:'#f1f5f9', color:'#6B7280'}
                  }
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Inputs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{color:'#6B7280'}} />
            <input
              type="text"
              placeholder="Search by name, email, phone, or city…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl pl-10 pr-4 py-2.5 text-[13px] font-medium transition-all focus:outline-none"
              style={{background:'#f1f5f9', border:'1px solid #e2e8f0', color:'#08060d'}}
              onFocus={(e) => { e.currentTarget.style.background='#fff'; e.currentTarget.style.borderColor='#23D283'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(35,210,131,0.12)'; }}
              onBlur={(e) => { e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.boxShadow='none'; }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{color:'#6B7280'}}>
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl px-3 py-2.5 text-[13px] font-semibold focus:outline-none transition-all cursor-pointer"
              style={{background:'#f1f5f9', border:'1px solid #e2e8f0', color:'#08060d'}}
            >
              <option value="all">All Roles</option>
              <option value="admin">Super Admin</option>
              <option value="agency">Agency</option>
              <option value="owner">Owner / Landlord</option>
              <option value="user">Seeker / Client</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl px-3 py-2.5 text-[13px] font-semibold focus:outline-none transition-all cursor-pointer"
              style={{background:'#f1f5f9', border:'1px solid #e2e8f0', color:'#08060d'}}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3">
          <div className="h-8 w-8 border-3 border-[#086942] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Loading Platform Accounts...
          </p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto border border-slate-200">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">
            No User Accounts Found
          </h3>
          <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
            No user records match your selected filters or search parameters.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4 sm:px-6">User / Account</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Joined</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* User Profile Cell */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-[#086942] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                          {u.name ? u.name[0].toUpperCase() : "U"}
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-slate-900 block leading-tight">
                            {u.name}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Mail className="h-3 w-3 text-slate-400" />
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role Cell */}
                    <td className="py-3.5 px-4">
                      {getRoleBadge(u.role)}
                    </td>

                    {/* Location Cell */}
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1 text-slate-700 font-semibold">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {u.location_city || "HQ"}
                      </span>
                    </td>

                    {/* Status Cell */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(u.status)}
                    </td>

                    {/* Joined Date Cell */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] font-semibold">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    {/* Action Buttons Cell */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Inspect Profile Button */}
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setUserModalOpen(true);
                          }}
                          className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                          title="View Profile Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {/* Toggle Suspend/Activate Button */}
                        {u.role !== "admin" && (
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setTargetStatus(u.status === "active" ? "suspended" : "active");
                              setStatusModalOpen(true);
                            }}
                            className={`h-8 px-3 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                              u.status === "active"
                                ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                                : "bg-emerald-50 hover:bg-emerald-100 text-[#086942] border border-emerald-200"
                            }`}
                          >
                            {u.status === "active" ? (
                              <>
                                <UserX className="h-3.5 w-3.5" />
                                <span>Suspend</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3.5 w-3.5" />
                                <span>Activate</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5"
            style={{ borderTop: "1px solid oklch(0.922 0 0)", background: "#fafafa" }}
          >
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
              <span>
                Showing <strong className="text-slate-900 font-bold">{totalUsers > 0 ? startIndex + 1 : 0}</strong> to{" "}
                <strong className="text-slate-900 font-bold">{Math.min(startIndex + pageSize, totalUsers)}</strong> of{" "}
                <strong className="text-slate-900 font-bold">{totalUsers}</strong> accounts
              </span>
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-[11px]">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce<(number | string)[]>((acc, page, index, array) => {
                    if (index > 0 && page - (array[index - 1] as number) > 1) {
                      acc.push("...");
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    typeof item === "number" ? (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(item)}
                        className={`h-8 w-8 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                          currentPage === item
                            ? "bg-[#23D283] text-white shadow-2xs"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {item}
                      </button>
                    ) : (
                      <span key={idx} className="px-1 text-slate-400 text-xs font-bold">
                        {item}
                      </span>
                    )
                  )}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 px-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: User Profile Inspect Drawer/Modal */}
      {userModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-[#086942] text-white flex items-center justify-center font-black text-base shadow-sm">
                  {selectedUser.name ? selectedUser.name[0].toUpperCase() : "U"}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {selectedUser.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setUserModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Account Details Box */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/70 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Email Address</span>
                <span className="font-extrabold text-slate-900">{selectedUser.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Phone Number</span>
                <span className="font-extrabold text-slate-900">{selectedUser.phone || "Not provided"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-400 uppercase text-[10px]">City / Location</span>
                <span className="font-extrabold text-slate-900">{selectedUser.location_city || "HQ"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Verification Status</span>
                <span className="font-extrabold capitalize text-slate-900">{selectedUser.verification_status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Joined Date</span>
                <span className="font-extrabold text-slate-900">{new Date(selectedUser.created_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setUserModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Status Toggle Confirmation Modal */}
      {statusModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  targetStatus === "suspended" ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-[#086942]"
                }`}
              >
                {targetStatus === "suspended" ? <UserX className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {targetStatus === "suspended" ? "Suspend User Account" : "Activate User Account"}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Confirm account status update for {selectedUser.name}.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <span className="font-extrabold block">{selectedUser.name} ({selectedUser.email})</span>
              <p className="text-[11px] text-slate-500">
                {targetStatus === "suspended"
                  ? "Suspending this user will prevent them from signing in or posting listings."
                  : "Reactivating this account will restore full access to their dashboard."}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setStatusModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUserStatus}
                disabled={actionLoading}
                className={`font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 ${
                  targetStatus === "suspended"
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-[#086942] hover:bg-[#065334] text-white"
                }`}
              >
                {actionLoading ? "Updating..." : `Confirm ${targetStatus === "suspended" ? "Suspension" : "Activation"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
