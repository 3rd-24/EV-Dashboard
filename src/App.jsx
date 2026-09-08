import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// Small inline icons (no external icon library needed)
function ZapIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width={props.size || 20} height={props.size || 20} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function ThermometerIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width={props.size || 13} height={props.size || 13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
    </svg>
  );
}
function BatteryChargingIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width={props.size || 13} height={props.size || 13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="6" width="18" height="12" rx="2" ry="2" />
      <line x1="23" y1="13" x2="23" y2="11" />
      <polyline points="11 6 7 12 13 12 9 18" />
    </svg>
  );
}
function ActivityIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width={props.size || 13} height={props.size || 13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
function RouteIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width={props.size || 13} height={props.size || 13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" />
      <path d="M8.5 19h8a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2h-9a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h9.5" />
    </svg>
  );
}
function GaugeCircleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width={props.size || 13} height={props.size || 13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 12 8 9" /><path d="M12 8v1" />
    </svg>
  );
}
function ListIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width={props.size || 13} height={props.size || 13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
function CircleGaugeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width={props.size || 13} height={props.size || 13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 12l4-2" />
    </svg>
  );
}
function HeartPulseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width={props.size || 13} height={props.size || 13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.5-1.5 3-3.5 3-5.5A4.5 4.5 0 0 0 13.5 5 4.5 4.5 0 0 0 5 8.5c0 2 1.5 4 3 5.5" />
      <path d="M3 14h4l2-4 3 8 2-5h3" />
    </svg>
  );
}

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const jitter = (n) => (Math.random() - 0.5) * n;
const nowStr = () => new Date().toLocaleTimeString([], { hour12: false });

function statusFor(temp) {
  if (temp >= 70) return { label: "Critical", color: "var(--coral)" };
  if (temp >= 50) return { label: "Warm", color: "var(--amber)" };
  return { label: "Normal", color: "var(--mint)" };
}

const LOG_NAMES = { motor: "Motor core", m1: "STM32 M-1", m2: "STM32 M-2", m3: "STM32 M-3", m4: "STM32 M-4" };
function levelFor(label) {
  if (label === "Critical") return "crit";
  if (label === "Warm") return "warn";
  return "ok";
}

// --- gauge geometry -------------------------------------------------
const CX = 100, CY = 100;
const GAUGE_START = 220; // degrees, measured clockwise from top
const GAUGE_END = 495;   // 275° total sweep, gap at the bottom
const MAX_SPEED = 120;

function pointAt(r, angleFromTop) {
  const rad = ((angleFromTop - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function arcPath(r, startAngle, endAngle) {
  const start = pointAt(r, startAngle);
  const end = pointAt(r, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function angleFor(value) {
  return GAUGE_START + (clamp(value, 0, MAX_SPEED) / MAX_SPEED) * (GAUGE_END - GAUGE_START);
}

function SpeedGauge({ speed }) {
  const valueAngle = angleFor(speed);
  const majorTicks = [0, 20, 40, 60, 80, 100, 120];
  const minorTicks = Array.from({ length: 25 }, (_, i) => i * 5).filter((v) => v % 20 !== 0);
  const needleTip = pointAt(86, valueAngle);

  return (
    <svg viewBox="0 0 200 200" className="gauge-svg" role="img" aria-label={`Speed ${Math.round(speed)} km/h`}>
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3fd6b0" />
          <stop offset="100%" stopColor="#7fd8ff" />
        </linearGradient>
      </defs>
      <path d={arcPath(86, GAUGE_START, GAUGE_END)} className="gauge-track" />
      {minorTicks.map((v) => {
        const a = angleFor(v);
        const o = pointAt(78, a), i = pointAt(73, a);
        return <line key={`m${v}`} x1={o.x} y1={o.y} x2={i.x} y2={i.y} className="tick-minor" />;
      })}
      {majorTicks.map((v) => {
        const a = angleFor(v);
        const o = pointAt(80, a), i = pointAt(66, a), l = pointAt(52, a);
        return (
          <g key={`M${v}`}>
            <line x1={o.x} y1={o.y} x2={i.x} y2={i.y} className="tick-major" />
            <text x={l.x} y={l.y} className="tick-label" textAnchor="middle" dominantBaseline="middle">{v}</text>
          </g>
        );
      })}
      <path d={arcPath(86, GAUGE_START, valueAngle)} className="gauge-fill" />
      <circle cx={needleTip.x} cy={needleTip.y} r="4.5" className="gauge-dot" />
    </svg>
  );
}

// --- trend chart ------------------------------------------------------
const HISTORY_LEN = 30;
const CHART_W = 300, CHART_H = 92;

function seriesPath(values, maxVal) {
  const stepX = CHART_W / (HISTORY_LEN - 1);
  return values
    .map((v, i) => {
      const x = i * stepX;
      const y = CHART_H - (clamp(v, 0, maxVal) / maxVal) * CHART_H;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function TrendChart({ history }) {
  const speeds = history.map((h) => h.speed);
  const powers = history.map((h) => h.power);
  const speedPath = seriesPath(speeds, MAX_SPEED);
  const powerPath = seriesPath(powers, 30);
  const areaPath = `${speedPath} L ${CHART_W} ${CHART_H} L 0 ${CHART_H} Z`;

  return (
    <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="chart-svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4fe0b8" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#4fe0b8" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={CHART_W} y1={CHART_H * f} y2={CHART_H * f} className="chart-gridline" />
      ))}
      <path d={areaPath} fill="url(#areaGrad)" stroke="none" />
      <path d={speedPath} className="chart-line chart-line-speed" />
      <path d={powerPath} className="chart-line chart-line-power" />
    </svg>
  );
}

const DRIVE_MODES = ["Eco", "Normal", "Sport"];

// --- main component ---------------------------------------------------
export default function App() {
  const [s, setS] = useState({
    soc: 85, range: 250, energy: 16.4,
    voltage: 379, current: 28,
    throttle: 19, brake: 3,
    speed: 54, rpm: 2678, torque: 38,
    motorTemp: 83.4,
    m1: 38.3, m2: 37.1, m3: 63.0, m4: 74.0,
    tripDistance: 0, tripSeconds: 0,
    aux12v: 12.6,
    tireFL: 33, tireFR: 33.2, tireRL: 32.6, tireRR: 33.4,
    soh: 97.2, cellDelta: 18,
    history: Array.from({ length: HISTORY_LEN }, () => ({ speed: 54, power: 10.6 })),
  });
  const [driveMode, setDriveMode] = useState("Normal");
  const [log, setLog] = useState([{ time: nowStr(), text: "Session started", level: "ok" }]);
  const prevStatusRef = useRef({ motor: "Warm", m1: "Normal", m2: "Normal", m3: "Warm", m4: "Critical" });

  useEffect(() => {
    const TICK = 1.4; // seconds per sample
    const id = setInterval(() => {
      setS((p) => {
        const throttle = clamp(p.throttle + jitter(16), 0, 100);
        const brakeRaw = clamp(p.brake + jitter(10) - (throttle > 15 ? 4 : -1), 0, 100);
        const brake = throttle > 40 ? brakeRaw * 0.3 : brakeRaw;
        const accel = (throttle / 100) * 3.2 - (brake / 100) * 5 - 0.25;
        const speed = clamp(p.speed + accel + jitter(1.2), 0, 118);
        const rpm = clamp(speed * 44 + throttle * 4 + jitter(80), 0, 9200);
        const torque = clamp(8 + throttle * 0.55 + jitter(4), 0, 120);
        const current = clamp(8 + throttle * 0.5 + jitter(3), 3, 62);
        const voltage = clamp(p.voltage + jitter(1.5), 368, 400);
        const soc = clamp(p.soc - current / 9000, 5, 100);
        const range = Math.round(soc * 2.94);
        const energy = +((soc / 85) * 16.4).toFixed(1);
        const motorTemp = clamp(p.motorTemp + (throttle / 100) * 0.35 - 0.18 + jitter(0.4), 22, 98);
        const m1 = clamp(p.m1 + jitter(0.6), 25, 55);
        const m2 = clamp(p.m2 + jitter(0.6), 25, 55);
        const m3 = clamp(p.m3 + jitter(1.2), 45, 78);
        const m4 = clamp(p.m4 + jitter(1.4), 55, 92);
        const tripDistance = p.tripDistance + (speed * TICK) / 3600;
        const tripSeconds = p.tripSeconds + (speed > 0.5 ? TICK : 0);
        const power = (voltage * current) / 1000;
        const history = [...p.history.slice(1), { speed, power }];
        const aux12v = clamp(p.aux12v + jitter(0.06), 12.1, 13.0);
        const tireFL = clamp(p.tireFL + jitter(0.15), 29, 37);
        const tireFR = clamp(p.tireFR + jitter(0.15), 29, 37);
        const tireRL = clamp(p.tireRL + jitter(0.15), 29, 37);
        const tireRR = clamp(p.tireRR + jitter(0.15), 29, 37);
        const soh = clamp(p.soh + jitter(0.02), 90, 99);
        const cellDelta = clamp(p.cellDelta + jitter(1.2), 5, 45);

        const newStatuses = {
          motor: statusFor(motorTemp).label,
          m1: statusFor(m1).label,
          m2: statusFor(m2).label,
          m3: statusFor(m3).label,
          m4: statusFor(m4).label,
        };
        const prev = prevStatusRef.current;
        const changed = Object.keys(newStatuses).filter((k) => newStatuses[k] !== prev[k]);
        if (changed.length) {
          prevStatusRef.current = newStatuses;
          setLog((l) => [
            ...changed.map((k) => ({
              time: nowStr(),
              text: `${LOG_NAMES[k]} \u2192 ${newStatuses[k]}`,
              level: levelFor(newStatuses[k]),
            })),
            ...l,
          ].slice(0, 8));
        }

        return {
          soc, range, energy, voltage, current, throttle, brake, speed, rpm, torque,
          motorTemp, m1, m2, m3, m4, tripDistance, tripSeconds, history,
          aux12v, tireFL, tireFR, tireRL, tireRR, soh, cellDelta,
        };
      });
    }, TICK * 1000);
    return () => clearInterval(id);
  }, []);

  const modules = [
    { id: "STM32 M-1", temp: s.m1 },
    { id: "STM32 M-2", temp: s.m2 },
    { id: "STM32 M-3", temp: s.m3 },
    { id: "STM32 M-4", temp: s.m4 },
  ];
  const anyCritical = modules.some((m) => m.temp >= 70) || s.motorTemp >= 90;
  const anyWarm = !anyCritical && (modules.some((m) => m.temp >= 50) || s.motorTemp >= 70);
  const alertText = anyCritical
    ? "Warning — temperature threshold exceeded"
    : anyWarm
    ? "Notice — elevated temperatures"
    : "Systems nominal";
  const alertClass = anyCritical ? "alert-crit" : anyWarm ? "alert-warm" : "alert-ok";

  const mode = s.speed < 1 ? "Parked" : s.brake > 25 ? "Regen braking" : "Driving";
  const modeClass = mode === "Driving" ? "mode-driving" : mode === "Regen braking" ? "mode-regen" : "mode-parked";

  const powerKw = (s.voltage * s.current) / 1000;
  const efficiency = s.speed > 3 ? (powerKw * 100) / s.speed : null;
  const driveMinutes = Math.floor(s.tripSeconds / 60);
  const driveSecs = Math.floor(s.tripSeconds % 60);
  const avgSpeed = s.tripSeconds > 0 ? s.tripDistance / (s.tripSeconds / 3600) : 0;
  const regenKw = mode === "Regen braking" ? (s.brake / 100) * 15 : 0;
  const regenSegments = Math.round((regenKw / 15) * 5);

  return (
    <div className="ev-root">
      <header className="topbar">
        <div className="brand">
          <div className="logo"><ZapIcon size={20} /></div>
          <div>
            <h1>KMUTT EV Lab</h1>
            <p>Advanced powertrain telemetry</p>
          </div>
        </div>
        <div className={`alert ${alertClass}`}>{alertText}</div>
      </header>

      <main className="grid">
        <section className="col">
          <div className="card highlight">
            <div className="row-between">
              <span className="label"><BatteryChargingIcon size={13} /> Battery SOC</span>
              <span className="big mint">{s.soc.toFixed(0)}%</span>
            </div>
            <div className="bar"><div className="bar-fill" style={{ width: `${s.soc}%` }} /></div>
            <div className="row-between sub">
              <span>Range · {s.range} km</span>
              <span>Energy · {s.energy} kWh</span>
            </div>
          </div>

          <span className="section-title">Electrical system</span>
          <div className="grid-3">
            <div className="card mini">
              <span className="label">Voltage</span>
              <div className="mono-value">{s.voltage.toFixed(0)}<small>V</small></div>
            </div>
            <div className="card mini">
              <span className="label">Current</span>
              <div className="mono-value">{s.current.toFixed(0)}<small>A</small></div>
            </div>
            <div className="card mini">
              <span className="label">Power</span>
              <div className="mono-value amber">{powerKw.toFixed(1)}<small>kW</small></div>
            </div>
          </div>

          <div className="card">
            <div className="row-between">
              <span className="label">Efficiency</span>
              <span className="mono-value" style={{ marginTop: 0 }}>
                {efficiency ? efficiency.toFixed(1) : "--"}<small>kWh/100km</small>
              </span>
            </div>
          </div>

          <span className="section-title">Driver input</span>
          <div className="card">
            <div className="input-row">
              <span className="input-label">Throttle</span>
              <div className="input-bg"><div className="input-fill mint" style={{ width: `${s.throttle}%` }} /></div>
              <span className="input-val">{s.throttle.toFixed(0)}%</span>
            </div>
            <div className="input-row">
              <span className="input-label">Brake</span>
              <div className="input-bg"><div className="input-fill coral" style={{ width: `${s.brake}%` }} /></div>
              <span className="input-val">{s.brake.toFixed(0)}%</span>
            </div>
          </div>

          <span className="section-title">Auxiliary &amp; chassis</span>
          <div className="card">
            <div className="row-between">
              <span className="label">12V aux battery</span>
              <span className="mono-value" style={{ marginTop: 0 }}>{s.aux12v.toFixed(1)}<small>V</small></span>
            </div>
          </div>
          <div className="card">
            <span className="label">Tire pressure</span>
            <div className="tire-grid">
              <div className="tire-cell"><span className="tire-pos">FL</span><span className="tire-val">{s.tireFL.toFixed(1)}</span></div>
              <div className="tire-cell"><span className="tire-pos">FR</span><span className="tire-val">{s.tireFR.toFixed(1)}</span></div>
              <div className="tire-cell"><span className="tire-pos">RL</span><span className="tire-val">{s.tireRL.toFixed(1)}</span></div>
              <div className="tire-cell"><span className="tire-pos">RR</span><span className="tire-val">{s.tireRR.toFixed(1)}</span></div>
            </div>
          </div>

          <span className="section-title"><HeartPulseIcon size={13} /> Battery diagnostics</span>
          <div className="grid-2">
            <div className="card mini">
              <span className="label">State of health</span>
              <div className="mono-value mint">{s.soh.toFixed(1)}<small>%</small></div>
            </div>
            <div className="card mini">
              <span className="label">Cell voltage &Delta;</span>
              <div className="mono-value" style={{ color: s.cellDelta > 30 ? "var(--amber)" : "var(--ink)" }}>
                {s.cellDelta.toFixed(0)}<small>mV</small>
              </div>
            </div>
          </div>
        </section>

        <section className="col center-col">
          <span className={`mode-pill ${modeClass}`}>{mode}</span>
          <div className="gauge-wrap">
            <SpeedGauge speed={s.speed} />
            <div className="gauge-center">
              <div className="speed-number">{s.speed.toFixed(0)}</div>
              <div className="speed-unit">KM / H</div>
            </div>
          </div>
          <div className="dynamics">
            <div className="dyn-box">
              <span className="label">RPM</span>
              <div className="mono-value violet">{s.rpm.toFixed(0)}</div>
            </div>
            <div className="divider" />
            <div className="dyn-box">
              <span className="label">Torque</span>
              <div className="mono-value amber">{s.torque.toFixed(0)}<small>Nm</small></div>
            </div>
          </div>

          <div className="card chart-card">
            <div className="row-between">
              <span className="section-title"><ActivityIcon size={13} /> Speed &amp; power trend</span>
              <div className="chart-legend">
                <span className="legend-dot mint" /> Speed
                <span className="legend-dot amber" /> Power
              </div>
            </div>
            <TrendChart history={s.history} />
          </div>

          <div className="card drive-card">
            <div className="row-between">
              <span className="label"><GaugeCircleIcon size={13} /> Drive mode</span>
              <span className="label"><CircleGaugeIcon size={13} /> Regen {regenKw.toFixed(1)} kW</span>
            </div>
            <div className="drive-modes">
              {DRIVE_MODES.map((m) => (
                <button
                  key={m}
                  className={`mode-btn ${driveMode === m ? "active" : ""}`}
                  onClick={() => setDriveMode(m)}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="regen-track">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`regen-seg ${i < regenSegments ? "on" : ""}`} />
              ))}
            </div>
          </div>
        </section>

        <section className="col">
          <span className="section-title"><ThermometerIcon size={13} /> Thermal management</span>
          <div className="card highlight">
            <div className="row-between">
              <span className="label">Motor core</span>
              <span className="big" style={{ color: statusFor(s.motorTemp).color }}>{s.motorTemp.toFixed(1)}°</span>
            </div>
            <div className="bar">
              <div className="bar-fill" style={{ width: `${clamp(s.motorTemp, 0, 100)}%`, background: statusFor(s.motorTemp).color }} />
            </div>
          </div>
          <div className="stm-grid">
            {modules.map((m) => {
              const st = statusFor(m.temp);
              return (
                <div className="card stm" key={m.id} style={{ borderColor: `${st.color}33` }}>
                  <div className="row-between">
                    <span className="mod-name">{m.id}</span>
                    <span className="pill" style={{ color: st.color, borderColor: `${st.color}55`, background: `${st.color}14` }}>{st.label}</span>
                  </div>
                  <div className="mod-temp" style={{ color: st.color }}>{m.temp.toFixed(1)}°</div>
                  <div className="bar thin"><div className="bar-fill" style={{ width: `${clamp(m.temp, 0, 100)}%`, background: st.color }} /></div>
                </div>
              );
            })}
          </div>

          <span className="section-title"><RouteIcon size={13} /> Trip</span>
          <div className="card">
            <div className="grid-3 trip-grid">
              <div>
                <span className="label">Distance</span>
                <div className="mono-value">{s.tripDistance.toFixed(1)}<small>km</small></div>
              </div>
              <div>
                <span className="label">Drive time</span>
                <div className="mono-value">{driveMinutes}:{driveSecs.toString().padStart(2, "0")}</div>
              </div>
              <div>
                <span className="label">Avg speed</span>
                <div className="mono-value">{avgSpeed.toFixed(0)}<small>km/h</small></div>
              </div>
            </div>
          </div>

          <span className="section-title"><ListIcon size={13} /> System log</span>
          <div className="card log-card">
            <div className="log-list">
              {log.map((entry, idx) => (
                <div className="log-item" key={idx}>
                  <span className={`log-dot log-${entry.level}`} />
                  <span className="log-time">{entry.time}</span>
                  <span className="log-text">{entry.text}</span>
                </div>
              ))}
            </div>
          </div>

          <span className="section-title"><CircleGaugeIcon size={13} /> Powertrain systems</span>
          <div className="card">
            <div className="sys-grid">
              <div className="sys-row"><span>BMS</span><span className="sys-ok">Normal</span></div>
              <div className="sys-row"><span>Inverter</span><span className="sys-ok">Normal</span></div>
              <div className="sys-row"><span>Onboard charger</span><span className="sys-ok">Standby</span></div>
              <div className="sys-row"><span>DC-DC converter</span><span className="sys-ok">Normal</span></div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}