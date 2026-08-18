import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Phone,
  Calendar,
  Hash,
  ExternalLink,
  Building2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import { adminService } from "@/services/adminService";
import { propertyPath } from "@/lib/urls";
import { Badge } from "@/components/ui/badge";

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex items-start gap-3 py-3">
    <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 text-slate-500">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 my-0">{label}</p>
      <div className="text-sm font-bold text-slate-800 mt-0.5 break-words">{value}</div>
    </div>
  </div>
);

export const AdminReportDetailPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReport = async () => {
    if (!reportId) return;
    try {
      setLoading(true);
      setNotFound(false);
      const data = await adminService.getReportById(reportId);
      setReport(data);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error(getErrorMessage(err, "Failed to load report."));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  const handleUpdateStatus = async (status: "resolved" | "dismissed") => {
    if (!report) return;
    try {
      setActionLoading(true);
      await adminService.updateReportStatus(report.id, status);
      toast.success(`Report marked as ${status}`);
      setReport((prev: any) => (prev ? { ...prev, status } : prev));
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update report status."));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="warning" className="text-[10px] font-black uppercase">Pending</Badge>;
      case "resolved":
        return <Badge variant="success" className="text-[10px] font-black uppercase">Resolved</Badge>;
      case "dismissed":
        return <Badge variant="outline" className="text-[10px] font-black uppercase">Dismissed</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] font-black uppercase">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin-platform/reports")}
            className="h-9 w-9 rounded-lg bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight my-0">
              Report Details
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Full context for this property report.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center space-y-3">
          <div className="h-7 w-7 border-2 border-[#014645] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Report...</p>
        </div>
      ) : notFound || !report ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center space-y-3">
          <ShieldAlert className="h-8 w-8 mx-auto text-slate-300" />
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider my-0">Report Not Found</p>
          <p className="text-xs text-slate-400 font-medium my-0">
            This report may have been removed, or the link is invalid.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Report Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="p-5 border-b border-slate-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/60">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900 my-0">{report.reason}</p>
                    <p className="text-[11px] text-slate-400 font-semibold my-0">
                      Reported {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {getStatusBadge(report.status)}
              </div>

              <div className="px-5 divide-y divide-slate-100">
                <InfoRow
                  icon={<Hash className="h-4 w-4" />}
                  label="Report ID"
                  value={<span className="font-mono text-xs text-slate-600">{report.id}</span>}
                />
                <InfoRow
                  icon={<ShieldAlert className="h-4 w-4" />}
                  label="Description"
                  value={
                    report.description ? (
                      report.description
                    ) : (
                      <span className="text-slate-400 font-semibold">No description provided.</span>
                    )
                  }
                />
                <InfoRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Reporter Phone"
                  value={
                    report.reporter_phone ? (
                      report.reporter_phone
                    ) : (
                      <span className="text-slate-400 font-semibold">Not provided</span>
                    )
                  }
                />

                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Last Updated"
                  value={new Date(report.updated_at).toLocaleString()}
                />
              </div>

              {report.status === "pending" && (
                <div className="p-5 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <button
                    onClick={() => handleUpdateStatus("resolved")}
                    disabled={actionLoading}
                    className="flex-1 h-10 px-4 rounded-lg bg-emerald-50 text-[#014645] hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Mark as Resolved</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus("dismissed")}
                    disabled={actionLoading}
                    className="flex-1 h-10 px-4 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Dismiss Report</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Reported Property */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-200/80">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 my-0 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Reported Listing
                </h3>
              </div>

              {report.property ? (
                <div className="p-4 space-y-4">
                  {report.property.photos?.[0] && (
                    <img
                      src={report.property.photos[0]}
                      alt={report.property.title}
                      className="w-full h-36 object-cover rounded-lg border border-slate-200/80"
                    />
                  )}
                  <div>
                    <p className="text-sm font-extrabold text-slate-900 my-0">{report.property.title}</p>
                    <p className="text-[11px] text-slate-400 font-semibold my-0 mt-0.5">
                      Ref: {report.property.ref || report.property_ref || "N/A"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-[9.5px] font-black uppercase">
                      {report.property.category?.replace("_", " ")}
                    </Badge>
                    <Badge variant="outline" className="text-[9.5px] font-black uppercase">
                      {report.property.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span className="capitalize">{report.property.owner_role}</span>
                  </div>
                  <button
                    onClick={() => window.open(propertyPath(report.property), "_blank", "noopener,noreferrer")}
                    className="w-full h-9 rounded-lg bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>View Listing</span>
                  </button>
                </div>
              ) : (
                <div className="p-6 text-center space-y-2">
                  <Building2 className="h-6 w-6 mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-500 my-0">Listing no longer available</p>
                  {report.property_ref && (
                    <p className="text-[11px] text-slate-400 font-semibold my-0">Ref: {report.property_ref}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
