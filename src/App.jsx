import { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [speed, setSpeed] = useState(52);
  const [rpm, setRpm] = useState(2324);
  const [torque, setTorque] = useState(11);
  const [battery, setBattery] = useState(85);
  const [range, setRange] = useState(250);
  const [energy, setEnergy] = useState(16.4);
  const [voltage, setVoltage] = useState(380);
  const [current, setCurrent] = useState(13);
  const [power, setPower] = useState(5.0);
  const [throttle, setThrottle] = useState(9);
  const [brake, setBrake] = useState(16);
  const [auxVolt, setAuxVolt] = useState(12.6);
  const [tirePressure, setTirePressure] = useState([32.8, 33.1, 32.5, 33.4]);
  
  const [motorTemp, setMotorTemp] = useState(82.5);
  const [moduleTemps, setModuleTemps] = useState([37.4, 37.4, 63.6, 74.5]);
  const [driveMode, setDriveMode] = useState('Normal');
  const [logs, setLogs] = useState([
    { time: '12:28:18', text: 'Motor core <critical>', type: 'crit' },
    { time: '12:28:14', text: 'Session started', type: 'ok' }
  ]);

  // จำลองข้อมูลขยับแบบ Real-time
  useEffect(() => {
    const interval = setInterval(() => {
      const newSpeed = Math.floor(Math.random() * (60 - 45) + 45);
      const newMotorTemp = Number((80 + Math.random() * 5).toFixed(1));
      const newM4 = Number((72 + Math.random() * 4).toFixed(1));

      setSpeed(newSpeed);
      setRpm(Math.floor(newSpeed * 45));
      setTorque(Math.floor(newSpeed * 0.2));
      setMotorTemp(newMotorTemp);
      
      setModuleTemps([
        Number((37 + Math.random() * 1).toFixed(1)),
        Number((37 + Math.random() * 1).toFixed(1)),
        Number((63 + Math.random() * 2).toFixed(1)),
        newM4
      ]);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // เช็คสถานะความร้อนรวมเพื่อเปลี่ยนสี Alert บน Header
  const getMaxTemp = Math.max(motorTemp, ...moduleTemps);
  const alertClass = getMaxTemp > 75 ? 'alert-crit' : getMaxTemp > 65 ? 'alert-warm' : 'alert-ok';
  const alertText = getMaxTemp > 75 ? 'Warning: temperature threshold exceeded' : 'System nominal - All telemetry stable';

  return (
    <div className="ev-root">
      
      {/* --- Topbar --- */}
      <header className="topbar">
        <div className="brand">
          <div className="logo">⚡</div>
          <div>
            <h1>KMUTT EV Lab</h1>
            <p>Advanced Powertrain Telemetry</p>
          </div>
        </div>
        <div className={`alert ${alertClass}`}>
          {alertText}
        </div>
      </header>

      {/* --- Main Grid Layout --- */}
      <div className="grid">
        
        {/* --- Column 1 (Left) --- */}
        <div className="col">
          <div className="section-title">Power & Energy</div>
          
          <div className="card highlight">
            <div className="row-between">
              <span className="label">Battery SOC</span>
              <span className="big mint">{battery}%</span>
            </div>
            <div className="bar">
              <div className="bar-fill" style={{ width: `${battery}%` }}></div>
            </div>
            <div className="row-between sub">
              <span>Range: {range} km</span>
              <span>Energy: {energy} kW/h</span>
            </div>
          </div>

          <div className="section-title" style={{ marginTop: '6px' }}>Electrical System</div>
          <div className="card">
            <div className="grid-3">
              <div>
                <span className="label">Voltage</span>
                <div className="mono-value">{voltage}<small>V</small></div>
              </div>
              <div>
                <span className="label">Current</span>
                <div className="mono-value">{current}<small>A</small></div>
              </div>
              <div>
                <span className="label">Power</span>
                <div className="mono-value">{power}<small>kW</small></div>
              </div>
            </div>
            <div className="row-between sub" style={{ marginTop: '14px', borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
              <span className="label">Efficiency</span>
              <span className="mono-value" style={{ fontSize: '0.9rem', margin: 0 }}>9.6 <small>kWh/100km</small></span>
            </div>
          </div>

          <div className="section-title" style={{ marginTop: '6px' }}>Driver Input</div>
          <div className="card">
            <div className="input-row">
              <span className="input-label">Throttle</span>
              <div className="input-bg"><div className="input-fill mint" style={{ width: `${throttle}%` }}></div></div>
              <span className="input-val">{throttle}%</span>
            </div>
            <div className="input-row">
              <span className="input-label">Brake</span>
              <div className="input-bg"><div className="input-fill coral" style={{ width: `${brake}%` }}></div></div>
              <span className="input-val">{brake}%</span>
            </div>
          </div>

          <div className="section-title" style={{ marginTop: '6px' }}>Auxiliary & Chassis</div>
          <div className="card">
            <div className="row-between" style={{ marginBottom: '12px' }}>
              <span className="label">12V AUX Battery</span>
              <span className="mono-value" style={{ fontSize: '1.1rem', margin: 0 }}>{auxVolt}v</span>
            </div>
            <span className="label" style={{ marginBottom: '6px' }}>Tire Pressure</span>
            <div className="tire-grid">
              {['FL', 'FR', 'RL', 'RR'].map((pos, idx) => (
                <div className="tire-cell" key={pos}>
                  <span className="tire-pos">{pos}</span>
                  <span className="tire-val">{tirePressure[idx]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- Column 2 (Center) --- */}
        <div className="col center-col">
          <div className={`mode-pill ${speed > 0 ? 'mode-driving' : 'mode-parked'}`}>
            {speed > 0 ? 'Driving' : 'Parked'}
          </div>

          {/* Speed Gauge HUD */}
          <div className="gauge-wrap">
            <svg className="gauge-svg" viewBox="0 0 200 200">
              <defs>
                <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--mint)" />
                  <stop offset="100%" stopColor="#2fb894" />
                </linearGradient>
              </defs>
              <circle className="gauge-track" cx="100" cy="100" r="82" />
              <circle 
                className="gauge-fill" 
                cx="100" cy="100" r="82" 
                strokeDasharray="515" 
                strokeDashoffset={515 - (515 * (speed / 160))} 
                transform="rotate(-90 100 100)"
              />
            </svg>
            <div className="gauge-center">
              <div className="speed-number">{speed}</div>
              <div className="speed-unit">KM / H</div>
            </div>
          </div>

          <div className="dynamics">
            <div className="dyn-box">
              <span className="label">RPM</span>
              <div className="mono-value violet" style={{ fontSize: '1.3rem', margin: 0 }}>{rpm}</div>
            </div>
            <div className="divider"></div>
            <div className="dyn-box">
              <span className="label">Torque</span>
              <div className="mono-value amber" style={{ fontSize: '1.3rem', margin: 0 }}>{torque} <small style={{fontSize:'0.6em'}}>Nm</small></div>
            </div>
          </div>

          {/* Speed & Power Trend Chart */}
          <div className="card chart-card">
            <div className="row-between">
              <span className="section-title" style={{ margin: 0 }}>Speed & Power Trend</span>
              <div className="chart-legend">
                <span className="legend-dot mint"></span> Speed
                <span className="legend-dot amber"></span> Power
              </div>
            </div>
            <svg className="chart-svg" viewBox="0 0 300 90" preserveAspectRatio="none">
              <line className="chart-gridline" x1="0" y1="22" x2="300" y2="22" />
              <line className="chart-gridline" x1="0" y1="45" x2="300" y2="45" />
              <line className="chart-gridline" x1="0" y1="68" x2="300" y2="68" />
              <path className="chart-line chart-line-speed" d="M 0 65 Q 75 40, 150 50 T 300 30" />
              <path className="chart-line chart-line-power" d="M 0 75 Q 75 60, 150 70 T 300 65" />
            </svg>
          </div>

          {/* Drive Mode Selector */}
          <div className="card drive-card">
            <span className="section-title">Drive Mode</span>
            <div className="drive-modes">
              {['Eco', 'Normal', 'Sport'].map((mode) => (
                <button 
                  key={mode} 
                  className={`mode-btn ${driveMode === mode ? 'active' : ''}`}
                  onClick={() => setDriveMode(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>
            <div className="row-between sub" style={{ marginTop: '12px' }}>
              <span>Regen Braking</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--violet)' }}>1.2 kW</span>
            </div>
            <div className="regen-track">
              <div className="regen-seg on"></div>
              <div className="regen-seg on"></div>
              <div className="regen-seg"></div>
              <div className="regen-seg"></div>
            </div>
          </div>
        </div>

        {/* --- Column 3 (Right) --- */}
        <div className="col">
          <div className="section-title">Thermal Management</div>
          
          <div className="card">
            <div className="row-between" style={{ marginBottom: '8px' }}>
              <span className="label">Motor Core</span>
              <span className="mono-value" style={{ color: motorTemp > 80 ? 'var(--coral)' : 'var(--amber)', margin: 0, fontSize: '1.4rem' }}>
                {motorTemp}°<small style={{fontSize:'0.6em'}}>C</small>
              </span>
            </div>
            <div className="bar thin">
              <div className="bar-fill" style={{ width: `${(motorTemp/120)*100}%`, background: motorTemp > 80 ? 'var(--coral)' : 'var(--amber)' }}></div>
            </div>
          </div>

          {/* STM32 Modules Temperature 4 Channels */}
          <div className="stm-grid">
            {moduleTemps.map((temp, index) => {
              const isCrit = temp > 70;
              const isWarm = temp > 60 && !isCrit;
              const pillClass = isCrit ? 'alert-crit' : isWarm ? 'alert-warm' : 'alert-ok';
              const pillText = isCrit ? 'Critical' : isWarm ? 'Warm' : 'Normal';
              
              return (
                <div className="card stm" key={index}>
                  <div className="row-between">
                    <span className="mod-name">STM32 M-{index + 1}</span>
                    <span className={`pill ${pillClass}`}>{pillText}</span>
                  </div>
                  <div className="mod-temp" style={{ color: isCrit ? 'var(--coral)' : isWarm ? 'var(--amber)' : 'var(--mint)' }}>
                    {temp}°<small style={{fontSize:'0.5em', color:'var(--dim)'}}>C</small>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="section-title" style={{ marginTop: '6px' }}>Trip & Session</div>
          <div className="card trip-grid">
            <div className="grid-3" style={{ textAlign: 'center' }}>
              <div>
                <span className="label" style={{justifyContent:'center'}}>Distance</span>
                <div className="mono-value" style={{ fontSize: '1.1rem', margin: '4px 0 0' }}>0.1<small>km</small></div>
              </div>
              <div>
                <span className="label" style={{justifyContent:'center'}}>Drive Time</span>
                <div className="mono-value" style={{ fontSize: '1.1rem', margin: '4px 0 0' }}>0:07</div>
              </div>
              <div>
                <span className="label" style={{justifyContent:'center'}}>Avg Speed</span>
                <div className="mono-value" style={{ fontSize: '1.1rem', margin: '4px 0 0' }}>53<small>km/h</small></div>
              </div>
            </div>
          </div>

          <div className="section-title" style={{ marginTop: '6px' }}>System Log</div>
          <div className="card log-card">
            <div className="log-list">
              {logs.map((log, idx) => (
                <div className="log-item" key={idx}>
                  <span className={`log-dot log-${log.type}`}></span>
                  <span className="log-time">{log.time}</span>
                  <span className="log-text">{log.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="section-title" style={{ marginTop: '6px' }}>Powertrain Systems</div>
          <div className="card">
            <div className="sys-grid">
              <div className="sys-row"><span>BMS</span><span className="sys-ok">Normal</span></div>
              <div className="sys-row"><span>Inverter</span><span className="sys-ok">Normal</span></div>
              <div className="sys-row"><span>Onboard charger</span><span style={{ color: 'var(--amber)' }}>Standby</span></div>
              <div className="sys-row"><span>DC-DC converter</span><span className="sys-ok">Normal</span></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}