import React, { useState, useEffect } from 'react';
import { 
  Server, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RefreshCw, 
  X, 
  Radio, 
  Zap, 
  Terminal,
  ExternalLink
} from 'lucide-react';
import { 
  normalizeApiUrl, 
  formatPortDisplay, 
  checkApiHealth, 
  autoDetectBackend, 
  CANDIDATE_PORTS,
  saveApiBasePreference 
} from '../services/apiConfig';

export const BackendSettingsModal = ({
  isOpen,
  onClose,
  currentApiBase,
  apiOnline,
  onApiBaseChange,
  onToast
}) => {
  const [inputVal, setInputVal] = useState(currentApiBase || 'http://localhost:8001');
  const [isTesting, setIsTesting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [testResult, setTestResult] = useState(null); // { ok: boolean, message: string }

  useEffect(() => {
    if (isOpen) {
      setInputVal(currentApiBase || 'http://localhost:8001');
      setTestResult(null);
    }
  }, [isOpen, currentApiBase]);

  if (!isOpen) return null;

  // Handle testing custom port/URL
  const handleTestConnection = async (targetOverride) => {
    const target = normalizeApiUrl(targetOverride || inputVal);
    setIsTesting(true);
    setTestResult(null);

    const res = await checkApiHealth(target, 2000);
    setIsTesting(false);

    if (res.ok) {
      setTestResult({
        ok: true,
        message: `Successfully connected! (${res.data?.Description || 'ResuMind Backend Active'})`,
        url: target
      });
    } else {
      setTestResult({
        ok: false,
        message: `Connection failed: Could not reach backend at ${target}. Make sure your Python server is running on this port.`,
        url: target
      });
    }
    return res.ok;
  };

  // Handle Quick Select Chip click
  const handleQuickSelect = async (port) => {
    const target = `http://localhost:${port}`;
    setInputVal(target);
    const ok = await handleTestConnection(target);
    if (ok) {
      saveApiBasePreference(target);
      onApiBaseChange(target);
      if (onToast) onToast(`Connected to backend on port ${port}!`, 'success');
    }
  };

  // Handle Auto-Detect button
  const handleAutoDetect = async () => {
    setIsScanning(true);
    setTestResult(null);

    const detected = await autoDetectBackend();
    setIsScanning(false);

    if (detected) {
      setInputVal(detected);
      saveApiBasePreference(detected);
      onApiBaseChange(detected);
      setTestResult({
        ok: true,
        message: `Auto-detected active backend at ${detected}! Saved and connected.`,
        url: detected
      });
      if (onToast) onToast(`Auto-detected active backend at ${formatPortDisplay(detected)}!`, 'success');
    } else {
      setTestResult({
        ok: false,
        message: 'Auto-detect scanned ports (8001, 8000, 8002, 8080, 5000) but found no active backend. Please ensure uvicorn is running.',
        url: null
      });
      if (onToast) onToast('No active backend detected. Please check terminal.', 'error');
    }
  };

  // Handle Save and Apply
  const handleSaveAndApply = async () => {
    const normalized = normalizeApiUrl(inputVal);
    setIsTesting(true);
    const res = await checkApiHealth(normalized, 2500);
    setIsTesting(false);

    if (res.ok) {
      saveApiBasePreference(normalized);
      onApiBaseChange(normalized);
      if (onToast) onToast(`Backend URL updated to ${normalized}`, 'success');
      onClose();
    } else {
      setTestResult({
        ok: false,
        message: `Could not connect to ${normalized}. Please check the port number or start your server.`,
        url: normalized
      });
    }
  };

  return (
    <div className="server-modal-backdrop" onClick={onClose}>
      <div className="server-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="server-modal-header">
          <div className="server-modal-header-left">
            <div className="server-modal-icon-badge">
              <Server size={20} color="#818cf8" />
            </div>
            <div>
              <h3 className="server-modal-title">Backend Server & Port Settings</h3>
              <p className="server-modal-subtitle">
                Configure which port your FastAPI backend is running on
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="server-modal-close-btn" 
            onClick={onClose}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Status Pill */}
        <div className={`server-status-banner ${apiOnline ? 'status-online' : 'status-offline'}`}>
          <div className="server-status-banner-left">
            <span className={`status-pulse ${apiOnline ? 'online' : 'offline'}`} />
            <div>
              <div className="server-status-state">
                {apiOnline ? 'Backend Online & Connected' : 'Backend Disconnected / Unreachable'}
              </div>
              <div className="server-status-url">
                Active target: <code>{currentApiBase}</code>
              </div>
            </div>
          </div>
          <button 
            type="button" 
            className="server-scan-btn"
            onClick={handleAutoDetect}
            disabled={isScanning || isTesting}
            title="Automatically scan candidate ports"
          >
            {isScanning ? (
              <>
                <Loader2 size={14} className="spin-animation" />
                <span>Scanning Ports...</span>
              </>
            ) : (
              <>
                <Radio size={14} />
                <span>Auto-Detect Port</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Select Preset Ports */}
        <div className="server-presets-section">
          <label className="server-field-label">Quick Select Common Ports:</label>
          <div className="server-presets-grid">
            {CANDIDATE_PORTS.slice(0, 5).map((port) => {
              const portUrl = `http://localhost:${port}`;
              const isCurrent = currentApiBase === portUrl || inputVal === portUrl;
              return (
                <button
                  key={port}
                  type="button"
                  className={`server-preset-chip ${isCurrent ? 'selected' : ''}`}
                  onClick={() => handleQuickSelect(port)}
                  disabled={isTesting || isScanning}
                >
                  <span className="preset-port-num">{port}</span>
                  {port === 8001 && <span className="preset-tag">Active</span>}
                  {port === 8000 && <span className="preset-tag">Default</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Port / URL Input */}
        <div className="server-input-section">
          <label className="server-field-label" htmlFor="server-port-input">
            Enter Backend Port or Full URL:
          </label>
          <div className="server-input-row">
            <input
              id="server-port-input"
              type="text"
              className="server-port-input"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="e.g. 8001 or http://localhost:8001"
              disabled={isTesting || isScanning}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveAndApply();
              }}
            />
            <button
              type="button"
              className="server-test-btn"
              onClick={() => handleTestConnection()}
              disabled={isTesting || isScanning}
            >
              {isTesting ? (
                <>
                  <Loader2 size={14} className="spin-animation" />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
                  <span>Test Connection</span>
                </>
              )}
            </button>
          </div>
          <span className="server-input-hint">
            You can enter just a port number (like <code>8001</code>) or a full host address (like <code>http://127.0.0.1:8001</code>).
          </span>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div className={`server-test-feedback ${testResult.ok ? 'feedback-success' : 'feedback-error'}`}>
            {testResult.ok ? (
              <CheckCircle2 size={16} color="#10b981" />
            ) : (
              <XCircle size={16} color="#f43f5e" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Helpful Tip */}
        <div className="server-terminal-tip">
          <Terminal size={14} color="#a5b4fc" />
          <div className="terminal-tip-content">
            <strong>Terminal Command:</strong>
            <code>python -m uvicorn main:app --reload --port {inputVal.match(/:(\d+)/)?.[1] || '8001'}</code>
          </div>
        </div>

        {/* Actions */}
        <div className="server-modal-actions">
          <button 
            type="button" 
            className="server-btn-cancel" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="server-btn-save"
            onClick={handleSaveAndApply}
            disabled={isTesting || isScanning}
          >
            <Zap size={15} />
            <span>Save & Connect</span>
          </button>
        </div>
      </div>
    </div>
  );
};
