import React, { useState, useEffect } from "react";
import {
  Users,
  User,
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  Eye,
  X,
  Mail,
  MapPin,
  Building2,
  ShieldCheck,
  Clock,
  Calendar,
  Phone,
  Briefcase,
  Globe,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { adminService, type AdminUser } from "@/services/adminService";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"all" | "seekers" | "kyc" | "agencies" | "suspended">("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Selected User Modal state
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userModalOpen, setUserModalOpen] = useState<boolean>(false);

  const [statusModalOpen, setStatusModalOpen] = useState<boolean>(false);
  const [targetStatus, setTargetStatus] = useState<"active" | "suspended" | "inactive">("active");
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Limits Modal state
  const [limitsModalOpen, setLimitsModalOpen] = useState<boolean>(false);
  const [limitsData, setLimitsData] = useState<any>(null);
  const [limitsLoading, setLimitsLoading] = useState<boolean>(false);

  const fetchUserLimits = async (userId: string) => {
    try {
      setLimitsLoading(true);
      setLimitsModalOpen(true);
      const data = await adminService.getUserLimit(userId);
      setLimitsData({ ...data, note: "", reset_usage: false });
    } catch (err: any) {
      toast.error("Failed to load user limits");
      setLimitsModalOpen(false);
    } finally {
      setLimitsLoading(false);
    }
  };

  const handleUpdateLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !limitsData) return;
    try {
      setActionLoading(true);
      const payload = {
        msg_limit: Number(limitsData.msg_limit),
        reset_usage: limitsData.reset_usage || false,
        note: limitsData.note || "System updated",
      };
      const updated = await adminService.updateUserLimit(selectedUser.id, payload);
      setLimitsData({ ...updated, note: "", reset_usage: false });
      toast.success("Limits updated successfully.");
      setLimitsModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update limits.");
    } finally {
      setActionLoading(false);
    }
  };

  // Load Users and Verifications from API
  const fetchData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const usersData = await adminService.getUsers();
      setUsers(usersData);
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

      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u))
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

  // Helper to check if a user is pending verification review
  const isPendingUser = (u: AdminUser) =>
    u.status === "pending" ||
    u.verification_status === "pending" ||
    u.verification_status === "review_request";

  // Filter users (exclude admin role)
  const nonAdminUsers = users.filter((u) => u.role !== "admin");

  const filteredUsers = nonAdminUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery)) ||
      (u.location_city && u.location_city.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === "all" || u.role.toLowerCase() === roleFilter.toLowerCase();
    
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "pending"
        ? isPendingUser(u)
        : u.status.toLowerCase() === statusFilter.toLowerCase();

    let matchesTab = true;
    if (activeTab === "seekers") {
      matchesTab = u.role !== "agency" && u.role !== "owner";
    } else if (activeTab === "kyc") {
      matchesTab = isPendingUser(u);
    } else if (activeTab === "agencies") {
      matchesTab = u.role === "agency" || u.role === "owner";
    } else if (activeTab === "suspended") {
      matchesTab = u.status === "suspended" || u.verification_status === "rejected";
    }

    return matchesSearch && matchesRole && matchesStatus && matchesTab;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter, activeTab, pageSize]);

  const totalUsers = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case "agency":
        return <Badge className="bg-purple-100 text-purple-900 border border-purple-200 text-[9.5px] font-black uppercase">Agency</Badge>;
      case "owner":
        return <Badge className="bg-emerald-50 text-[#014645] border border-emerald-200 text-[9.5px] font-black uppercase">Owner</Badge>;
      default:
        return <Badge variant="outline" className="text-[9.5px] font-black uppercase">Seeker</Badge>;
    }
  };

  const getStatusBadge = (u: AdminUser) => {
    if (u.status === "suspended" || u.verification_status === "rejected") {
      return <Badge className="bg-rose-50 text-rose-700 border border-rose-200 text-[9.5px] font-black uppercase">Suspended</Badge>;
    }
    if (isPendingUser(u)) {
      return <Badge className="bg-amber-50 text-amber-800 border border-amber-200 text-[9.5px] font-black uppercase">Pending</Badge>;
    }
    return <Badge className="bg-emerald-50 text-[#014645] border border-emerald-200 text-[9.5px] font-black uppercase">Active</Badge>;
  };

  return (
    <div className="space-y-6 font-sans text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight my-0">
              Users & Agencies Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium -mt-4!">
            Monitor accounts, verify agency credentials, and manage user statuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-lg border border-slate-200/80 shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[#014645]" : ""}`} />
            <span>Sync Accounts</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
        <Card
          onClick={() => setActiveTab("all")}
          className={`py-0 rounded-lg shadow-2xs border-slate-200/80 bg-white hover:border-blue-300 transition-all cursor-pointer ${
            activeTab === "all" ? "ring-2 ring-blue-500/20 border-blue-400" : ""
          }`}
        >
          <CardContent className="p-3 sm:p-3.5 space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-wider text-slate-400 truncate">Total Accounts</span>
              <div className="size-7 sm:size-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/60">
                <Users className="size-3.5 sm:size-4" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pt-0.5">
              <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">{nonAdminUsers.length}</p>
              <span className="inline-flex items-center gap-1 text-[9.5px] sm:text-[10px] font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100/80 w-fit">
                <Users className="size-2.5" /> Accounts
              </span>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab("seekers")}
          className={`py-0 rounded-lg shadow-2xs border-slate-200/80 bg-white hover:border-teal-300 transition-all cursor-pointer ${
            activeTab === "seekers" ? "ring-2 ring-teal-500/20 border-teal-400" : ""
          }`}
        >
          <CardContent className="p-3 sm:p-3.5 space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-wider text-slate-400 truncate">Seekers / Clients</span>
              <div className="size-7 sm:size-8 rounded-md bg-teal-50 text-[#014645] flex items-center justify-center shrink-0 border border-teal-200/60">
                <User className="size-3.5 sm:size-4" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pt-0.5">
              <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                {nonAdminUsers.filter((u) => u.role !== "agency" && u.role !== "owner").length}
              </p>
              <span className="inline-flex items-center gap-1 text-[9.5px] sm:text-[10px] font-extrabold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded-md border border-teal-100/80 w-fit">
                <User className="size-2.5" /> Seekers
              </span>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab("agencies")}
          className={`py-0 rounded-lg shadow-2xs border-slate-200/80 bg-white hover:border-purple-300 transition-all cursor-pointer ${
            activeTab === "agencies" ? "ring-2 ring-purple-500/20 border-purple-400" : ""
          }`}
        >
          <CardContent className="p-3 sm:p-3.5 space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-wider text-slate-400 truncate">Owners & Agencies</span>
              <div className="size-7 sm:size-8 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200/60">
                <Building2 className="size-3.5 sm:size-4" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pt-0.5">
              <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                {nonAdminUsers.filter((u) => u.role === "agency" || u.role === "owner").length}
              </p>
              <span className="inline-flex items-center gap-1 text-[9.5px] sm:text-[10px] font-extrabold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-100/80 w-fit">
                <Building2 className="size-2.5" /> Partners
              </span>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab("kyc")}
          className={`py-0 rounded-lg shadow-2xs border-slate-200/80 bg-white hover:border-amber-300 transition-all cursor-pointer ${
            activeTab === "kyc" ? "ring-2 ring-amber-500/20 border-amber-400" : ""
          }`}
        >
          <CardContent className="p-3 sm:p-3.5 space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-wider text-slate-400 truncate">Verification Queue</span>
              <div className="size-7 sm:size-8 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/60">
                <ShieldCheck className="size-3.5 sm:size-4" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pt-0.5">
              <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                {nonAdminUsers.filter(isPendingUser).length}
              </p>
              <span className="inline-flex items-center gap-1 text-[9.5px] sm:text-[10px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100/80 w-fit">
                <Clock className="size-2.5" /> Pending
              </span>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab("suspended")}
          className={`py-0 rounded-lg shadow-2xs border-slate-200/80 bg-white hover:border-rose-300 transition-all cursor-pointer ${
            activeTab === "suspended" ? "ring-2 ring-rose-500/20 border-rose-400" : ""
          }`}
        >
          <CardContent className="p-3 sm:p-3.5 space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-wider text-slate-400 truncate">Suspended</span>
              <div className="size-7 sm:size-8 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200/60">
                <UserX className="size-3.5 sm:size-4" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pt-0.5">
              <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                {nonAdminUsers.filter((u) => u.status === "suspended" || u.verification_status === "rejected").length}
              </p>
              <span className="inline-flex items-center gap-1 text-[9.5px] sm:text-[10px] font-extrabold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100/80 w-fit">
                <UserX className="size-2.5" /> Blocked
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Search Container */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="flex items-center gap-1 border-b border-slate-200/80 px-3 sm:px-4 pt-3 bg-slate-50/50 overflow-x-auto scrollbar-none whitespace-nowrap">
          {([
            { id: 'all' as const, label: 'All Accounts', count: nonAdminUsers.length },
            { id: 'seekers' as const, label: 'Seekers', count: nonAdminUsers.filter((u) => u.role !== 'agency' && u.role !== 'owner').length },
            { id: 'agencies' as const, label: 'Owners & Agencies', count: nonAdminUsers.filter((u) => u.role === 'agency' || u.role === 'owner').length },
            { id: 'kyc' as const, label: 'Verification Queue', count: nonAdminUsers.filter(isPendingUser).length },
            { id: 'suspended' as const, label: 'Suspended', count: nonAdminUsers.filter((u) => u.status === 'suspended' || u.verification_status === 'rejected').length },
          ]).map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-black rounded-t-lg border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  active
                    ? "border-[#014645] text-[#014645] bg-white shadow-2xs"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>{tab.label}</span>
                <Badge variant={active ? "secondary" : "outline"} className="text-[9px] px-1.5 py-0 shrink-0">
                  {tab.count}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Search Inputs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-lg pl-10 pr-4 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#014645] transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer truncate"
            >
              <option value="all">All Roles</option>
              <option value="agency">Agency</option>
              <option value="owner">Owner</option>
              <option value="user">Seeker / Client</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer truncate"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending Review</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center space-y-3">
          <div className="h-7 w-7 border-2 border-[#014645] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Loading Accounts...
          </p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center space-y-3 shadow-2xs flex flex-col items-center justify-center">
          <div className="h-12 w-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 my-0 text-center">
            No User Accounts Found
          </h3>
          <p className="text-xs text-slate-500 font-medium max-w-md text-center my-0">
            No user records match your selected filters.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4 sm:px-6">User / Account</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[#014645] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
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

                    <td className="py-3 px-4">
                      {getRoleBadge(u.role)}
                    </td>

                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1 text-slate-700 font-semibold">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {u.location_city || "HQ"}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {getStatusBadge(u)}
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px] font-semibold">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
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
                        
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            fetchUserLimits(u.id);
                          }}
                          className="h-8 w-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center cursor-pointer transition-colors"
                          title="Manage Message Limits"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>

                        {u.role !== "admin" && (
                          <div className="flex items-center gap-1.5">
                            {isPendingUser(u) ? (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setTargetStatus("active");
                                    setStatusModalOpen(true);
                                  }}
                                  className="h-8 px-2.5 rounded-lg font-bold text-xs flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-[#014645] border border-emerald-200 transition-all cursor-pointer"
                                  title="Approve and activate account"
                                >
                                  <UserCheck className="h-3.5 w-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setTargetStatus("suspended");
                                    setStatusModalOpen(true);
                                  }}
                                  className="h-8 px-2.5 rounded-lg font-bold text-xs flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all cursor-pointer"
                                  title="Reject and suspend account"
                                >
                                  <UserX className="h-3.5 w-3.5" />
                                  <span>Reject</span>
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setTargetStatus(u.status === "active" ? "suspended" : "active");
                                  setStatusModalOpen(true);
                                }}
                                className={`h-8 px-3 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                                  u.status === "active"
                                    ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                                    : "bg-emerald-50 hover:bg-emerald-100 text-[#014645] border border-emerald-200"
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
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-slate-200/80 bg-slate-50/50">
            <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
              <span>
                Showing <strong className="text-slate-900 font-extrabold">{totalUsers > 0 ? startIndex + 1 : 0}</strong> to{" "}
                <strong className="text-slate-900 font-extrabold">{Math.min(startIndex + pageSize, totalUsers)}</strong> of{" "}
                <strong className="text-slate-900 font-extrabold">{totalUsers}</strong> accounts
              </span>
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-[11px]">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-md px-2 py-1 focus:outline-none cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: User Profile Inspect Modal */}
      {userModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 text-left animate-in fade-in zoom-in-95 duration-150 my-8">
            {/* Modal Header Banner */}
            <div className="relative bg-linear-to-r from-[#013534] via-[#014645] to-slate-900 text-white p-6">
              <button
                onClick={() => setUserModalOpen(false)}
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20 flex items-center justify-center font-black text-2xl shadow-inner shrink-0">
                  {selectedUser.name ? selectedUser.name[0].toUpperCase() : "U"}
                </div>
                <div className="space-y-1 pr-6">
                  <h3 className="text-lg font-black text-white tracking-tight leading-tight my-0">
                    {selectedUser.name}
                  </h3>
                  <p className="text-xs text-emerald-200/80 font-medium my-0 flex items-center gap-1.5 truncate">
                    <Mail className="size-3.5 text-emerald-300 shrink-0" />
                    <span className="truncate">{selectedUser.email}</span>
                  </p>
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser)}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              {/* Account Details Grid */}
              <div className="space-y-2.5">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <User className="size-3.5 text-[#014645]" />
                  Account Overview
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
                      <Phone className="size-3 text-slate-400" /> Phone Number
                    </span>
                    <p className="text-xs font-bold text-slate-800 my-0">
                      {selectedUser.phone || "Not provided"}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
                      <MapPin className="size-3 text-slate-400" /> Location
                    </span>
                    <p className="text-xs font-bold text-slate-800 my-0">
                      {[selectedUser.location_area, selectedUser.location_city].filter(Boolean).join(", ") || "HQ Location"}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
                      <Building2 className="size-3 text-slate-400" /> Preference Type
                    </span>
                    <p className="text-xs font-bold text-slate-800 my-0 capitalize">
                      {selectedUser.preference_type || "General Listings"}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
                      <Calendar className="size-3 text-slate-400" /> Joined Date
                    </span>
                    <p className="text-xs font-bold text-slate-800 my-0">
                      {new Date(selectedUser.created_at).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Agency Profile & Business Details (if Agency / Owner) */}
              {(selectedUser.agency_profile || selectedUser.role === "agency" || selectedUser.role === "owner") && (
                <div className="space-y-2.5">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Briefcase className="size-3.5 text-[#014645]" />
                    Agency & Business Profile
                  </h4>

                  <div className="bg-emerald-50/40 rounded-xl p-4 border border-emerald-100/80 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">
                          Agency / Business Name
                        </span>
                        <p className="text-sm font-black text-slate-900 my-0">
                          {selectedUser.agency_profile?.display_name || selectedUser.name}
                        </p>
                      </div>
                      <Badge className="bg-[#014645] text-white text-[10px] px-2 py-0.5 font-bold shrink-0">
                        {selectedUser.role.toUpperCase()}
                      </Badge>
                    </div>

                    {selectedUser.agency_profile?.about && (
                      <div className="pt-2 border-t border-emerald-200/50">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                          About Agency
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed my-0">
                          {selectedUser.agency_profile.about}
                        </p>
                      </div>
                    )}

                    {selectedUser.agency_profile?.areas_served && selectedUser.agency_profile.areas_served.length > 0 && (
                      <div className="pt-2 border-t border-emerald-200/50">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1.5 items-center gap-1">
                          <Globe className="size-3 text-slate-400" /> Coverage / Areas Served
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedUser.agency_profile.areas_served.map((area, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-bold bg-white text-[#014645] px-2.5 py-0.5 rounded-md border border-emerald-200/70 shadow-2xs"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status & Verification Section */}
              <div className="space-y-2.5">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-[#014645]" />
                  Verification & Compliance
                </h4>

                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600">Verification Status</span>
                    <span className="font-extrabold capitalize text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                      {selectedUser.verification_status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600">Account Access State</span>
                    <span className="font-extrabold capitalize text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                      {selectedUser.status}
                    </span>
                  </div>

                  {selectedUser.verification_note && (
                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                        Moderation Note / Reason
                      </span>
                      <p className="text-xs text-slate-700 italic bg-amber-50/60 p-2.5 rounded-lg border border-amber-100 my-0">
                        "{selectedUser.verification_note}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            {selectedUser.role !== "admin" && (
              <div className="bg-slate-50 p-4 sm:px-6 border-t border-slate-200/80 flex items-center justify-end gap-2">
                {isPendingUser(selectedUser) ? (
                  <>
                    <button
                      onClick={() => {
                        setUserModalOpen(false);
                        setTargetStatus("active");
                        setStatusModalOpen(true);
                      }}
                      className="bg-[#014645] hover:bg-[#013534] text-white font-extrabold text-xs px-3.5 py-2 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <UserCheck className="size-3.5" />
                      Approve Account
                    </button>
                    <button
                      onClick={() => {
                        setUserModalOpen(false);
                        setTargetStatus("suspended");
                        setStatusModalOpen(true);
                      }}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs px-3.5 py-2 rounded-lg border border-rose-200 flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <UserX className="size-3.5" />
                      Reject
                    </button>
                  </>
                ) : selectedUser.status === "active" ? (
                  <button
                    onClick={() => {
                      setUserModalOpen(false);
                      setTargetStatus("suspended");
                      setStatusModalOpen(true);
                    }}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs px-3.5 py-2 rounded-lg border border-rose-200 flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <UserX className="size-3.5" />
                    Suspend User
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setUserModalOpen(false);
                      setTargetStatus("active");
                      setStatusModalOpen(true);
                    }}
                    className="bg-[#014645] hover:bg-[#013534] text-white font-extrabold text-xs px-3.5 py-2 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <UserCheck className="size-3.5" />
                    Activate Account
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 2: Status Toggle Modal */}
      {statusModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-left">
            <div className="flex items-center gap-3">
              <div
                className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                  targetStatus === "suspended" ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-[#014645]"
                }`}
              >
                {targetStatus === "suspended" ? <UserX className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 my-0">
                  {targetStatus === "suspended" ? "Suspend Account" : "Activate Account"}
                </h3>
                <p className="text-xs text-slate-500 font-medium my-0">
                  Confirm account status change for {selectedUser.name}.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setStatusModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUserStatus}
                disabled={actionLoading}
                className={`font-extrabold text-xs px-4 py-2 rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50 ${
                  targetStatus === "suspended"
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-[#014645] hover:bg-[#013534] text-white"
                }`}
              >
                {actionLoading ? "Updating..." : `Confirm ${targetStatus === "suspended" ? "Suspension" : "Activation"}`}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal 3: Limits Modal */}
      {limitsModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-left">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900 my-0">
                Manage Limits: {selectedUser.name}
              </h3>
              <button
                onClick={() => setLimitsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {limitsLoading ? (
              <div className="py-8 text-center text-slate-500 text-sm">Loading limits...</div>
            ) : limitsData ? (
              <form onSubmit={handleUpdateLimit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400">Current Usage</span>
                    <p className="text-lg font-black text-slate-900">{limitsData.msg_usage}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400">Remaining</span>
                    <p className="text-lg font-black text-[#014645]">{limitsData.remaining}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Message Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={limitsData.msg_limit}
                    onChange={(e) => setLimitsData({...limitsData, msg_limit: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-[#014645]"
                    required
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="resetUsage"
                    checked={limitsData.reset_usage}
                    onChange={(e) => setLimitsData({...limitsData, reset_usage: e.target.checked})}
                    className="rounded border-slate-300 text-[#014645] focus:ring-[#014645]"
                  />
                  <label htmlFor="resetUsage" className="text-xs font-bold text-slate-700 cursor-pointer">Reset usage to 0</label>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Reason for Update</label>
                  <input
                    type="text"
                    value={limitsData.note}
                    onChange={(e) => setLimitsData({...limitsData, note: e.target.value})}
                    placeholder="e.g. Paid for standard package"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-[#014645]"
                  />
                </div>

                <div className="flex justify-end pt-2 gap-2">
                  <button type="button" onClick={() => setLimitsModalOpen(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer">Cancel</button>
                  <button type="submit" disabled={actionLoading} className="bg-[#014645] hover:bg-[#013534] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50">
                    {actionLoading ? "Saving..." : "Save Limits"}
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

