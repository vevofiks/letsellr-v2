import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { adminService, type AdminProperty } from "@/services/adminService";

export const AdminReportsPage: React.FC = () => {
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
      toast.error(err.response?.data?.detail || "Failed to load reports.");
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

  // Filter based on active tab and search
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
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ref.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Reset pagination on tab/search change
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
        return <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">Pending</span>;
      case "resolved":
        return <span className="bg-[#D9F7E9] text-[#0B6E4F] border border-[#23D283]/30 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">Resolved</span>;
      case "dismissed":
        return <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">Dismissed</span>;
      default:
        return <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Reports & Flags
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage user reports of fake listings, rogue brokers, and view rejected properties.
          </p>
        </div>

        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[#086942]" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("reports")}
          className={`px-4 py-2 text-sm font-bold rounded-t-xl border-b-2 transition-all ${
            activeTab === "reports"
              ? "border-[#23D283] text-[#086942] bg-[#23D283]/10"
              : "border-transparent text-slate-500 hover:bg-slate-100"
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Property Reports
            <span className="bg-white text-slate-700 text-[10px] px-1.5 py-0.5 rounded-full border border-slate-200">
              {reports.length}
            </span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab("rejected")}
          className={`px-4 py-2 text-sm font-bold rounded-t-xl border-b-2 transition-all ${
            activeTab === "rejected"
              ? "border-red-500 text-red-700 bg-red-50"
              : "border-transparent text-slate-500 hover:bg-slate-100"
          }`}
        >
          <div className="flex items-center gap-2">
            <Ban className="h-4 w-4" />
            Rejected Properties
            <span className="bg-white text-slate-700 text-[10px] px-1.5 py-0.5 rounded-full border border-slate-200">
              {rejectedProperties.length}
            </span>
          </div>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center">
        <Search className="h-4 w-4 text-slate-400 ml-2 mr-3" />
        <input
          type="text"
          placeholder={activeTab === "reports" ? "Search reports..." : "Search rejected properties..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-slate-300 mb-4" />
          <p className="text-sm font-bold text-slate-600">Loading data...</p>
        </div>
      ) : activeTab === "reports" ? (
        /* REPORTS TABLE */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Property / Report</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Reason</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentReports.length > 0 ? (
                  currentReports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 line-clamp-1">
                              {report.property?.title || "Unknown Property"}
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {report.property?.ref || "No Ref"} • Reported on {new Date(report.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs font-bold text-slate-700">{report.reason}</p>
                        {report.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{report.description}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {getStatusBadge(report.status)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {report.status === "pending" && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleUpdateReportStatus(report.id, "resolved")}
                              disabled={actionLoading}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Resolve"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleUpdateReportStatus(report.id, "dismissed")}
                              disabled={actionLoading}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                              title="Dismiss"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center">
                      <ShieldAlert className="h-8 w-8 mx-auto text-slate-300 mb-3" />
                      <p className="text-sm font-bold text-slate-600">No reports found</p>
                      <p className="text-xs text-slate-500 mt-1">All good! There are no pending reports.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* REJECTED PROPERTIES TABLE */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Property</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Owner</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRejected.length > 0 ? (
                  currentRejected.map((property) => (
                    <tr key={property.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                            <Ban className="h-4 w-4 text-red-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 line-clamp-1">{property.title}</p>
                            <p className="text-[11px] text-slate-500 font-medium">Ref: {property.ref}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md capitalize">
                          {property.category.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium text-slate-600 capitalize">
                          {property.owner_role}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-not-allowed"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center">
                      <Ban className="h-8 w-8 mx-auto text-slate-300 mb-3" />
                      <p className="text-sm font-bold text-slate-600">No rejected properties</p>
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
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-slate-500">
            Showing {startIndex + 1}-{Math.min(startIndex + pageSize, totalItems)} of {totalItems}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
