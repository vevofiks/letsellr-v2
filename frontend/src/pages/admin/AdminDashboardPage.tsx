import React, { useEffect, useState } from "react";
import {
  Building2,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  PlusCircle,
  Eye,
  ShieldCheck,
  MapPin,
  Tag,
  Check,
  Activity,
  UserPlus
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  adminService,
  type AdminDashboardStats,
  type AdminProperty,
  type AdminUser
} from "@/services/adminService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [pendingProperties, setPendingProperties] = useState<AdminProperty[]>([]);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchDashboardData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const [statsData, pendingData, usersData] = await Promise.all([
        adminService.getDashboardStats().catch(() => null),
        adminService.getPendingProperties().catch(() => []),
        adminService.getUsers().catch(() => []),
      ]);

      setStats(statsData);
      setPendingProperties(Array.isArray(pendingData) ? pendingData.slice(0, 5) : []);
      // Filter out admin users from recent registrations
      setRecentUsers(
        Array.isArray(usersData)
          ? usersData.filter((u) => u && u.role !== "admin").slice(0, 5)
          : []
      );
    } catch (err: any) {
      console.error("Failed to load dashboard data:", err);
      toast.error("Loaded dashboard with available metrics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickApproveProperty = async (id: string) => {
    try {
      setActionLoadingId(id);
      await adminService.approveProperty(id, "Approved via Executive Dashboard");
      toast.success("Listing approved successfully!");
      fetchDashboardData(true);
    } catch (err: any) {
      toast.error("Failed to approve property.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatCurrency = (val: number) => {
    if (typeof val !== "number") return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role?.toLowerCase()) {
      case "agency":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "owner":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "seeker":
      case "user":
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight my-0">
              Executive Dashboard
            </h1>
            
          </div>
          <p className="text-xs text-slate-500 font-medium -mt-4!">
            Real-time platform activity, pending property moderation, and user statistics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="font-bold text-xs gap-2 rounded-md cursor-pointer py-2.5 px-3.5 h-auto"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin text-[#014645]" : ""}`} />
            Sync Metrics
          </Button>

          <Link to="/admin-platform/properties">
            <Button
              size="sm"
              className="bg-[#014645] hover:bg-[#013534] text-white font-extrabold text-xs gap-1.5 rounded-md cursor-pointer shadow-2xs py-2.5 px-4 h-auto"
            >
              <Eye className="size-3.5" />
              Review Queue ({pendingProperties.length})
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards Grid (2 cols mobile, 4 cols desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <Card className="py-0 rounded-lg shadow-2xs border-slate-200/80 bg-white">
          <CardContent className="p-3 sm:p-3.5 space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-wider text-slate-400 truncate">Total Properties</span>
              <div className="size-7 sm:size-8 rounded-md bg-emerald-50 text-[#014645] flex items-center justify-center shrink-0 border border-emerald-200/60">
                <Building2 className="size-3.5 sm:size-4" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pt-0.5">
              <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">{stats?.total_properties ?? "0"}</p>
              <span className="inline-flex items-center gap-1 text-[9.5px] sm:text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100/80 w-fit">
                <TrendingUp className="size-2.5" /> {stats?.active_properties ?? 0} Live
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="py-0 rounded-lg shadow-2xs border-slate-200/80 bg-white">
          <CardContent className="p-3 sm:p-3.5 space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-wider text-slate-400 truncate">Pending Properties</span>
              <div className="size-7 sm:size-8 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/60">
                <Clock className="size-3.5 sm:size-4" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pt-0.5">
              <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">{stats?.pending_property_reviews ?? "0"}</p>
              <span className="inline-flex items-center gap-1 text-[9.5px] sm:text-[10px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100/80 w-fit">
                <Clock className="size-2.5" /> Action
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="py-0 rounded-lg shadow-2xs border-slate-200/80 bg-white">
          <CardContent className="p-3 sm:p-3.5 space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-wider text-slate-400 truncate">Registered Users</span>
              <div className="size-7 sm:size-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/60">
                <Users className="size-3.5 sm:size-4" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pt-0.5">
              <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">{stats?.total_users ?? "0"}</p>
              <span className="inline-flex items-center gap-1 text-[9.5px] sm:text-[10px] font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100/80 w-fit">
                <Users className="size-2.5" /> Accounts
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="py-0 rounded-lg shadow-2xs border-slate-200/80 bg-white">
          <CardContent className="p-3 sm:p-3.5 space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-wider text-slate-400 truncate">Verified Agencies</span>
              <div className="size-7 sm:size-8 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200/60">
                <ShieldCheck className="size-3.5 sm:size-4" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pt-0.5">
              <p className="text-2xl font-black text-slate-900 tracking-tight leading-none">{stats?.agencies_count ?? "0"}</p>
              <span className="inline-flex items-center gap-1 text-[9.5px] sm:text-[10px] font-extrabold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-100/80 w-fit">
                <CheckCircle2 className="size-2.5" /> Verified
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Demographics Breakdown Bar (Admin excluded) */}
      <Card className="py-0 rounded-lg shadow-2xs border-slate-200/80 bg-white">
        <CardContent className="p-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-[#014645]" />
              <span className="text-xs font-extrabold text-slate-900">User Role Breakdown</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-bold bg-blue-50 text-blue-800 border-blue-200 px-2.5 py-0.5 rounded-md">
                Seekers: <span className="font-black ml-1">{stats?.seekers_count ?? 0}</span>
              </Badge>
              <Badge variant="outline" className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border-emerald-200 px-2.5 py-0.5 rounded-md">
                Owners: <span className="font-black ml-1">{stats?.owners_count ?? 0}</span>
              </Badge>
              <Badge variant="outline" className="text-[10px] font-bold bg-purple-50 text-purple-800 border-purple-200 px-2.5 py-0.5 rounded-md">
                Agencies: <span className="font-black ml-1">{stats?.agencies_count ?? 0}</span>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Workspace Grid: Property Approvals & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 1: Pending Property Approvals Queue (2 cols) */}
        <Card className="lg:col-span-2 rounded-lg shadow-2xs border-slate-200/80 flex flex-col bg-white px-5 sm:px-6">
          <CardHeader className="flex flex-row items-center justify-between px-0 py-4 border-b border-slate-100">
            <div>
              <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 className="size-4 text-[#014645]" />
                Pending Property Approvals
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Listings requiring administrative inspection before going live.
              </CardDescription>
            </div>
            <Link to="/admin-platform/properties">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-[#014645] hover:bg-emerald-50 flex items-center gap-1 rounded-md h-7 px-2">
                View All <ArrowUpRight className="size-3.5" />
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-0 flex-1">
            {loading ? (
              <div className="py-8 text-center space-y-2">
                <div className="size-5 border-2 border-[#014645] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading Submissions...</p>
              </div>
            ) : pendingProperties.length === 0 ? (
              <div className="py-8 text-center space-y-1.5">
                <div className="size-9 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="size-4.5" />
                </div>
                <p className="text-xs font-bold text-slate-700">Queue is Clear!</p>
                <p className="text-xs text-slate-400">All submitted listings have been reviewed.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="text-[10px] font-black uppercase py-2.5 px-3">Property Details</TableHead>
                    <TableHead className="text-[10px] font-black uppercase py-2.5 px-3">Category</TableHead>
                    <TableHead className="text-[10px] font-black uppercase py-2.5 px-3">Price</TableHead>
                    <TableHead className="text-[10px] font-black uppercase py-2.5 px-3 text-right">Quick Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingProperties.map((prop) => (
                    <TableRow key={prop.id} className="hover:bg-slate-50/70">
                      <TableCell className="font-extrabold text-slate-900 text-xs py-3 px-3">
                        <div>
                          <span className="line-clamp-1">{prop.title || "Untitled Property"}</span>
                          <span className="block text-[10.5px] font-semibold text-slate-400">
                            {prop.location_area || "Area"}, {prop.location_city || "City"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-3">
                        <Badge variant="outline" className="text-[9.5px] font-black uppercase rounded-md">
                          {prop.category || "General"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-black text-xs text-[#014645] py-3 px-3">
                        {formatCurrency(prop.price)}
                      </TableCell>
                      <TableCell className="text-right py-3 px-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => handleQuickApproveProperty(prop.id)}
                            disabled={actionLoadingId === prop.id}
                            className="h-7 text-[11px] font-extrabold bg-[#014645] hover:bg-[#013534] text-white px-2.5 py-0 rounded-md gap-1 cursor-pointer"
                          >
                            <Check className="size-3" /> Approve
                          </Button>
                          <Link to="/admin-platform/properties">
                            <Button size="sm" variant="outline" className="h-7 text-[11px] font-bold px-2.5 py-0 rounded-md">
                              Inspect
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Platform Quick Actions (1 col) */}
        <Card className="lg:col-span-1 rounded-lg shadow-2xs border-slate-200/80 bg-white px-5">
          <CardHeader className="px-0 py-4 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <PlusCircle className="size-4 text-[#014645]" />
              Quick Management Shortcuts
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 px-0 py-4">
            <Link to="/admin-platform/categories">
              <Button variant="outline" className="w-full justify-start gap-2 text-xs font-bold h-9 rounded-md border-slate-200 hover:bg-slate-50 cursor-pointer">
                <Tag className="size-3.5 text-[#014645]" />
                Property Categories & Types
              </Button>
            </Link>
            <Link to="/admin-platform/locations">
              <Button variant="outline" className="w-full justify-start gap-2 text-xs font-bold h-9 rounded-md border-slate-200 hover:bg-slate-50 cursor-pointer">
                <MapPin className="size-3.5 text-blue-600" />
                Locations & Cities Registry
              </Button>
            </Link>
            <Link to="/admin-platform/users">
              <Button variant="outline" className="w-full justify-start gap-2 text-xs font-bold h-9 rounded-md border-slate-200 hover:bg-slate-50 cursor-pointer">
                <Users className="size-3.5 text-purple-600" />
                User & Agency Accounts
              </Button>
            </Link>
            <Link to="/admin-platform/properties">
              <Button variant="outline" className="w-full justify-start gap-2 text-xs font-bold h-9 rounded-md border-slate-200 hover:bg-slate-50 cursor-pointer">
                <Building2 className="size-3.5 text-emerald-600" />
                All Listings & Moderation
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Recent Registrations */}
      <div className="grid grid-cols-1 gap-6">
        {/* Recent Registered Users List (Excludes Admin) */}
        <Card className="rounded-lg shadow-2xs border-slate-200/80 flex flex-col bg-white px-5 sm:px-6">
          <CardHeader className="flex flex-row items-center justify-between px-0 py-4 border-b border-slate-100">
            <div>
              <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <UserPlus className="size-4 text-purple-600" />
                Recent User Registrations
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Latest platform sign-ups across Seekers, Owners, and Agencies.
              </CardDescription>
            </div>
            <Link to="/admin-platform/users">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-purple-700 hover:bg-purple-50 flex items-center gap-1 rounded-md h-7 px-2">
                View All <ArrowUpRight className="size-3.5" />
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-0 flex-1">
            {recentUsers.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs text-slate-400">No recent users found.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="text-[10px] font-black uppercase py-2.5 px-3">User</TableHead>
                    <TableHead className="text-[10px] font-black uppercase py-2.5 px-3">Role</TableHead>
                    <TableHead className="text-[10px] font-black uppercase py-2.5 px-3">Location</TableHead>
                    <TableHead className="text-[10px] font-black uppercase py-2.5 px-3 text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUsers.map((u) => (
                    <TableRow key={u.id} className="hover:bg-slate-50/70">
                      <TableCell className="font-extrabold text-slate-900 text-xs py-3 px-3">
                        <div>
                          <span>{u.name || "User"}</span>
                          <span className="block text-[10.5px] font-semibold text-slate-400">
                            {u.email || ""}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-3">
                        <Badge variant="outline" className={`text-[9.5px] font-black uppercase rounded-md ${getRoleBadgeColor(u.role)}`}>
                          {u.role || "user"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 py-3 px-3 font-medium">
                        {u.location_city || "N/A"}
                      </TableCell>
                      <TableCell className="text-right py-3 px-3">
                        <Badge variant="outline" className="text-[9.5px] font-black uppercase bg-emerald-50 text-emerald-700 border-emerald-200 rounded-md">
                          {u.status || "active"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
