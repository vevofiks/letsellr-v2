import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldAlert,
  AlertTriangle,
  Ban,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import { adminService, type AdminProperty } from "@/services/adminService";
import { propertyPath } from "@/lib/urls";
import { Badge } from "@/components/ui/badge";

export const AdminReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [rejectedProperties, setRejectedProperties] = useState<AdminProperty[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // UI state
  const [activeTab, setActiveTab] = useState<"reports" | "rejected">("reports");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const fetchData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const [reportsData, rejectedData] = await Promise.all([
        adminService.getReports(),
        adminService.getRejectedProperties(),
      ]);

      setReports(reportsData);
      setRejectedProperties(rejectedData);
    } catch (err: any) {
      console.error("Failed to load reports data:", err);
      toast.error(getErrorMessage(err, "Failed to load reports."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateReportStatus = async (reportId: string, status: "resolved" | "dismissed") => {
    try {
      setActionLoading(true);
      await adminService.updateReportStatus(reportId, status);
      toast.success(`Report marked as ${status}`);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status } : r))
      );
    } catch (err: any) {
      toast.error("Failed to update report status.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (activeTab !== "reports") return false;
    const matchesSearch =
      r.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.property?.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredRejected = rejectedProperties.filter((p) => {
    if (activeTab !== "rejected") return false;
    const matchesSearch =
      (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.ref || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const totalItems = activeTab === "reports" ? filteredReports.length : filteredRejected.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  
  const currentReports = filteredReports.slice(startIndex, startIndex + pageSize);
  const currentRejected = filteredRejected.slice(startIndex, startIndex + pageSize);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="warning" className="text-[9.5px] font-black uppercase">Pending</Badge>;
      case "resolved":
        return <Badge variant="success" className="text-[9.5px] font-black uppercase">Resolved</Badge>;
      case "dismissed":
        return <Badge variant="outline" className="text-[9.5px] font-black uppercase">Dismissed</Badge>;
      default:
        return <Badge variant="outline" className="text-[9.5px] font-black uppercase">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight my-0">
              Reports & Flags
            </h1>
            <Badge variant="secondary" className="text-xs font-black px-2.5 py-0.5 rounded-md">
              {reports.length} Open Reports
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage user property reports, flags, and review rejected listings.
          </p>
        </div>

        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-lg border border-slate-200/80 shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[#014645]" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Tabs & Search Container */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="flex items-center gap-1 border-b border-slate-200/80 px-3 sm:px-4 pt-3 bg-slate-50/50 overflow-x-auto scrollbar-none whitespace-nowrap">
          <button
            onClick={() => setActiveTab("reports")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-black rounded-t-lg border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "reports"
                ? "border-[#014645] text-[#014645] bg-white shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Property Reports ({reports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("rejected")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-black rounded-t-lg border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "rejected"
                ? "border-rose-600 text-rose-700 bg-white shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Ban className="h-3.5 w-3.5" />
            <span>Rejected Listings ({rejectedProperties.length})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === "reports" ? "Search reports by reason or property title..." : "Search rejected properties by title or ref..."}
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
        </div>
      </div>

      {/* Main Content Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center space-y-3">
          <div className="h-7 w-7 border-2 border-[#014645] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Reports...</p>
        </div>
      ) : activeTab === "reports" ? (
        /* REPORTS TABLE */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-5">Property / Report</th>
                  <th className="py-3 px-5">Reason</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {currentReports.length > 0 ? (
                  currentReports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/60">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-900 truncate max-w-xs my-0">
                              {report.property?.title || "Unknown Property"}
                            </p>
                            <p className="text-[10.5px] text-slate-400 font-semibold my-0">
                              {report.property?.ref || "No Ref"} • Reported {new Date(report.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <p className="text-xs font-bold text-slate-800 my-0">{report.reason}</p>
                        {report.description && (
                          <p className="text-[11px] text-slate-500 truncate max-w-xs my-0">{report.description}</p>
                        )}
                        {report.reporter_phone && (
                          <p className="text-[11px] text-slate-400 font-semibold my-0 mt-0.5">
                            Contact: {report.reporter_phone}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-5">
                        {getStatusBadge(report.status)}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/admin-platform/reports/${report.id}`)}
                            className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {report.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleUpdateReportStatus(report.id, "resolved")}
                                disabled={actionLoading}
                                className="h-8 px-2.5 rounded-lg bg-emerald-50 text-[#014645] hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                                title="Resolve Report"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>Resolve</span>
                              </button>
                              <button
                                onClick={() => handleUpdateReportStatus(report.id, "dismissed")}
                                disabled={actionLoading}
                                className="h-8 px-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                                title="Dismiss Report"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Dismiss</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-12 text-center">
                      <ShieldAlert className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider my-0">No Reports Found</p>
                      <p className="text-xs text-slate-400 font-medium my-0 mt-1">There are currently no active flags or reports.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* REJECTED PROPERTIES TABLE */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-5">Property</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Owner</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {currentRejected.length > 0 ? (
                  currentRejected.map((property) => (
                    <tr key={property.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200/60">
                            <Ban className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-900 truncate max-w-xs my-0">{property.title}</p>
                            <p className="text-[10.5px] text-slate-400 font-semibold my-0">Ref: {property.ref}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <Badge variant="outline" className="text-[9.5px] font-black uppercase">
                          {property.category.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-5">
                        <span className="text-xs font-bold text-slate-700 capitalize">
                          {property.owner_role}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button
                          onClick={() => navigate(propertyPath(property))}
                          className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors ml-auto"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-12 text-center">
                      <Ban className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider my-0">No Rejected Properties</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs font-semibold text-slate-500">
            Showing {startIndex + 1}-{Math.min(startIndex + pageSize, totalItems)} of {totalItems}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Prev</span>
            </button>
            <span className="text-xs font-extrabold text-slate-700 px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
