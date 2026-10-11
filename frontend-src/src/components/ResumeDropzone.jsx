import React, { useRef, useState } from 'react';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  X, 
  FileCheck, 
  ShieldCheck, 
  RefreshCw,
  AlertCircle 
} from 'lucide-react';

export const ResumeDropzone = ({ 
  uploadedFile, 
  isUploading, 
  onFileUpload, 
  onFileRemove 
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileUpload(file);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="glass-panel">
      <div className="panel-header">
        <div className="panel-header-left">
          <div className="panel-icon-badge">
            <FileText size={18} />
          </div>
          <div>
            <h3 className="panel-title">1. Upload Resume</h3>
            <p className="panel-subtitle">Upload your resume in PDF format to get started</p>
          </div>
        </div>
        <span className="panel-badge">
          {uploadedFile ? 'UPLOADED' : 'REQUIRED'}
        </span>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileInputChange} 
        accept="application/pdf" 
        style={{ display: 'none' }} 
      />

      {isUploading ? (
        <div className="upload-loading-state">
          <div className="upload-spinner-ring" />
          <h4 style={{ fontSize: '0.92rem', color: 'var(--text-main)', fontWeight: 600 }}>
            Reading Resume...
          </h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Extracting your skills, experience, and education
          </p>
        </div>
      ) : uploadedFile ? (
        <div>
          <div className="uploaded-file-card">
            <div className="file-card-left">
              <div className="file-type-icon">
                <FileCheck size={22} />
              </div>
              <div className="file-card-info">
                <h4 title={uploadedFile.name}>{uploadedFile.name}</h4>
                <p>{formatFileSize(uploadedFile.size)} • PDF Document</p>
              </div>
            </div>
            <button 
              className="file-remove-btn" 
              onClick={onFileRemove}
              title="Remove and select another resume"
            >
              <X size={18} />
            </button>
          </div>

          <div className="resume-heuristics-box">
            <div className="heuristic-row">
              <span className="heuristic-label">
                <ShieldCheck size={14} color="#10b981" />
                Resume Format
              </span>
              <span className="heuristic-val">VALID PDF</span>
            </div>
            <div className="heuristic-row">
              <span className="heuristic-label">
                <CheckCircle2 size={14} color="#10b981" />
                Resume Content
              </span>
              <span className="heuristic-val">READY FOR ANALYSIS</span>
            </div>
          </div>
        </div>
      ) : (
        <div 
          className={`dropzone-container ${isDragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="dropzone-icon-orbit">
            <UploadCloud size={28} />
          </div>
          <h4 className="dropzone-heading">Drag & drop your resume PDF</h4>
          <p className="dropzone-subtext">or click to browse your local documents</p>
          <button 
            type="button" 
            className="dropzone-browse-btn"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <span>Browse PDF Files</span>
          </button>
        </div>
      )}
    </div>
  );
};
