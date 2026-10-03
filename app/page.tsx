"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, Bell, CalendarDays, Check, ChevronDown,
  Clock3, Database, Droplets, FlaskConical, Gauge, History,
  LayoutDashboard, LockKeyhole, Menu, Radio, RefreshCw, Settings2,
  ShieldCheck, SlidersHorizontal, Waves, X,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { sendValveCommand } from "@/lib/supabase";

type ValveState = "open" | "closed";
type NavKey = "overview" | "control" | "schedule" | "records";

const trendData = [
  { time: "06:00", level: 78 }, { time: "08:00", level: 74 },
  { time: "10:00", level: 69 }, { time: "12:00", level: 64 },
  { time: "14:00", level: 61 }, { time: "16:00", level: 58 },
  { time: "Now", level: 62 },
];

const records = [
  { time: "4:32 PM", level: "62%", ph: "7.2", tds: "184 ppm", turbidity: "1.8 NTU", status: "Normal" },
  { time: "4:17 PM", level: "61%", ph: "7.2", tds: "186 ppm", turbidity: "1.8 NTU", status: "Normal" },
  { time: "4:02 PM", level: "60%", ph: "7.1", tds: "185 ppm", turbidity: "1.9 NTU", status: "Normal" },
  { time: "3:47 PM", level: "59%", ph: "7.2", tds: "183 ppm", turbidity: "2.1 NTU", status: "Review" },
];

const schedules = [
  { day: "Today", purok: "Purok 3", time: "3:00 PM – 6:00 PM", state: "Active" },
  { day: "Tuesday", purok: "Purok 4", time: "6:00 AM – 9:00 AM", state: "Upcoming" },
  { day: "Wednesday", purok: "Purok 5", time: "6:00 AM – 9:00 AM", state: "Upcoming" },
  { day: "Thursday", purok: "Purok 6", time: "6:00 AM – 9:00 AM", state: "Upcoming" },
];

const navItems: { id: NavKey; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "control", label: "Valve control", icon: SlidersHorizontal },
  { id: "schedule", label: "Schedule", icon: CalendarDays },
  { id: "records", label: "Records", icon: History },
];

function TankGauge({ level }: { level: number }) {
  return (
    <div className="tank-wrap" aria-label={`Main tank is ${level}% full`}>
      <div className="tank-orbit tank-orbit-a" /><div className="tank-orbit tank-orbit-b" />
      <div className="tank-shell">
        <div className="tank-water" style={{ height: `${level}%` }}><span className="wave wave-a" /><span className="wave wave-b" /></div>
        <div className="tank-reading"><span>{level}%</span><small>2,480 L</small></div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, note, tone }: {
  icon: typeof Gauge; label: string; value: string; note: string; tone: "cyan" | "blue" | "violet";
}) {
  return <article className="glass metric-card"><div className={`metric-icon ${tone}`}><Icon size={20} /></div><div><p className="eyebrow">{label}</p><div className="metric-value">{value}</div><div className="metric-note"><span className="status-dot" />{note}</div></div></article>;
}

function Overview({ valve, onValve }: { valve: ValveState; onValve: (next: ValveState) => void }) {
  const [alertVisible, setAlertVisible] = useState(true);
  return (
    <div className="view-stack">
      <section className="hero-grid">
        <article className="glass tank-card">
          <div className="card-heading"><div><p className="eyebrow">Main reservoir</p><h2>Tank level</h2></div><span className="live-pill"><Radio size={13} /> Live</span></div>
          <div className="tank-content">
            <TankGauge level={62} />
            <div className="tank-details">
              <p className="muted-copy">Safe operating range</p><div className="level-scale"><span style={{ width: "62%" }} /></div><div className="scale-labels"><span>0 L</span><span>4,000 L</span></div>
              <div className="reading-row"><span>Ultrasonic sensor</span><strong>Online</strong></div><div className="reading-row"><span>Last reading</span><strong>8 sec ago</strong></div>
            </div>
          </div>
        </article>
        <aside className="glass valve-card">
          <div className="card-heading"><div><p className="eyebrow">Distribution line A</p><h2>Assisted control</h2></div><ShieldCheck size={20} className="aqua" /></div>
          <div className={`valve-visual ${valve}`}><div className="pipe pipe-left" /><div className="valve-wheel"><Settings2 size={34} /></div><div className="pipe pipe-right" /></div>
          <div className="valve-status-row"><div><span className={`status-dot ${valve}`} /><strong>Valve {valve}</strong></div><span>Purok 3 · On schedule</span></div>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button className="control-button" variant={valve === "open" ? "outline" : "default"}><LockKeyhole size={16} /> {valve === "open" ? "Close valve" : "Open valve"}</Button></AlertDialogTrigger>
            <AlertDialogContent className="glass dialog-panel"><AlertDialogHeader><AlertDialogTitle>{valve === "open" ? "Close" : "Open"} Distribution Line A?</AlertDialogTitle><AlertDialogDescription>This assisted command will be recorded with your account and sent to the ESP32 controller. Purok 3 is within its assigned time.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onValve(valve === "open" ? "closed" : "open")}>Confirm command</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
          </AlertDialog>
          <p className="safety-note"><LockKeyhole size={13} /> Authorized control only</p>
        </aside>
      </section>

      <section className="metrics-grid" aria-label="Current water quality readings">
        <MetricCard icon={FlaskConical} label="pH level" value="7.2" note="Within 6.5–8.5 range" tone="cyan" />
        <MetricCard icon={Activity} label="Total dissolved solids" value="184 ppm" note="Good indicator" tone="blue" />
        <MetricCard icon={Waves} label="Turbidity" value="1.8 NTU" note="Clear condition" tone="violet" />
      </section>

      <section className="lower-grid">
        <article className="glass chart-card">
          <div className="card-heading"><div><p className="eyebrow">Last 12 hours</p><h2>Water level trend</h2></div><button className="icon-button" aria-label="Refresh chart" onClick={() => toast.success("Readings refreshed")}><RefreshCw size={17} /></button></div>
          <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%" minWidth={0}><AreaChart data={trendData} margin={{ top: 8, right: 4, bottom: 0, left: -22 }}><defs><linearGradient id="levelFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#45e8f2" stopOpacity={0.42} /><stop offset="100%" stopColor="#45e8f2" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="rgba(255,255,255,.07)" vertical={false} /><XAxis dataKey="time" stroke="#7992a8" fontSize={12} tickLine={false} axisLine={false} /><YAxis domain={[40, 90]} stroke="#7992a8" fontSize={12} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ background: "#0d2532", border: "1px solid rgba(125,231,239,.2)", borderRadius: 12 }} /><Area type="monotone" dataKey="level" stroke="#45e8f2" strokeWidth={2.5} fill="url(#levelFill)" /></AreaChart></ResponsiveContainer></div>
        </article>
        <aside className="glass alert-card">
          <div className="card-heading"><div><p className="eyebrow">Attention</p><h2>System alerts</h2></div><span className="alert-count">{alertVisible ? 1 : 0}</span></div>
          {alertVisible ? <div className="alert-item"><div className="alert-icon"><AlertTriangle size={20} /></div><div><strong>Turbidity change detected</strong><p>Reading briefly reached 2.1 NTU. Observe the next sample.</p><span>45 minutes ago</span></div><button aria-label="Acknowledge alert" onClick={() => { setAlertVisible(false); toast.success("Alert acknowledged"); }}><Check size={17} /></button></div> : <div className="all-clear"><ShieldCheck size={28} /><strong>All clear</strong><span>No unacknowledged alerts.</span></div>}
          <div className="schedule-mini"><Clock3 size={18} /><div><span>Current schedule</span><strong>Purok 3 until 6:00 PM</strong></div></div>
        </aside>
      </section>
    </div>
  );
}

function ControlView({ valve, onValve }: { valve: ValveState; onValve: (next: ValveState) => void }) {
  const lines = [
    { name: "Distribution Line A", area: "Purok 3", state: valve, active: true },
    { name: "Distribution Line B", area: "Purok 1 & 2", state: "closed" as ValveState, active: false },
    { name: "Distribution Line C", area: "Purok 4–6", state: "closed" as ValveState, active: false },
  ];
  return <div className="section-grid"><article className="glass detail-card wide-card"><p className="eyebrow">Assisted distribution control</p><h2>Valve lines</h2><p className="section-intro">Commands require confirmation and are permanently recorded for accountability.</p><div className="control-list">{lines.map((item) => <div className="control-row" key={item.name}><div className={`line-icon ${item.state}`}><Settings2 size={22} /></div><div className="grow"><strong>{item.name}</strong><span>{item.area}</span></div><span className={`state-chip ${item.state}`}>{item.state}</span>{item.active ? <Button size="sm" variant="outline" onClick={() => onValve(valve === "open" ? "closed" : "open")}>Set {valve === "open" ? "closed" : "open"}</Button> : <Button size="sm" variant="outline" disabled>Off schedule</Button>}</div>)}</div></article><aside className="glass detail-card"><p className="eyebrow">Command safeguards</p><h2>Operator checklist</h2><div className="check-list"><div><Check size={16} /><span>Verify assigned purok and time</span></div><div><Check size={16} /><span>Check tank level before opening</span></div><div><Check size={16} /><span>Observe valve response status</span></div><div><Check size={16} /><span>Report abnormal pressure or flow</span></div></div></aside></div>;
}

function ScheduleView() {
  return <article className="glass detail-card"><div className="card-heading"><div><p className="eyebrow">Alternating service plan</p><h2>Distribution schedule</h2></div><Button variant="outline" onClick={() => toast.info("Schedule editor ready for Supabase connection")}>Edit schedule</Button></div><div className="schedule-list">{schedules.map((item) => <div className="schedule-row" key={item.day}><div className="calendar-tile"><span>{item.day === "Today" ? "03" : item.day.slice(0, 2)}</span><small>{item.day}</small></div><div className="grow"><strong>{item.purok}</strong><span>{item.time}</span></div><span className={`state-chip ${item.state.toLowerCase()}`}>{item.state}</span></div>)}</div></article>;
}

function RecordsView() {
  return <article className="glass detail-card records-card"><div className="card-heading"><div><p className="eyebrow">Sensor archive</p><h2>Monitoring records</h2></div><Button variant="outline" onClick={() => toast.success("CSV export prepared")}>Export CSV</Button></div><div className="table-shell"><Table><TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Tank</TableHead><TableHead>pH</TableHead><TableHead>TDS</TableHead><TableHead>Turbidity</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{records.map((record) => <TableRow key={record.time}><TableCell>{record.time}</TableCell><TableCell>{record.level}</TableCell><TableCell>{record.ph}</TableCell><TableCell>{record.tds}</TableCell><TableCell>{record.turbidity}</TableCell><TableCell><span className={`state-chip ${record.status.toLowerCase()}`}>{record.status}</span></TableCell></TableRow>)}</TableBody></Table></div></article>;
}

export default function Home() {
  const [active, setActive] = useState<NavKey>("overview");
  const [valve, setValve] = useState<ValveState>("open");
  const [mobileMenu, setMobileMenu] = useState(false);
  const updateValve = useCallback(async (next: ValveState) => {
    const previous = valve; setValve(next);
    try { const mode = await sendValveCommand("distribution-line-a", next); toast.success("Valve command confirmed", { description: mode === "demo" ? "Saved in prototype mode" : "Synced to Supabase" }); }
    catch { setValve(previous); toast.error("Command could not be saved. Please try again."); }
  }, [valve]);

  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool: (tool: object, options?: object) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try { void Promise.resolve(context.registerTool({ name: "set_distribution_valve", title: "Set distribution valve", description: "Open or close Distribution Line A using the dashboard's audited valve command.", inputSchema: { type: "object", properties: { state: { type: "string", enum: ["open", "closed"] } }, required: ["state"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: async (input: unknown) => { const state = (input as { state?: string })?.state; if (state !== "open" && state !== "closed") throw new Error("State must be open or closed"); await updateValve(state); return { valve: "distribution-line-a", state }; } }, { signal: lifecycle.signal })).catch(() => undefined); } catch { /* Unsupported browser. */ }
    return () => lifecycle.abort();
  }, [updateValve]);

  const title = useMemo(() => navItems.find((item) => item.id === active)?.label ?? "Overview", [active]);
  return (
    <main className="app-shell"><div className="ambient ambient-one" /><div className="ambient ambient-two" /><div className="grid-texture" />
      <aside className={`sidebar ${mobileMenu ? "mobile-open" : ""}`}><div className="brand"><div className="brand-mark"><Droplets size={24} /></div><div><strong>SmarTubig</strong><span>Barangay Hinanggayon</span></div></div><button className="close-menu" aria-label="Close navigation" onClick={() => setMobileMenu(false)}><X size={20} /></button><nav aria-label="Primary navigation">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={active === id ? "active" : ""} onClick={() => { setActive(id); setMobileMenu(false); }}><Icon size={19} /><span>{label}</span></button>)}</nav><div className="system-card"><div className="system-line"><span className="pulse-dot" /><strong>System online</strong></div><p>ESP32 gateway connected</p><div className="system-meta"><span><Database size={13} /> Demo data</span><span>99.8%</span></div></div><div className="profile"><div className="avatar">LM</div><div><strong>Laurence Medenilla</strong><span>Administrator</span></div><ChevronDown size={16} /></div></aside>
      <section className="main-panel"><header className="topbar"><div className="heading-group"><button className="menu-button" aria-label="Open navigation" onClick={() => setMobileMenu(true)}><Menu size={22} /></button><div><p>Saturday, October 3</p><h1>{title}</h1></div></div><div className="top-actions"><div className="connection"><span className="pulse-dot" /> Live · updated 8 sec ago</div><button className="icon-button notification-button" aria-label="Notifications"><Bell size={19} /><span /></button></div></header><div className="content-area"><Tabs value={active} onValueChange={(value) => setActive(value as NavKey)}><TabsList className="mobile-tabs glass" variant="line">{navItems.map(({ id, label }) => <TabsTrigger value={id} key={id}>{label}</TabsTrigger>)}</TabsList><TabsContent value="overview"><Overview valve={valve} onValve={updateValve} /></TabsContent><TabsContent value="control"><ControlView valve={valve} onValve={updateValve} /></TabsContent><TabsContent value="schedule"><ScheduleView /></TabsContent><TabsContent value="records"><RecordsView /></TabsContent></Tabs></div></section>
      {mobileMenu && <button className="menu-backdrop" aria-label="Close navigation" onClick={() => setMobileMenu(false)} />}<Toaster theme="dark" position="top-right" richColors />
    </main>
  );
}
