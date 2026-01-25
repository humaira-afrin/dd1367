"use client";

import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

/*
 * User roles
 */
type Role = "Admin" | "PharmacyManager" | "Viewer";

type Department = {
  id: string;
  name: string;
};

type Drug = {
  id: string;
  name: string;
  costPerMlEur: number;
};

type WasteReason =
  | "Expired"
  | "Overprepared"
  | "OpenedNotUsed"
  | "Spillage"
  | "StockRotation"
  | "Other";

type WasteEvent = {
  id: string;
  occurredAt: string; // ISO
  departmentId: string;
  drugId: string;
  volumeMl: number;
  reason: WasteReason;
};

/*
 * Demo data based excel sheet
 */

// departments
const DEMO_DEPARTMENTS: Department[] = [
  { id: "H1_ICU", name: "Karolinska – Intensive Care Unit" },
  { id: "H1_ED", name: "Karolinska – Emergency Department" },
  { id: "H1_SURG", name: "Karolinska – Surgery Department" },
  { id: "H1_IM", name: "Karolinska – Internal Medicine" },
  { id: "H2_ICU", name: "Capio S:t Görans – Intensive Care Unit" },
  { id: "H2_ED", name: "Capio S:t Görans – Emergency Department" },
  { id: "H2_SURG", name: "Capio S:t Görans – Surgery Department" },
  { id: "H2_IM", name: "Capio S:t Görans – Internal Medicine" },
];

// drugs and costPerMl
const DEMO_DRUGS: Drug[] = [
  { id: "D001", name: "Propofol", costPerMlEur: 0.25 },
  { id: "D002", name: "Midazolam", costPerMlEur: 0.2 },
  { id: "D003", name: "Fentanyl", costPerMlEur: 0.3 },
  { id: "D004", name: "Morphine", costPerMlEur: 0.2 },
  { id: "D005", name: "Noradrenaline", costPerMlEur: 0.6 },
  { id: "D006", name: "Adrenaline", costPerMlEur: 0.5 },
  { id: "D007", name: "Heparin", costPerMlEur: 0.8 },
  { id: "D008", name: "Insulin (IV)", costPerMlEur: 0.3 },
  { id: "D009", name: "Paracetamol (IV)", costPerMlEur: 0.01 },
  { id: "D010", name: "Ondansetron", costPerMlEur: 0.5 },
  { id: "D011", name: "Metoclopramide", costPerMlEur: 0.5 },
  { id: "D012", name: "Ceftriaxone", costPerMlEur: 0.3 },
  { id: "D013", name: "Amoxicillin-Clavulanate (IV)", costPerMlEur: 0.2 },
  { id: "D014", name: "Furosemide (IV)", costPerMlEur: 0.5 },
  { id: "D015", name: "Pantoprazole (IV)", costPerMlEur: 0.2 },
  { id: "D016", name: "Metronidazole (IV)", costPerMlEur: 0.015 },
  { id: "D017", name: "Dexamethasone (IV)", costPerMlEur: 1.0 },
  { id: "D018", name: "Sevoflurane (Anesthetic)", costPerMlEur: 0.15 },
  { id: "D019", name: "Rocuronium", costPerMlEur: 0.4 },
  { id: "D020", name: "Sugammadex", costPerMlEur: 1.5 },
  { id: "D021", name: "Salbutamol (Nebules)", costPerMlEur: 0.08 },
  { id: "D022", name: "Ketorolac (IV)", costPerMlEur: 1.0 },
  { id: "D023", name: "Cefazolin (IV)", costPerMlEur: 0.25 },
  { id: "D024", name: "Vancomycin (IV)", costPerMlEur: 0.3 },
  { id: "D025", name: "Meropenem (IV)", costPerMlEur: 0.25 },
  { id: "D026", name: "Omeprazole (IV)", costPerMlEur: 0.1 },
  { id: "D027", name: "Enoxaparin", costPerMlEur: 0.25 },
  { id: "D028", name: "Dopamine (IV)", costPerMlEur: 0.25 },
  { id: "D029", name: "Amiodarone (IV)", costPerMlEur: 0.25 },
  { id: "D030", name: "Lidocaine (IV)", costPerMlEur: 0.15 },
];

// Vial volumes (from excel sheet)
const DRUG_VIAL_VOLUME_ML: Record<string, number> = {
  D001: 20,
  D002: 10,
  D003: 10,
  D004: 10,
  D005: 10,
  D006: 10,
  D007: 5,
  D008: 10,
  D009: 100,
  D010: 4,
  D011: 2,
  D012: 10,
  D013: 20,
  D014: 2,
  D015: 10,
  D016: 100,
  D017: 1,
  D018: 250,
  D019: 10,
  D020: 2,
  D021: 2.5,
  D022: 1,
  D023: 8,
  D024: 50,
  D025: 20,
  D026: 40,
  D027: 40,
  D028: 10,
  D029: 3,
  D030: 20,
};

// Department weights (used for “Typical Uses per Day” totals)
const DEPARTMENT_WEIGHTS: { departmentId: string; weight: number }[] = [
  { departmentId: "H1_ICU", weight: 72.0 },
  { departmentId: "H2_ICU", weight: 56.5 },
  { departmentId: "H1_ED", weight: 54.0 },
  { departmentId: "H1_SURG", weight: 48.5 },
  { departmentId: "H1_IM", weight: 45.5 },
  { departmentId: "H2_ED", weight: 42.5 },
  { departmentId: "H2_SURG", weight: 39.0 },
  { departmentId: "H2_IM", weight: 36.5 },
];

// Top drugs per department (from Excel)
const DEPARTMENT_DRUG_PROFILE: Record<string, { drugId: string; weight: number }[]> = {
  H1_ED: [
    { drugId: "D009", weight: 4.0 },
    { drugId: "D012", weight: 4.0 },
    { drugId: "D004", weight: 3.0 },
    { drugId: "D010", weight: 3.0 },
    { drugId: "D011", weight: 3.0 },
    { drugId: "D013", weight: 3.0 },
    { drugId: "D014", weight: 3.0 },
    { drugId: "D022", weight: 3.0 },
    { drugId: "D001", weight: 2.0 },
    { drugId: "D021", weight: 2.0 },
  ],
  H1_ICU: [
    { drugId: "D001", weight: 6.0 },
    { drugId: "D005", weight: 6.0 },
    { drugId: "D006", weight: 5.0 },
    { drugId: "D002", weight: 5.0 },
    { drugId: "D003", weight: 4.0 },
    { drugId: "D007", weight: 4.0 },
    { drugId: "D004", weight: 3.0 },
    { drugId: "D028", weight: 3.0 },
    { drugId: "D024", weight: 3.0 },
    { drugId: "D025", weight: 2.0 },
  ],
  H1_SURG: [
    { drugId: "D018", weight: 5.0 },
    { drugId: "D001", weight: 4.0 },
    { drugId: "D022", weight: 4.0 },
    { drugId: "D019", weight: 3.5 },
    { drugId: "D020", weight: 3.0 },
    { drugId: "D030", weight: 3.0 },
    { drugId: "D004", weight: 2.5 },
    { drugId: "D010", weight: 2.0 },
    { drugId: "D023", weight: 2.0 },
    { drugId: "D017", weight: 2.0 },
  ],
  H1_IM: [
    { drugId: "D009", weight: 3.0 },
    { drugId: "D014", weight: 3.0 },
    { drugId: "D015", weight: 3.0 },
    { drugId: "D012", weight: 2.5 },
    { drugId: "D013", weight: 2.5 },
    { drugId: "D026", weight: 2.0 },
    { drugId: "D027", weight: 2.0 },
    { drugId: "D011", weight: 2.0 },
    { drugId: "D008", weight: 2.0 },
    { drugId: "D016", weight: 1.5 },
  ],
  H2_ED: [
    { drugId: "D009", weight: 3.0 },
    { drugId: "D012", weight: 3.0 },
    { drugId: "D004", weight: 2.5 },
    { drugId: "D010", weight: 2.5 },
    { drugId: "D011", weight: 2.5 },
    { drugId: "D013", weight: 2.5 },
    { drugId: "D014", weight: 2.5 },
    { drugId: "D022", weight: 2.0 },
    { drugId: "D001", weight: 1.5 },
    { drugId: "D021", weight: 1.5 },
  ],
  H2_ICU: [
    { drugId: "D001", weight: 5.0 },
    { drugId: "D005", weight: 5.0 },
    { drugId: "D006", weight: 4.0 },
    { drugId: "D002", weight: 4.0 },
    { drugId: "D003", weight: 3.5 },
    { drugId: "D007", weight: 3.5 },
    { drugId: "D004", weight: 2.5 },
    { drugId: "D028", weight: 2.5 },
    { drugId: "D024", weight: 2.5 },
    { drugId: "D025", weight: 2.0 },
  ],
  H2_SURG: [
    { drugId: "D018", weight: 4.0 },
    { drugId: "D001", weight: 3.0 },
    { drugId: "D022", weight: 3.0 },
    { drugId: "D019", weight: 2.5 },
    { drugId: "D020", weight: 2.0 },
    { drugId: "D030", weight: 2.0 },
    { drugId: "D004", weight: 2.0 },
    { drugId: "D010", weight: 1.5 },
    { drugId: "D023", weight: 1.5 },
    { drugId: "D017", weight: 1.5 },
  ],
  H2_IM: [
    { drugId: "D009", weight: 2.5 },
    { drugId: "D014", weight: 2.5 },
    { drugId: "D015", weight: 2.5 },
    { drugId: "D012", weight: 2.0 },
    { drugId: "D013", weight: 2.0 },
    { drugId: "D026", weight: 1.8 },
    { drugId: "D027", weight: 1.8 },
    { drugId: "D011", weight: 1.8 },
    { drugId: "D008", weight: 1.6 },
    { drugId: "D016", weight: 1.3 },
  ],
};

const REASONS: WasteReason[] = [
  "Expired",
  "Overprepared",
  "OpenedNotUsed",
  "Spillage",
  "StockRotation",
  "Other",
];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function pickWeighted<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((sum, it) => sum + (it.weight || 0), 0) || 1;
  let r = Math.random() * total;
  for (const it of items) {
    r -= it.weight || 0;
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

function toISODateOnly(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// Generate events using Excel-like dept/drug usage patterns
function generateMockEvents(count: number, daysBack: number): WasteEvent[] {
  const events: WasteEvent[] = [];

  // fallback if profile missing
  const fallbackDrugWeights = DEMO_DRUGS.map((d) => ({ drugId: d.id, weight: 1 }));

  for (let i = 0; i < count; i++) {
    const dayOffset = randInt(0, daysBack);
    const d = daysAgo(dayOffset);
    d.setHours(randInt(0, 23), randInt(0, 59), 0, 0);

    // pick department with Excel weighting
    const deptPick = pickWeighted(DEPARTMENT_WEIGHTS);
    const departmentId = deptPick.departmentId;

    // pick drug based on that department's typical usage
    const drugOptions = DEPARTMENT_DRUG_PROFILE[departmentId] ?? fallbackDrugWeights;
    const drugPick = pickWeighted(drugOptions);
    const drugId = drugPick.drugId;

    // waste volume based on vial size
    const vialMl = DRUG_VIAL_VOLUME_ML[drugId] ?? 10;
    const frac = Math.max(0.05, Math.pow(Math.random(), 0.7)); 
    const volumeMl = Math.round(vialMl * frac * 10) / 10;

    events.push({
      id: `we_${i}_${Math.random().toString(16).slice(2)}`,
      occurredAt: d.toISOString(),
      departmentId,
      drugId,
      volumeMl,
      reason: pick(REASONS),
    });
  }

  // order newest first
  events.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
  return events;
}

const DEMO_EVENTS: WasteEvent[] = generateMockEvents(220, 90);

/*
 * helpers functions
*/
function eurForEvent(e: WasteEvent, drugById: Map<string, Drug>) {
  const drug = drugById.get(e.drugId);
  const rate = drug?.costPerMlEur ?? 0;
  return e.volumeMl * rate;
}

function formatEur(x: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR" }).format(x);
}

function formatMl(x: number) {
  return `${Math.round(x)} mL`;
}

function shortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function shortTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/*
 * UI
*/
function Card(props: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-slate-700">{props.title}</div>
        {props.right}
      </div>
      {props.children}
    </div>
  );
}

function KpiCard(props: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
      <div className="text-xs font-medium text-slate-500">{props.label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{props.value}</div>
      {props.sub ? <div className="mt-1 text-xs text-slate-500">{props.sub}</div> : null}
    </div>
  );
}

function Select(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-600">
      <span className="font-medium">{props.label}</span>
      <select
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-sky-200"
      >
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function Page() {
  const user = { name: "User", role: "Admin" as Role, hospitalName: "" };

  const drugById = useMemo(() => new Map(DEMO_DRUGS.map((d) => [d.id, d])), []);
  const deptById = useMemo(() => new Map(DEMO_DEPARTMENTS.map((d) => [d.id, d])), []);

  const [range, setRange] = useState<"7" | "30" | "90">("30");
  const [department, setDepartment] = useState<string>("all");

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const min = new Date(now);
    min.setDate(now.getDate() - Number(range));
    const minTs = min.getTime();

    return DEMO_EVENTS.filter((e) => {
      const t = new Date(e.occurredAt).getTime();
      if (t < minTs) return false;
      if (department !== "all" && e.departmentId !== department) return false;
      return true;
    });
  }, [range, department]);

  const totals = useMemo(() => {
    let totalMl = 0;
    let totalEur = 0;

    for (const e of filteredEvents) {
      totalMl += e.volumeMl;
      totalEur += eurForEvent(e, drugById);
    }

    const eventCount = filteredEvents.length;
    const avgEur = eventCount > 0 ? totalEur / eventCount : 0;

    return { totalMl, totalEur, eventCount, avgEur };
  }, [filteredEvents, drugById]);

  const timeSeries = useMemo(() => {
    const m = new Map<string, { day: string; eur: number; ml: number; events: number }>();

    for (const e of filteredEvents) {
      const day = toISODateOnly(startOfDay(new Date(e.occurredAt)));
      const prev = m.get(day) ?? { day, eur: 0, ml: 0, events: 0 };
      prev.eur += eurForEvent(e, drugById);
      prev.ml += e.volumeMl;
      prev.events += 1;
      m.set(day, prev);
    }

    return Array.from(m.values()).sort((a, b) => (a.day < b.day ? -1 : 1));
  }, [filteredEvents, drugById]);

  const topDrugs = useMemo(() => {
    const m = new Map<string, { name: string; eur: number; ml: number; events: number }>();

    for (const e of filteredEvents) {
      const drug = drugById.get(e.drugId);
      const name = drug?.name ?? e.drugId;

      const prev = m.get(e.drugId) ?? { name, eur: 0, ml: 0, events: 0 };
      prev.eur += eurForEvent(e, drugById);
      prev.ml += e.volumeMl;
      prev.events += 1;
      m.set(e.drugId, prev);
    }

    return Array.from(m.values())
      .sort((a, b) => b.eur - a.eur)
      .slice(0, 6);
  }, [filteredEvents, drugById]);

  const topDepartments = useMemo(() => {
    const m = new Map<string, { name: string; eur: number; ml: number; events: number }>();

    for (const e of filteredEvents) {
      const dept = deptById.get(e.departmentId);
      const name = dept?.name ?? e.departmentId;

      const prev = m.get(e.departmentId) ?? { name, eur: 0, ml: 0, events: 0 };
      prev.eur += eurForEvent(e, drugById);
      prev.ml += e.volumeMl;
      prev.events += 1;
      m.set(e.departmentId, prev);
    }

    return Array.from(m.values())
      .sort((a, b) => b.eur - a.eur)
      .slice(0, 6);
  }, [filteredEvents, deptById, drugById]);

  const recommendations = useMemo(() => {
    const total = totals.totalEur || 1;
    const drug = topDrugs[0];
    const dept = topDepartments[0];
    const recs: string[] = [];

    if (drug && drug.eur / total > 0.25) {
      recs.push(
        `Investigate preparation practices for ${drug.name}. It accounts for ~${Math.round(
          (drug.eur / total) * 100
        )}% of waste cost in the selected period.`
      );
    } else if (drug) {
      recs.push(`Top waste contributor is ${drug.name}. Review ordering and prep volumes for this drug.`);
    }

    if (dept && dept.eur / total > 0.25) {
      recs.push(
        `Focus on ${dept.name}. It contributes ~${Math.round((dept.eur / total) * 100)}% of waste cost.`
      );
    } else if (dept) {
      recs.push(`Highest-waste department is ${dept.name}. Consider a short audit of workflows and stock rotation.`);
    }

    const reasonCount = new Map<WasteReason, number>();
    for (const e of filteredEvents) reasonCount.set(e.reason, (reasonCount.get(e.reason) ?? 0) + 1);
    const topReason = Array.from(reasonCount.entries()).sort((a, b) => b[1] - a[1])[0];
    if (topReason) recs.push(`Most common reason: ${topReason[0]}. Target this cause first for a quick win.`);

    return recs.slice(0, 3);
  }, [filteredEvents, totals.totalEur, topDrugs, topDepartments]);

  const deptOptions = useMemo(() => {
    return [
      { value: "all", label: "All departments" },
      ...DEMO_DEPARTMENTS.map((d) => ({ value: d.id, label: d.name })),
    ];
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-500">{user.hospitalName}</div>
            <div className="text-xl font-semibold text-slate-900">BinCalc Waste Dashboard</div>
          </div>
          <div className="text-sm text-slate-600">
            {user.name} · <span className="font-medium">{user.role}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex flex-wrap gap-3 items-end">
          <Select
            label="Date range"
            value={range}
            onChange={(v) => setRange(v as any)}
            options={[
              { value: "7", label: "Last 7 days" },
              { value: "30", label: "Last 30 days" },
              { value: "90", label: "Last 90 days" },
            ]}
          />
          <Select label="Department" value={department} onChange={setDepartment} options={deptOptions} />
          <div className="ml-auto text-xs text-slate-500">
            Showing <span className="font-medium text-slate-700">{filteredEvents.length}</span> events
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total waste volume" value={formatMl(totals.totalMl)} sub={`Period: last ${range} days`} />
        <KpiCard label="Total waste cost" value={formatEur(totals.totalEur)} sub="Estimated from drug cost/mL" />
        <KpiCard label="Waste events" value={`${totals.eventCount}`} sub="Count of recorded events" />
        <KpiCard label="Avg cost per event" value={formatEur(totals.avgEur)} sub="Useful for targeting big spikes" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <Card title="Waste cost over time (€)">
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <AreaChart data={timeSeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tickFormatter={(v) => v.slice(5)} />
                  <YAxis tickFormatter={(v) => `${Math.round(v)}`} />
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      if (name === "eur") return [formatEur(Number(value)), "Cost"];
                      if (name === "ml") return [formatMl(Number(value)), "Volume"];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Day: ${label}`}
                  />
                  <Area type="monotone" dataKey="eur" strokeWidth={2} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Tip: spikes usually indicate workflow changes, batching, or stock expiry issues.
            </div>
          </Card>
        </div>

        <Card title="Recommendations">
          <ul className="space-y-2 text-sm text-slate-700">
            {recommendations.map((r, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-sky-500 shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 text-xs text-slate-500">
          
          </div>
        </Card>

        <Card title="Top drugs by waste cost (€)">
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={topDrugs} layout="vertical" margin={{ top: 10, right: 16, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => `${Math.round(v)}`} />
                <YAxis type="category" dataKey="name" width={140} />
                <Tooltip formatter={(value: any) => [formatEur(Number(value)), "Cost"]} labelFormatter={() => ""} />
                <Bar dataKey="eur" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Top departments by waste cost (€)">
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={topDepartments} layout="vertical" margin={{ top: 10, right: 16, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => `${Math.round(v)}`} />
                <YAxis type="category" dataKey="name" width={220} />
                <Tooltip formatter={(value: any) => [formatEur(Number(value)), "Cost"]} labelFormatter={() => ""} />
                <Bar dataKey="eur" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="lg:col-span-3">
          <Card title="Recent waste events" right={<span className="text-xs text-slate-500">Prototype table</span>}>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs text-slate-500">
                  <tr className="border-b border-slate-200">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Time</th>
                    <th className="py-2 pr-4">Department</th>
                    <th className="py-2 pr-4">Drug</th>
                    <th className="py-2 pr-4">Volume</th>
                    <th className="py-2 pr-4">Reason</th>
                    <th className="py-2 pr-4">Est. cost</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {filteredEvents.slice(0, 12).map((e) => {
                    const dept = deptById.get(e.departmentId)?.name ?? e.departmentId;
                    const drug = drugById.get(e.drugId)?.name ?? e.drugId;
                    const cost = eurForEvent(e, drugById);

                    return (
                      <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 pr-4 whitespace-nowrap">{shortDate(e.occurredAt)}</td>
                        <td className="py-2 pr-4 whitespace-nowrap">{shortTime(e.occurredAt)}</td>
                        <td className="py-2 pr-4 whitespace-nowrap">{dept}</td>
                        <td className="py-2 pr-4 whitespace-nowrap">{drug}</td>
                        <td className="py-2 pr-4 whitespace-nowrap">{formatMl(e.volumeMl)}</td>
                        <td className="py-2 pr-4 whitespace-nowrap">{e.reason}</td>
                        <td className="py-2 pr-4 whitespace-nowrap">{formatEur(cost)}</td>
                      </tr>
                    );
                  })}
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500">
                        No events found for this filter.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}