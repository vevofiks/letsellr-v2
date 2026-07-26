import React, { useState } from "react";
import {
  ArrowUpRight,
  MoreHorizontal,
  Building2,
  Users,
  RotateCcw,
  Search,
  Filter,
  Plus,
  Clock,
  ChevronDown
} from "lucide-react";
import { Link } from "react-router-dom";

export const AdminDashboardPage: React.FC = () => {
  const [timeFilter] = useState("This Month");
  const [chartRange, setChartRange] = useState<"Monthly" | "Yearly">("Yearly");

  // Sample data for recent activities matching reference table styling
  const recentActivities = [
    {
      id: "ACT_001",
      activity: "New Property Listing Moderation",
      subtitle: "Luxury 4 BHK Villa near Lulu Mall",
      ref: "PROP-EDP-VIL",
      date: "25 Jul, 2026",
      time: "06:45 PM",
      amount: "₹18,500,000",
      status: "Completed",
      statusVariant: "success",
    },
    {
      id: "ACT_002",
      activity: "Agency Verification Request",
      subtitle: "Apex Realty Group Kerala",
      ref: "AGY-APX-882",
      date: "25 Jul, 2026",
      time: "05:12 PM",
      amount: "Agency Plan",
      status: "Pending",
      statusVariant: "warning",
    },
    {
      id: "ACT_003",
      activity: "Property Rejection Notice",
      subtitle: "Commercial Space Kakkanad",
      ref: "PROP-KKD-COM",
      date: "24 Jul, 2026",
      time: "02:30 PM",
      amount: "₹45,000/mo",
      status: "Rejected",
      statusVariant: "danger",
    },
    {
      id: "ACT_004",
      activity: "User Account Registration",
      subtitle: "Rahul Nair (Property Seeker)",
      ref: "USR-RN-1092",
      date: "24 Jul, 2026",
      time: "11:15 AM",
      amount: "Standard Client",
      status: "Completed",
      statusVariant: "success",
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Overview Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight my-0">
            Overview
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Here is the summary of overall platform performance and moderation data
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Filter Dropdown */}
          <div className="relative">
            <button className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-xl px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1.5 cursor-pointer">
              <span>{timeFilter}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </div>

          {/* Reset View Button */}
          <button className="bg-white border border-slate-200/80 hover:bg-slate-50 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1.5 cursor-pointer">
            <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
            <span>Reset Data</span>
          </button>
        </div>
      </div>

      {/* Top 3 Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Featured Deep Forest Green Card */}
        <div className="bg-[#086942] text-white rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-44 relative overflow-hidden group">
          <div className="flex items-center justify-between z-10">
            <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Building2 className="h-5 w-5 text-emerald-200" />
            </div>
            <button className="text-white/60 hover:text-white transition-colors cursor-pointer">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1.5 z-10 my-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-100/90 block">
                Total Properties Listed
              </span>
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                112
              </span>
              <span className="bg-white/20 backdrop-blur-md text-emerald-100 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                +15.4% <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
            <span className="text-[11px] text-emerald-100/70 font-medium block">
              Active, verified & moderated listings
            </span>
          </div>

          <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs font-bold z-10">
            <Link to="/admin-platform/properties" className="text-emerald-100 hover:text-white flex items-center gap-1.5 transition-colors">
              <span>See details</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Decorative background glow */}
          <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-emerald-400/20 rounded-full blur-2xl group-hover:scale-125 transition-all duration-500 pointer-events-none" />
        </div>

        {/* Card 2: White Moderation Queue Card */}
        <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-44">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
              <Clock className="h-5 w-5" />
            </div>
            <button className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1.5 my-2">
            <span className="text-xs font-bold text-slate-500 block">
              Pending Review Queue
            </span>
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                8
              </span>
              <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                Action Required
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium block">
              Awaiting admin moderation check
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <Link to="/admin-platform/properties" className="text-slate-700 hover:text-[#086942] flex items-center gap-1.5 transition-colors">
              <span>View summary</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Card 3: White Users & Agencies Card */}
        <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-44">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#086942]">
              <Users className="h-5 w-5" />
            </div>
            <button className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1.5 my-2">
            <span className="text-xs font-bold text-slate-500 block">
              Registered Accounts
            </span>
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                58
              </span>
              <span className="bg-emerald-50 text-[#086942] border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                +4.7% <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium block">
              Owners, agencies & verified seekers
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <Link to="/admin-platform/users" className="text-slate-700 hover:text-[#086942] flex items-center gap-1.5 transition-colors">
              <span>Analyze performance</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>
          </div>
        </div>

      </div>

      {/* Middle Section: Role Breakdown & Activity Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Side: Role Breakdown Sub-Cards */}
        <div className="lg:col-span-5 bg-white border border-slate-200/70 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 my-0">
                User Role Distribution
              </h2>
              <span className="text-[11px] font-semibold text-slate-400 block">
                Platform account tier breakdown
              </span>
            </div>
            <button className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer">
              <Plus className="h-3.5 w-3.5" /> Add New
            </button>
          </div>

          {/* 4 Role Breakdown Grid Sub-Cards matching reference image layout */}
          <div className="grid grid-cols-2 gap-3">
            
            {/* Sub-card 1 */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                  👥 Seekers
                </span>
                <button className="text-slate-400 hover:text-slate-600">⋮</button>
              </div>
              <div>
                <span className="text-lg font-black text-slate-900 block">32</span>
                <span className="text-[10px] text-slate-400 font-semibold block">Property Buyers & Renters</span>
              </div>
              <span className="inline-block bg-emerald-100 text-[#086942] font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                Active
              </span>
            </div>

            {/* Sub-card 2 */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                  🏢 Agencies
                </span>
                <button className="text-slate-400 hover:text-slate-600">⋮</button>
              </div>
              <div>
                <span className="text-lg font-black text-slate-900 block">12</span>
                <span className="text-[10px] text-slate-400 font-semibold block">Verified Firms</span>
              </div>
              <span className="inline-block bg-emerald-100 text-[#086942] font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                Active
              </span>
            </div>

            {/* Sub-card 3 */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                  🏡 Owners
                </span>
                <button className="text-slate-400 hover:text-slate-600">⋮</button>
              </div>
              <div>
                <span className="text-lg font-black text-slate-900 block">12</span>
                <span className="text-[10px] text-slate-400 font-semibold block">Direct Landlords</span>
              </div>
              <span className="inline-block bg-emerald-100 text-[#086942] font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                Active
              </span>
            </div>

            {/* Sub-card 4 */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                  🛡️ Admins
                </span>
                <button className="text-slate-400 hover:text-slate-600">⋮</button>
              </div>
              <div>
                <span className="text-lg font-black text-slate-900 block">2</span>
                <span className="text-[10px] text-slate-400 font-semibold block">Super Administrators</span>
              </div>
              <span className="inline-block bg-rose-100 text-rose-700 font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                System Active
              </span>
            </div>

          </div>
        </div>

        {/* Right Side: Platform Traffic & Activity Bar Chart */}
        <div className="lg:col-span-7 bg-white border border-slate-200/70 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Platform Activity & Views
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                142,850 <span className="text-xs text-slate-400 font-normal">views</span>
              </span>
            </div>

            {/* Monthly / Yearly Pill Selector */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-extrabold">
              <button
                onClick={() => setChartRange("Monthly")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  chartRange === "Monthly"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setChartRange("Yearly")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  chartRange === "Yearly"
                    ? "bg-[#086942] text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Yearly
              </button>
            </div>
          </div>

          {/* Bar Chart Graphics matching UI reference image */}
          <div className="pt-6 pb-2 relative">
            
            {/* Chart Tooltip mockup on highlight bar */}
            <div className="hidden sm:flex flex-col bg-slate-900 text-white text-[11px] p-2.5 rounded-xl shadow-lg absolute top-4 left-[38%] z-20 pointer-events-none border border-slate-700">
              <span className="text-slate-400 font-bold text-[9px] uppercase">July 25, 2026</span>
              <div className="flex items-center justify-between gap-4 font-extrabold mt-0.5">
                <span>Active Views</span>
                <span className="text-emerald-400">33,847</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-slate-400 text-[10px]">
                <span>Inflow Leads</span>
                <span className="text-slate-200">7,456</span>
              </div>
            </div>

            {/* Bars container */}
            <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-slate-100 pb-2">
              
              {/* Jan */}
              <div className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-slate-100 rounded-lg h-24 group-hover:bg-slate-200 transition-all" />
                <span className="text-[11px] font-bold text-slate-400">Jan</span>
              </div>

              {/* Feb */}
              <div className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-slate-100 rounded-lg h-28 group-hover:bg-slate-200 transition-all" />
                <span className="text-[11px] font-bold text-slate-400">Feb</span>
              </div>

              {/* Mar (Highlighted Bar from UI reference!) */}
              <div className="flex-1 flex flex-col items-center gap-2 relative">
                <div className="w-full bg-gradient-to-t from-[#086942] to-emerald-500 rounded-lg h-36 relative flex justify-center shadow-sm">
                  <div className="h-3 w-3 rounded-full bg-white ring-4 ring-[#086942] absolute top-1.5" />
                </div>
                <span className="text-[11px] font-extrabold text-[#086942]">Mar</span>
              </div>

              {/* Apr */}
              <div className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-slate-100 rounded-lg h-20 group-hover:bg-slate-200 transition-all" />
                <span className="text-[11px] font-bold text-slate-400">Apr</span>
              </div>

              {/* May */}
              <div className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-slate-100 rounded-lg h-32 group-hover:bg-slate-200 transition-all" />
                <span className="text-[11px] font-bold text-slate-400">May</span>
              </div>

              {/* Jun */}
              <div className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-slate-100 rounded-lg h-26 group-hover:bg-slate-200 transition-all" />
                <span className="text-[11px] font-bold text-slate-400">Jun</span>
              </div>

              {/* Jul */}
              <div className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-slate-100 rounded-lg h-30 group-hover:bg-slate-200 transition-all" />
                <span className="text-[11px] font-bold text-slate-400">Jul</span>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Bottom Section: Recent Activities & Moderation Table */}
      <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-xs space-y-4">
        
        {/* Table Top Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <h2 className="text-base font-extrabold text-slate-900 my-0">
            Recent Activities & Moderation Log
          </h2>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#086942] transition-colors"
              />
            </div>
            <button className="bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1.5 cursor-pointer">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <span>Filter ≡</span>
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-10">
                  <input type="checkbox" className="rounded border-slate-300 text-[#086942] focus:ring-[#086942]" />
                </th>
                <th className="py-3 px-4">Activity</th>
                <th className="py-3 px-4">Order ID / Ref</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Price / Plan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {recentActivities.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <input type="checkbox" className="rounded border-slate-300 text-[#086942] focus:ring-[#086942]" />
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <span className="font-bold text-slate-900 block">{row.activity}</span>
                      <span className="text-[11px] text-slate-400 block">{row.subtitle}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {row.ref}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-semibold">{row.date}</td>
                  <td className="py-3 px-4 text-slate-500">{row.time}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{row.amount}</td>
                  <td className="py-3 px-4">
                    {row.statusVariant === "success" && (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-[#086942] font-black text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#086942]" /> Completed
                      </span>
                    )}
                    {row.statusVariant === "warning" && (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 font-black text-[10px] px-2.5 py-0.5 rounded-full border border-amber-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-600" /> Pending
                      </span>
                    )}
                    {row.statusVariant === "danger" && (
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 font-black text-[10px] px-2.5 py-0.5 rounded-full border border-rose-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-600" /> Rejected
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-slate-400 hover:text-slate-600 p-1">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
