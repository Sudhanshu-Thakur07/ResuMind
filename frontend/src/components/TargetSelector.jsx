import React, { useState } from 'react';
import { 
  Target, 
  Layers, 
  Search, 
  Check, 
  Sliders, 
  Send
} from 'lucide-react';
import { PREDEFINED_ROLES, ROLES_CATEGORIES } from '../data/rolesData';

export const TargetSelector = ({ 
  targetMode, 
  setTargetMode, 
  selectedRole, 
  onRoleSelect, 
  onCustomJdSubmit,
  customJdData 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Custom JD Form State
  const [jdForm, setJdForm] = useState({
    role: customJdData?.role || '',
    experience: customJdData?.experience || '',
    education: customJdData?.education || '',
    responsibilities: customJdData?.responsibilities?.join(', ') || '',
    required_skills: customJdData?.required_skills?.join(', ') || '',
    preferred_skills: customJdData?.preferred_skills?.join(', ') || '',
  });

  const filteredRoles = PREDEFINED_ROLES.filter((r) => {
    const matchesCategory = activeCategory === 'all' || r.category === activeCategory;
    const matchesSearch = 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleJdSubmit = (e) => {
    e.preventDefault();
    if (!jdForm.role.trim() || !jdForm.required_skills.trim()) {
      return;
    }

    const payload = {
      role: jdForm.role.trim(),
      experience: jdForm.experience.trim() || 'Any experience',
      education: jdForm.education.trim() || 'Degree or equivalent practical experience',
      responsibilities: jdForm.responsibilities
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      required_skills: jdForm.required_skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      preferred_skills: jdForm.preferred_skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    onCustomJdSubmit(payload);
  };

  return (
    <div className="glass-panel">
      <div className="panel-header">
        <div className="panel-header-left">
          <div className="panel-icon-badge" style={{ background: 'rgba(6, 182, 212, 0.12)', borderColor: 'rgba(6, 182, 212, 0.3)', color: '#06b6d4' }}>
            <Target size={18} />
          </div>
          <div>
            <h3 className="panel-title">2. Target Job / Role</h3>
            <p className="panel-subtitle">Choose a curated role or supply custom job requirements</p>
          </div>
        </div>
        <span className="panel-badge">
          {targetMode === 'role' ? (selectedRole ? 'READY' : 'SELECT ROLE') : (customJdData ? 'JD SAVED' : 'ENTER DETAILS')}
        </span>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="target-tabs-bar">
        <button 
          className={`target-tab-btn ${targetMode === 'role' ? 'active' : ''}`}
          onClick={() => setTargetMode('role')}
          type="button"
        >
          <Layers size={15} />
          <span>Curated Tech Roles</span>
        </button>

        <button 
          className={`target-tab-btn ${targetMode === 'jd' ? 'active' : ''}`}
          onClick={() => setTargetMode('jd')}
          type="button"
        >
          <Sliders size={15} />
          <span>Custom Job Description</span>
        </button>
      </div>

      {targetMode === 'role' ? (
        <div>
          {/* Search bar */}
          <div className="roles-search-wrapper">
            <Search size={16} className="search-input-icon" />
            <input 
              type="text" 
              className="roles-search-input" 
              placeholder="Search roles (e.g. AI Engineer, Developer, Data)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Chips */}
          <div className="category-filter-strip">
            {ROLES_CATEGORIES.map((cat) => (
              <button 
                key={cat.id}
                className={`category-chip ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
                type="button"
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Predefined Roles Grid */}
          <div className="roles-grid">
            {filteredRoles.map((role) => {
              const isSelected = selectedRole === role.id;
              return (
                <div 
                  key={role.id}
                  className={`role-card-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => onRoleSelect(role.id)}
                >
                  <span className="role-card-icon">{role.icon}</span>
                  <div className="role-card-content">
                    <span className="role-card-name">{role.name}</span>
                  </div>
                  {isSelected && (
                    <div className="role-selected-check">
                      <Check size={13} color="#a5b4fc" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <form onSubmit={handleJdSubmit} className="jd-form-wrapper">
          <div className="form-two-col-grid">
            <div className="form-field-wrap">
              <label className="form-field-label">
                Job Title / Role <span className="required-star">*</span>
              </label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Senior Golang Microservices Engineer"
                required
                value={jdForm.role}
                onChange={(e) => setJdForm({ ...jdForm, role: e.target.value })}
              />
            </div>

            <div className="form-field-wrap">
              <label className="form-field-label">Experience Requirement</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. 4+ years in distributed systems"
                value={jdForm.experience}
                onChange={(e) => setJdForm({ ...jdForm, experience: e.target.value })}
              />
            </div>
          </div>

          <div className="form-field-wrap">
            <label className="form-field-label">Education / Degree</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. BS in Computer Science, STEM, or equivalent"
              value={jdForm.education}
              onChange={(e) => setJdForm({ ...jdForm, education: e.target.value })}
            />
          </div>

          <div className="form-field-wrap">
            <label className="form-field-label">
              Required Skills (comma-separated) <span className="required-star">*</span>
            </label>
            <textarea 
              className="form-textarea" 
              placeholder="e.g. Python, SQL, REST APIs, Git, PostgreSQL"
              required
              rows={2}
              value={jdForm.required_skills}
              onChange={(e) => setJdForm({ ...jdForm, required_skills: e.target.value })}
            />
          </div>

          <div className="form-field-wrap">
            <label className="form-field-label">
              Preferred Skills (optional, comma-separated)
            </label>
            <textarea 
              className="form-textarea" 
              placeholder="e.g. Docker, AWS, React, GraphQL"
              rows={2}
              value={jdForm.preferred_skills}
              onChange={(e) => setJdForm({ ...jdForm, preferred_skills: e.target.value })}
            />
          </div>

          <div className="form-field-wrap">
            <label className="form-field-label">
              Key Responsibilities (optional, comma-separated)
            </label>
            <textarea 
              className="form-textarea" 
              placeholder="e.g. Build backend services, collaborate with team, test features"
              rows={2}
              value={jdForm.responsibilities}
              onChange={(e) => setJdForm({ ...jdForm, responsibilities: e.target.value })}
            />
          </div>

          <button type="submit" className="jd-submit-btn">
            <Send size={15} />
            <span>Save Job Description</span>
          </button>
        </form>
      )}
    </div>
  );
};
