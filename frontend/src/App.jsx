import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Sparkles, 
  Play, 
  HelpCircle, 
  ShieldCheck, 
  RefreshCw
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { ResumeDropzone } from './components/ResumeDropzone';
import { TargetSelector } from './components/TargetSelector';
import { AnalysisPipelineModal } from './components/AnalysisPipelineModal';
import { ResultsDeck } from './components/ResultsDeck';
import { ToastContainer } from './components/ToastContainer';

// All API calls use relative URLs ('').
// In Vite dev server (port 5173), Vite's proxy forwards requests to the active FastAPI backend (port 8001 or 8000).
// In production (served from FastAPI), requests are naturally same-origin.
const API_BASE = '';

// Max retries for transient 500 errors from the LLM (Groq JSON validation hiccups)
const ANALYZE_MAX_RETRIES = 2;

export function App() {
  const [apiOnline, setApiOnline] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null); // null | 'scanned' | 'generic'

  const [targetMode, setTargetMode] = useState('role'); // 'role' | 'jd'
  const [selectedRole, setSelectedRole] = useState('ai engineer');
  const [customJdData, setCustomJdData] = useState(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [analyzeAttempt, setAnalyzeAttempt] = useState(0);

  const resultsRef = useRef(null);

  // ─── Mode switch ────────────────────────────────────────────────────────────
  const handleTargetModeChange = (newMode) => {
    if (newMode !== targetMode) {
      setTargetMode(newMode);
      setAnalysisData(null);
    }
  };

  // ─── Toast helper ────────────────────────────────────────────────────────────
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // ─── API health check ────────────────────────────────────────────────────────
  const checkStatus = useCallback(async () => {
    for (const url of [`${API_BASE}/api-health`, `${API_BASE}/`]) {
      try {
        const resp = await fetch(url, { signal: AbortSignal.timeout(3500) });
        if (resp.ok) {
          const ct = resp.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            setApiOnline(true);
            return;
          }
        }
      } catch (_) {}
    }
    setApiOnline(false);
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  // ─── Shared: send PDF to backend, return true on success ────────────────────
  const sendPdfToBackend = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const resp = await fetch(`${API_BASE}/upload-pdf`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(30000),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      const msg = errorData.detail || 'Resume upload failed.';
      throw new Error(msg);
    }
    return true;
  };

  // ─── Upload PDF (triggered by dropzone) ─────────────────────────────────────
  const handleFileUpload = async (file) => {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      addToast('Only PDF resume files are accepted.', 'error');
      return;
    }

    if (file.size < 64) {
      addToast('The selected file is empty. Please upload a valid resume PDF.', 'error');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      await sendPdfToBackend(file);
      setUploadedFile(file);
      setAnalysisData(null);
      addToast(`"${file.name}" uploaded successfully!`, 'success');
    } catch (err) {
      const msg = err.message || '';
      if (
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError') ||
        msg.includes('Cannot connect')
      ) {
        setUploadError('generic');
        addToast(
          'Backend connection failed. Please ensure your backend is running (uvicorn main:app --reload --port 8001 or 8000).',
          'error'
        );
      } else if (
        msg.toLowerCase().includes('usable content') ||
        msg.toLowerCase().includes('does not appear to be') ||
        msg.toLowerCase().includes('empty')
      ) {
        setUploadError('scanned');
        addToast(
          'Your PDF has no readable text — it may be a scanned/image PDF. Please use a text-based PDF resume.',
          'error'
        );
      } else {
        setUploadError('generic');
        addToast(err.message || 'Failed to upload PDF. Please try again.', 'error');
      }
    } finally {
      setIsUploading(false);
    }
  };

  // ─── Remove uploaded file ────────────────────────────────────────────────────
  const handleFileRemove = () => {
    setUploadedFile(null);
    setAnalysisData(null);
    setUploadError(null);
    addToast('Resume removed. Upload a new PDF to continue.', 'info');
  };

  // ─── Select predefined role ──────────────────────────────────────────────────
  const handleRoleSelect = async (roleId) => {
    setSelectedRole(roleId);
    setAnalysisData(null);
    try {
      const resp = await fetch(
        `${API_BASE}/role-select?role=${encodeURIComponent(roleId)}`,
        { method: 'POST', signal: AbortSignal.timeout(10000) }
      );
      if (!resp.ok) throw new Error('Failed to set target role on server.');
      addToast(`Target: ${roleId.toUpperCase()}`, 'info');
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        addToast(
          'Backend connection failed. Please ensure your backend is running (uvicorn main:app --reload --port 8001 or 8000).',
          'error'
        );
      } else {
        addToast(msg || 'Failed to select role.', 'error');
      }
    }
  };

  // ─── Submit custom JD ────────────────────────────────────────────────────────
  const handleCustomJdSubmit = async (payload) => {
    try {
      const resp = await fetch(`${API_BASE}/upload-jd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || 'Custom JD submission failed.');
      }

      setCustomJdData(payload);
      setSelectedRole(null);
      setAnalysisData(null);
      addToast(`Job description for "${payload.role}" saved!`, 'success');
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        addToast(
          'Backend connection failed. Please ensure your backend is running (uvicorn main:app --reload --port 8001 or 8000).',
          'error'
        );
      } else {
        addToast(msg || 'Failed to save job description.', 'error');
      }
    }
  };

  // ─── Core analysis with auto-retry (handles Groq 500 / JSON errors) ─────────
  const runAnalysisRequest = async (retryCount = 0) => {
    const resp = await fetch(`${API_BASE}/analyze`, {
      signal: AbortSignal.timeout(90000),
    });

    if (!resp.ok) {
      const errBody = await resp.json().catch(() => ({}));
      const detail = errBody.detail || '';

      if (
        resp.status === 500 &&
        retryCount < ANALYZE_MAX_RETRIES &&
        (detail.toLowerCase().includes('json') ||
          detail.toLowerCase().includes('groq') ||
          detail === '')
      ) {
        addToast(
          `AI response formatting retry (attempt ${retryCount + 1}/${ANALYZE_MAX_RETRIES})…`,
          'info'
        );
        setAnalyzeAttempt(retryCount + 1);
        await sendPdfToBackend(uploadedFile);
        await new Promise((r) => setTimeout(r, 800));
        return runAnalysisRequest(retryCount + 1);
      }

      throw new Error(
        detail || `Analysis failed (HTTP ${resp.status}). Please try again.`
      );
    }

    return resp.json();
  };

  // ─── Run resume analysis ─────────────────────────────────────────────────────
  const handleRunAnalysis = async () => {
    if (!uploadedFile) {
      addToast('Please upload a resume PDF first.', 'error');
      return;
    }
    if (targetMode === 'role' && !selectedRole) {
      addToast('Please select a target role first.', 'error');
      return;
    }
    if (targetMode === 'jd' && !customJdData) {
      addToast('Please fill and save your job description first.', 'error');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisData(null);
    setAnalyzeAttempt(0);

    try {
      addToast('Syncing resume to backend…', 'info');
      await sendPdfToBackend(uploadedFile);

      if (targetMode === 'role' && selectedRole) {
        await fetch(
          `${API_BASE}/role-select?role=${encodeURIComponent(selectedRole)}`,
          { method: 'POST', signal: AbortSignal.timeout(10000) }
        );
      } else if (targetMode === 'jd' && customJdData) {
        await fetch(`${API_BASE}/upload-jd`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customJdData),
          signal: AbortSignal.timeout(10000),
        });
      }

      const data = await runAnalysisRequest(0);

      let matchAns = data?.match_answer ?? {};
      if (typeof matchAns === 'string') {
        try { matchAns = JSON.parse(matchAns); } catch (_) { matchAns = {}; }
      }
      const score = matchAns?.match_percent ?? 0;
      const shortAnalysis = (matchAns?.short_analysis ?? '').toLowerCase();
      const isEmptyResume =
        score === 0 &&
        (shortAnalysis.includes('empty') ||
          shortAnalysis.includes('no evidence') ||
          shortAnalysis.includes('no content') ||
          shortAnalysis.includes('no information'));

      if (isEmptyResume) {
        addToast(
          'The analysis returned 0% — the backend could not read your PDF text. ' +
            'Please ensure your resume is a text-based PDF (not a scanned image). Re-upload and try again.',
          'error'
        );
        setIsAnalyzing(false);
        return;
      }

      setAnalysisData(data);
      addToast('Resume analysis complete!', 'success');

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        addToast(
          'Backend connection failed during analysis. Please ensure your backend is running (uvicorn main:app --reload --port 8001 or 8000).',
          'error'
        );
      } else {
        addToast(msg || 'Analysis failed. Please try again.', 'error');
      }
    } finally {
      setIsAnalyzing(false);
      setAnalyzeAttempt(0);
    }
  };

  // ─── One-click role switch + re-analyze ─────────────────────────────────────
  const handleSwitchRoleAndAnalyze = async (newRole) => {
    setTargetMode('role');
    await handleRoleSelect(newRole.toLowerCase());
    await handleRunAnalysis();
  };

  const isReadyToAnalyze =
    uploadedFile &&
    !uploadError &&
    ((targetMode === 'role' && selectedRole) || (targetMode === 'jd' && customJdData));

  return (
    <>
      {/* Ambient Visual Atmosphere */}
      <div className="bg-ambient-layer">
        <div className="bg-ambient-grid" />
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      <div className="app-container">
        <Navbar apiOnline={apiOnline} />

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-pill-badge">
            <Sparkles size={14} color="#a5b4fc" />
            <span>AI Resume &amp; Career Fit Analyzer</span>
          </div>

          <h1 className="hero-title">
            See How Well You Fit the Job.{' '}
            <span className="gradient-text">Real Skills, Honest Feedback.</span>
          </h1>

          <p className="hero-subtitle">
            ResuMind checks your resume against actual job requirements to give you a clear match score,
            highlight missing skills, and provide recruiter-grade feedback.
          </p>

          <div className="workflow-strip">
            <div className={`workflow-step ${uploadedFile ? 'completed' : 'active'}`}>
              <span className="step-num">{uploadedFile ? '✓' : '1'}</span>
              <span>Upload Resume</span>
            </div>
            <div className="workflow-divider" />
            <div className={`workflow-step ${isReadyToAnalyze ? 'completed' : uploadedFile ? 'active' : ''}`}>
              <span className="step-num">{isReadyToAnalyze ? '✓' : '2'}</span>
              <span>Target Role / Job</span>
            </div>
            <div className="workflow-divider" />
            <div className={`workflow-step ${analysisData ? 'completed' : isReadyToAnalyze ? 'active' : ''}`}>
              <span className="step-num">{analysisData ? '✓' : '3'}</span>
              <span>Analyze Match</span>
            </div>
            <div className="workflow-divider" />
            <div className={`workflow-step ${analysisData ? 'completed' : ''}`}>
              <span className="step-num">{analysisData ? '✓' : '4'}</span>
              <span>{targetMode === 'jd' ? 'Results & Feedback' : 'Results & Roadmap'}</span>
            </div>
          </div>
        </section>

        {/* Main Workspace */}
        <section className="workspace-grid">
          <ResumeDropzone
            uploadedFile={uploadedFile}
            isUploading={isUploading}
            uploadError={uploadError}
            onFileUpload={handleFileUpload}
            onFileRemove={handleFileRemove}
          />

          <TargetSelector
            targetMode={targetMode}
            setTargetMode={handleTargetModeChange}
            selectedRole={selectedRole}
            onRoleSelect={handleRoleSelect}
            onCustomJdSubmit={handleCustomJdSubmit}
            customJdData={customJdData}
          />
        </section>

        {/* Analyze CTA */}
        <section className="execute-bar-section">
          <button
            className="execute-cta-btn"
            disabled={!isReadyToAnalyze || isAnalyzing}
            onClick={handleRunAnalysis}
            type="button"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw size={18} className="upload-spinner-ring" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                <span>
                  {analyzeAttempt > 0
                    ? `Retrying Analysis (${analyzeAttempt}/${ANALYZE_MAX_RETRIES})…`
                    : 'Analyzing Resume & Job Fit…'}
                </span>
              </>
            ) : (
              <>
                <Play size={18} fill="currentColor" />
                <span>Analyze Resume Fit</span>
              </>
            )}
          </button>

          <div className={`execute-hint ${isReadyToAnalyze ? 'ready' : ''}`}>
            {isReadyToAnalyze ? (
              <>
                <ShieldCheck size={14} />
                <span>Resume and target ready — click Analyze to see your results!</span>
              </>
            ) : (
              <>
                <HelpCircle size={14} />
                <span>
                  {!uploadedFile
                    ? 'Upload your resume PDF to begin'
                    : uploadError === 'scanned'
                    ? 'Your PDF has no readable text — please upload a text-based PDF resume'
                    : uploadError
                    ? 'Upload failed — please try uploading your resume again'
                    : targetMode === 'role'
                    ? 'Select a target role to continue'
                    : 'Fill and save your job description to proceed'}
                </span>
              </>
            )}
          </div>
        </section>

        {/* Analysis Pipeline Animation */}
        {isAnalyzing && (
          <AnalysisPipelineModal
            attempt={analyzeAttempt}
            maxRetries={ANALYZE_MAX_RETRIES}
            targetMode={targetMode}
          />
        )}

        {/* Results Deck */}
        <div ref={resultsRef}>
          {analysisData && (
            <ResultsDeck
              analysisData={analysisData}
              targetMode={targetMode}
              selectedRole={selectedRole}
              onSwitchRoleAndAnalyze={handleSwitchRoleAndAnalyze}
              apiBase={API_BASE}
            />
          )}
        </div>

        {/* Footer */}
        <footer className="footer-wrap">
          <div className="footer-left">
            <span>ResuMind • AI Resume &amp; Career Match</span>
            <span>—</span>
            <span>MIT License</span>
          </div>
          <div className="footer-right">
            <span>Skill Gap Analysis • Personalized Career Roadmaps</span>
          </div>
        </footer>
      </div>

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
}
