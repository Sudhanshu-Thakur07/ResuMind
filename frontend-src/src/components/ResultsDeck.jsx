import React, { useState, useEffect } from 'react';
import { 
  Award, 
  AlertTriangle, 
  Compass, 
  Map, 
  Copy, 
  Check, 
  Sparkles, 
  BookOpen, 
  FolderGit2, 
  Layers, 
  Search, 
  CheckCircle2, 
  TrendingUp
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ResultsDeck = ({ 
  analysisData, 
  targetMode, 
  selectedRole,
  onSwitchRoleAndAnalyze,
  apiBase = 'http://localhost:8000'
}) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [copiedRoadmap, setCopiedRoadmap] = useState(false);

  // Secondary Feature States (loaded from backend endpoints)
  const [recommendedRoles, setRecommendedRoles] = useState(null);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const [roadmapData, setRoadmapData] = useState(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);

  // 1. Parse match_answer from /analyze endpoint
  let matchData = {};
  if (analysisData?.match_answer) {
    if (typeof analysisData.match_answer === 'string') {
      try {
        matchData = JSON.parse(analysisData.match_answer);
      } catch (e) {
        matchData = {};
      }
    } else {
      matchData = analysisData.match_answer;
    }
  }

  // 2. Parse resume_extract from /analyze endpoint
  let resumeExtract = {};
  if (analysisData?.resume_extract) {
    if (typeof analysisData.resume_extract === 'string') {
      try {
        resumeExtract = JSON.parse(analysisData.resume_extract);
      } catch (e) {
        resumeExtract = {};
      }
    } else {
      resumeExtract = analysisData.resume_extract;
    }
  }

  // 3. Parse jd_extract from /analyze endpoint
  let jdExtract = {};
  if (analysisData?.jd_extract) {
    if (typeof analysisData.jd_extract === 'string') {
      try {
        jdExtract = JSON.parse(analysisData.jd_extract);
      } catch (e) {
        jdExtract = {};
      }
    } else {
      jdExtract = analysisData.jd_extract;
    }
  }

  const matchPercent = matchData.match_percent ?? 0;
  const missingSkills = Array.isArray(matchData.missing_skills) ? matchData.missing_skills : [];
  const shortAnalysis = matchData.short_analysis ?? 'Analysis completed.';

  const resumeSkills = Array.isArray(resumeExtract.skills) ? resumeExtract.skills : [];
  const resumeExperience = Array.isArray(resumeExtract.experience) ? resumeExtract.experience : [];
  const resumeProjects = Array.isArray(resumeExtract.projects) ? resumeExtract.projects : [];
  const resumeAchievements = Array.isArray(resumeExtract.achievements) ? resumeExtract.achievements : [];
  const resumeLanguages = Array.isArray(resumeExtract.languages) ? resumeExtract.languages : [];

  const jdRequiredSkills = Array.isArray(jdExtract.required_skills) ? jdExtract.required_skills : [];
  const jdPreferredSkills = Array.isArray(jdExtract.preferred_skills) ? jdExtract.preferred_skills : [];
  const jdResponsibilities = Array.isArray(jdExtract.responsibilities) ? jdExtract.responsibilities : [];

  // Reset secondary features and active tab on analysis change
  useEffect(() => {
    setActiveTab('summary');
    setRecommendedRoles(null);
    setRoadmapData(null);
  }, [analysisData]);

  // Trigger celebration confetti if match score is high
  useEffect(() => {
    if (matchPercent >= 75) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#06b6d4', '#10b981', '#ec4899'],
      });
    }
  }, [matchPercent]);

  // Gauge calculation (radius = 48)
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (matchPercent / 100) * circumference;

  let scoreColor = '#f43f5e';
  let tierLabel = 'Needs Improvement';
  let tierBg = 'rgba(244, 63, 94, 0.15)';
  let tierBorder = 'rgba(244, 63, 94, 0.4)';

  if (matchPercent >= 85) {
    scoreColor = '#10b981';
    tierLabel = 'Strong Match';
    tierBg = 'rgba(16, 185, 129, 0.15)';
    tierBorder = 'rgba(16, 185, 129, 0.4)';
  } else if (matchPercent >= 70) {
    scoreColor = '#06b6d4';
    tierLabel = 'Good Match';
    tierBg = 'rgba(6, 182, 212, 0.15)';
    tierBorder = 'rgba(6, 182, 212, 0.4)';
  } else if (matchPercent >= 50) {
    scoreColor = '#f59e0b';
    tierLabel = 'Moderate Match';
    tierBg = 'rgba(245, 158, 11, 0.15)';
    tierBorder = 'rgba(245, 158, 11, 0.4)';
  }

  // Copy Feedback Memo
  const handleCopyMemo = () => {
    navigator.clipboard.writeText(shortAnalysis);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  // Fetch Recommended Roles from /reccomanded-roles endpoint
  const handleFetchRoles = async () => {
    if (recommendedRoles || loadingRoles) return;
    setLoadingRoles(true);
    try {
      const resp = await fetch(`${apiBase}/reccomanded-roles`);
      if (resp.ok) {
        const data = await resp.json();
        setRecommendedRoles(data.roles || (Array.isArray(data) ? data : []));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRoles(false);
    }
  };

  // Fetch Roadmap from /roadmap endpoint
  const handleFetchRoadmap = async () => {
    if (roadmapData || loadingRoadmap) return;
    setLoadingRoadmap(true);
    try {
      const resp = await fetch(`${apiBase}/roadmap`);
      if (resp.ok) {
        const data = await resp.json();
        setRoadmapData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRoadmap(false);
    }
  };

  // Export Roadmap as Markdown
  const handleCopyRoadmapMarkdown = () => {
    if (!roadmapData) return;
    let md = `# Personalized Learning Roadmap\n\n`;
    if (roadmapData.learning_path && roadmapData.learning_path.length > 0) {
      md += `## Step-by-Step Learning Path\n` + roadmapData.learning_path.map(s => `- ${s}`).join('\n') + `\n\n`;
    }
    if (roadmapData.study_resources && roadmapData.study_resources.length > 0) {
      md += `## Recommended Study Resources\n` + roadmapData.study_resources.map(s => `- ${s}`).join('\n') + `\n\n`;
    }
    if (roadmapData.recommended_projects && roadmapData.recommended_projects.length > 0) {
      md += `## Recommended Practice Projects\n` + roadmapData.recommended_projects.map(s => `- ${s}`).join('\n') + `\n\n`;
    }
    if (roadmapData.roadmap && roadmapData.roadmap.length > 0) {
      md += `## Action Plan Milestones\n` + roadmapData.roadmap.map(s => `- ${s}`).join('\n') + `\n`;
    }
    navigator.clipboard.writeText(md);
    setCopiedRoadmap(true);
    setTimeout(() => setCopiedRoadmap(false), 2000);
  };

  return (
    <section className="results-deck-section">
      <div className="results-deck-header">
        <div className="results-deck-title-group">
          <h2>
            <Award size={26} color="#818cf8" />
            Resume & Job Fit Analysis
          </h2>
          <p>Comprehensive match score, skill breakdown, and personalized recommendations</p>
        </div>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="metrics-trio-strip">
        {/* Radial Speedometer: Overall Fit */}
        <div className="metric-card-prime">
          <div className="gauge-visual-wrap">
            <svg className="radial-svg" viewBox="0 0 120 120">
              <circle 
                className="radial-track" 
                cx="60" 
                cy="60" 
                r={radius} 
              />
              <circle 
                className="radial-progress" 
                cx="60" 
                cy="60" 
                r={radius} 
                stroke={scoreColor}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="gauge-center-content">
              <span className="gauge-percent-text">{matchPercent}%</span>
              <span className="gauge-label">Match Score</span>
            </div>
          </div>

          <div className="score-meta-dossier">
            <span 
              className="score-badge-status"
              style={{ background: tierBg, color: scoreColor, border: `1px solid ${tierBorder}` }}
            >
              {tierLabel}
            </span>
            <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
              Overall Match
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              How closely your skills and experience match the role requirements.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Only for predefined roles; hidden for custom JD) */}
      {targetMode !== 'jd' && (
        <div className="deep-views-tab-bar">
          <button 
            className={`deep-view-btn ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
            type="button"
          >
            <Award size={16} />
            <span>Match & Feedback</span>
          </button>

          <button 
            className={`deep-view-btn ${activeTab === 'roles' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('roles');
              handleFetchRoles();
            }}
            type="button"
          >
            <Compass size={16} />
            <span>Recommended Roles</span>
          </button>

          <button 
            className={`deep-view-btn ${activeTab === 'roadmap' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('roadmap');
              handleFetchRoadmap();
            }}
            type="button"
          >
            <Map size={16} />
            <span>Learning Roadmap</span>
          </button>
        </div>
      )}

      {/* SECTION 1: MATCH & FEEDBACK (from /analyze -> match_answer) */}
      {(targetMode === 'jd' || activeTab === 'summary') && (
        <div className="analysis-layout-grid">
          {/* Recruiter Feedback Memo */}
          <div className="recruiter-synthesis-card">
            <div className="card-inner-header">
              <div className="card-inner-title">
                <Sparkles size={18} color="#818cf8" />
                <span>Recruiter Feedback & Summary</span>
              </div>
              <button 
                className="docs-link-btn"
                onClick={handleCopyMemo}
                title="Copy feedback summary"
              >
                {copiedMemo ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copiedMemo ? 'Copied' : 'Copy Feedback'}</span>
              </button>
            </div>
            <div className="recruiter-memo-content">
              {shortAnalysis}
            </div>
          </div>

          {/* Missing Skills */}
          <div className="missing-skills-radar-card">
            <div className="card-inner-header">
              <div className="card-inner-title">
                <AlertTriangle size={18} color="#f43f5e" />
                <span>Skills to Improve or Learn ({missingSkills.length})</span>
              </div>
            </div>

            {missingSkills.length === 0 ? (
              <div className="no-gaps-badge">
                <CheckCircle2 size={20} color="#10b981" />
                <span>Great job! You meet the core requirements for this position.</span>
              </div>
            ) : (
              <div>
                <div className="skills-tags-cluster">
                  {missingSkills.map((skill, idx) => (
                    <span key={idx} className="skill-gap-chip">
                      <span>{skill}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: RECOMMENDED ROLES (from /reccomanded-roles endpoint) */}
      {targetMode !== 'jd' && activeTab === 'roles' && (
        <div>
          {loadingRoles ? (
            <div className="upload-loading-state" style={{ padding: '40px 0' }}>
              <div className="upload-spinner-ring" />
              <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 600 }}>
                Finding alternative roles matching your skills...
              </p>
            </div>
          ) : recommendedRoles && recommendedRoles.length > 0 ? (
            <div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Based on your skills and experience, here are other roles that match your background:
              </p>
              <div className="alt-roles-grid">
                {recommendedRoles.map((roleName, idx) => (
                  <div key={idx} className="alt-role-card">
                    <div className="alt-role-top">
                      <div>
                        <div className="alt-role-title">{roleName}</div>
                        <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                          Alternative Career Match
                        </span>
                      </div>
                      <Compass size={20} color="#818cf8" />
                    </div>
                    <div className="alt-role-recommended-tag">
                      <CheckCircle2 size={13} color="#10b981" />
                      <span>Recommended Role</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No alternative roles returned yet. Click to reload.
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: LEARNING ROADMAP (from /roadmap endpoint) */}
      {targetMode !== 'jd' && activeTab === 'roadmap' && (
        <div>
          {loadingRoadmap ? (
            <div className="upload-loading-state" style={{ padding: '40px 0' }}>
              <div className="upload-spinner-ring" />
              <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 600 }}>
                Creating your personalized learning roadmap...
              </p>
            </div>
          ) : roadmapData ? (
            <div className="roadmap-container">
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  className="docs-link-btn"
                  onClick={handleCopyRoadmapMarkdown}
                >
                  {copiedRoadmap ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  <span>{copiedRoadmap ? 'Copied' : 'Export Roadmap (Markdown)'}</span>
                </button>
              </div>

              {/* Learning Path */}
              {roadmapData.learning_path && roadmapData.learning_path.length > 0 && (
                <div className="roadmap-card-section">
                  <div className="roadmap-section-header">
                    <div className="card-inner-title">
                      <BookOpen size={18} color="#06b6d4" />
                      <span>Step-by-Step Learning Path</span>
                    </div>
                  </div>
                  <div className="roadmap-timeline-steps">
                    {roadmapData.learning_path.map((item, idx) => (
                      <div key={idx} className="timeline-step-node">
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>
                          PHASE 0{idx + 1}
                        </span>
                        <div className="timeline-node-text">{item}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Study Resources */}
              {roadmapData.study_resources && roadmapData.study_resources.length > 0 && (
                <div className="roadmap-card-section">
                  <div className="roadmap-section-header">
                    <div className="card-inner-title">
                      <Layers size={18} color="#8b5cf6" />
                      <span>Recommended Study Resources</span>
                    </div>
                  </div>
                  <div className="study-resources-list">
                    {roadmapData.study_resources.map((res, idx) => (
                      <div key={idx} className="resource-pill-item">
                        <span className="resource-item-text">{res}</span>
                        <a 
                          href={`https://www.google.com/search?q=${encodeURIComponent(res + ' tutorial documentation')}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="search-resource-link"
                          title="Search resource tutorials"
                        >
                          <Search size={14} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Projects */}
              {roadmapData.recommended_projects && roadmapData.recommended_projects.length > 0 && (
                <div className="roadmap-card-section">
                  <div className="roadmap-section-header">
                    <div className="card-inner-title">
                      <FolderGit2 size={18} color="#10b981" />
                      <span>Practice Projects to Build</span>
                    </div>
                  </div>
                  <div className="projects-list">
                    {roadmapData.recommended_projects.map((proj, idx) => (
                      <div key={idx} className="resource-pill-item" style={{ borderColor: 'rgba(16, 185, 129, 0.25)' }}>
                        <span className="resource-item-text">{proj}</span>
                        <a 
                          href={`https://github.com/search?q=${encodeURIComponent(proj)}&type=repositories`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="search-resource-link"
                          style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7' }}
                          title="Search project examples on GitHub"
                        >
                          <FolderGit2 size={14} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Milestones */}
              {roadmapData.roadmap && roadmapData.roadmap.length > 0 && (
                <div className="roadmap-card-section">
                  <div className="roadmap-section-header">
                    <div className="card-inner-title">
                      <TrendingUp size={18} color="#ec4899" />
                      <span>Action Plan Milestones</span>
                    </div>
                  </div>
                  <div className="roadmap-timeline-steps">
                    {roadmapData.roadmap.map((m, idx) => (
                      <div key={idx} className="timeline-step-node">
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#f472b6' }}>
                          MILESTONE {idx + 1}
                        </span>
                        <div className="timeline-node-text">{m}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No roadmap generated yet. Click to create one.
            </div>
          )}
        </div>
      )}
    </section>
  );
};
