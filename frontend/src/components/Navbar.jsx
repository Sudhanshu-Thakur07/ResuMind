import React from 'react';
import { Cpu, Database, Activity, ExternalLink, Sparkles } from 'lucide-react';

export const Navbar = ({ apiOnline, chunkCount = 1220 }) => {
  return (
    <header className="navbar">
      <div className="brand-section">
        <div className="brand-icon-wrap">
          <Cpu size={22} color="#818cf8" />
        </div>
        <div>
          <div className="brand-title">
            ResuMind
            <span className="brand-tag">AI Resume Analyzer</span>
          </div>
        </div>
      </div>

      <div className="nav-telemetry">
        <div className="telemetry-pill">
          <span className={`status-pulse ${apiOnline ? 'online' : 'offline'}`} />
          <span>{apiOnline ? 'System Online' : 'Connecting to API...'}</span>
        </div>

        <div className="telemetry-pill telemetry-item-secondary">
          <Database size={13} color="#06b6d4" />
          <span>Job Benchmarks Ready</span>
        </div>

        <div className="telemetry-pill telemetry-item-secondary">
          <Sparkles size={13} color="#ec4899" />
          <span>AI Powered</span>
        </div>
      </div>

      {/* API Docs button removed */}
    </header>
  );
};
