import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Play, 
  HelpCircle, 
  ArrowRight, 
  Activity, 
  Cpu, 
  ShieldCheck, 
  Terminal,
  RefreshCw
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { ResumeDropzone } from './components/ResumeDropzone';
import { TargetSelector } from './components/TargetSelector';
import { AnalysisPipelineModal } from './components/AnalysisPipelineModal';
import { ResultsDeck } from './components/ResultsDeck';
import { ToastContainer } from './components/ToastContainer';

const API_BASE = typeof window !== 'undefined' && window.location.origin.includes(':8000') 
  ? window.location.origin 
  : 'http://localhost:8000';

export function App() {
  const [apiOnline, setApiOnline] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [targetMode, setTargetMode] = useState('role'); // 'role' | 'jd'
  const [selectedRole, setSelectedRole] = useState('ai engineer');
  const [customJdData, setCustomJdData] = useState(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [toasts, setToasts] = useState([]);

  const resultsRef = useRef(null);

  const handleTargetModeChange = (newMode) => {
    if (newMode !== targetMode) {
      setTargetMode(newMode);
      setAnalysisData(null); // Clear previous analysed info when switching mode
    }
  };

  // Toast Helper
  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check API status
  const checkStatus = async () => {
    try {
      const resp = await fetch(`${API_BASE}/`);
      if (resp.ok) {
        setApiOnline(true);
      } else {
        setApiOnline(false);
      }
    } catch (e) {
      setApiOnline(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  // Upload PDF
  const handleFileUpload = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      addToast('Only PDF resume files are accepted', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const resp = await fetch(`${API_BASE}/upload-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Resume PDF upload failed. Please verify the file.');
      }

      setUploadedFile(file);
      setAnalysisData(null);
      addToast(`Resume "${file.name}" uploaded successfully!`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to upload PDF', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Remove File
  const handleFileRemove = () => {
    setUploadedFile(null);
    setAnalysisData(null);
    addToast('Resume removed. Please upload a new PDF.', 'info');
  };

  // Select Predefined Role
  const handleRoleSelect = async (roleId) => {
    setSelectedRole(roleId);
    setAnalysisData(null);
    try {
      const resp = await fetch(`${API_BASE}/role-select?role=${encodeURIComponent(roleId)}`, {
        method: 'POST',
      });
      if (!resp.ok) throw new Error('Failed to set target role on server');
      addToast(`Target role selected: ${roleId.toUpperCase()}`, 'info');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Submit Custom JD
  const handleCustomJdSubmit = async (payload) => {
    try {
      const resp = await fetch(`${API_BASE}/upload-jd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || 'Custom JD submission failed');
      }

      setCustomJdData(payload);
      setSelectedRole(null);
      setAnalysisData(null);
      addToast(`Job description for "${payload.role}" saved successfully!`, 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Run Resume Analysis
  const handleRunAnalysis = async () => {
    if (!uploadedFile) {
      addToast('Please upload a resume PDF first', 'error');
      return;
    }

    if (targetMode === 'role' && !selectedRole) {
      addToast('Please select a target role first', 'error');
      return;
    }

    if (targetMode === 'jd' && !customJdData) {
      addToast('Please fill and save your job description first', 'error');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisData(null);

    try {
      const resp = await fetch(`${API_BASE}/analyze`);
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || 'Analysis execution failed');
      }

      const data = await resp.json();
      setAnalysisData(data);
      addToast('Resume analysis completed!', 'success');

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (err) {
      addToast(err.message || 'Analysis failed', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // One-click switch to recommended role & re-run analysis
  const handleSwitchRoleAndAnalyze = async (newRole) => {
    setTargetMode('role');
    await handleRoleSelect(newRole.toLowerCase());
    handleRunAnalysis();
  };

  const isReadyToAnalyze = 
    uploadedFile && 
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
        {/* Navigation Bar */}
        <Navbar apiOnline={apiOnline} />

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-pill-badge">
            <Sparkles size={14} color="#a5b4fc" />
            <span>AI Resume & Career Fit Analyzer</span>
          </div>

          <h1 className="hero-title">
            See How Well You Fit the Job.{' '}
            <span className="gradient-text">Real Skills, Honest Feedback.</span>
          </h1>

          <p className="hero-subtitle">
            ResuMind checks your resume against actual job requirements to give you a clear match score, 
            highlight missing skills, and build a personalized step-by-step learning roadmap.
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
              <span>Results & Roadmap</span>
            </div>
          </div>
        </section>

        {/* Main Workspace Dual-Station */}
        <section className="workspace-grid">
          {/* Station 1: Resume PDF Dropzone */}
          <ResumeDropzone 
            uploadedFile={uploadedFile}
            isUploading={isUploading}
            onFileUpload={handleFileUpload}
            onFileRemove={handleFileRemove}
          />

          {/* Station 2: Target Calibration */}
          <TargetSelector 
            targetMode={targetMode}
            setTargetMode={handleTargetModeChange}
            selectedRole={selectedRole}
            onRoleSelect={handleRoleSelect}
            onCustomJdSubmit={handleCustomJdSubmit}
            customJdData={customJdData}
          />
        </section>

        {/* Execute CTA Bar */}
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
                <span>Analyzing Resume & Job Fit...</span>
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
                <span>Resume and target role ready. Click analyze to see your results!</span>
              </>
            ) : (
              <>
                <HelpCircle size={14} />
                <span>
                  {!uploadedFile 
                    ? 'Upload your resume PDF to begin' 
                    : targetMode === 'role' 
                    ? 'Select a target role to continue' 
                    : 'Fill and save your job description to proceed'}
                </span>
              </>
            )}
          </div>
        </section>

        {/* Analysis Running Pipeline Animation */}
        {isAnalyzing && <AnalysisPipelineModal />}

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

        {/* Application Footer */}
        <footer className="footer-wrap">
          <div className="footer-left">
            <span>ResuMind • AI Resume & Career Match</span>
            <span>—</span>
            <span>MIT License</span>
          </div>
          <div className="footer-right">
            <span>Skill Gap Analysis • Personalized Career Roadmaps</span>
          </div>
        </footer>
      </div>

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
}
