import React, { useEffect, useState } from 'react';
import { 
  Cpu, 
  Database, 
  FileSearch, 
  Sparkles, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';

export const AnalysisPipelineModal = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      id: 0,
      title: 'Reading Resume',
      desc: 'Extracting skills, experience, and education',
      icon: FileSearch,
    },
    {
      id: 1,
      title: 'Loading Job Requirements',
      desc: 'Gathering qualifications for this role',
      icon: Database,
    },
    {
      id: 2,
      title: 'Evaluating Fit',
      desc: 'Reviewing skills and practical experience',
      icon: Sparkles,
    },
    {
      id: 3,
      title: 'Finalizing Insights',
      desc: 'Calculating match score and personal roadmap',
      icon: Cpu,
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="analysis-pipeline-modal">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
        <Loader2 size={20} className="upload-spinner-ring" style={{ width: '22px', height: '22px' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
          Analyzing Your Resume & Job Fit
        </h3>
      </div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
        Comparing your experience, skills, and projects against job requirements
      </p>

      <div className="pipeline-steps-grid">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <div 
              key={step.id} 
              className={`pipeline-step-item ${isActive ? 'active' : ''} ${isDone ? 'completed' : ''}`}
            >
              <div style={{ color: isDone ? '#10b981' : isActive ? '#818cf8' : 'var(--text-muted)' }}>
                {isDone ? <CheckCircle2 size={24} /> : <Icon size={24} />}
              </div>
              <div className="pipeline-step-title">{step.title}</div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
