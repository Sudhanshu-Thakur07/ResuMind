/* ══════════════════════════════════════════════════════════
   ResuMind — Frontend Application Logic
   ══════════════════════════════════════════════════════════ */

const API_BASE = "http://localhost:8000"; // backend URL (cors_app.py)

/* ─── STATE ─── */
const state = {
    resumeUploaded: false,
    roleSelected: null,
    jdSubmitted: false,
    activeTab: "role",      // "role" | "jd"
    analysisData: null,
};

/* ─── DOM REFS ─── */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const els = {
    // Status
    apiStatus:   $("#api-status"),
    statusDot:   $("#api-status .status-dot"),
    statusText:  $("#api-status .status-text"),

    // Upload
    uploadZone:     $("#upload-zone"),
    fileInput:      $("#resume-file"),
    browseBtn:      $("#browse-btn"),
    uploadIdle:     $("#upload-idle"),
    uploadSuccess:  $("#upload-success"),
    uploadLoading:  $("#upload-loading"),
    fileNameDisplay:$("#file-name-display"),
    changeFileBtn:  $("#change-file-btn"),

    // Tabs
    tabRole: $("#tab-role"),
    tabJd:   $("#tab-jd"),
    panelRole: $("#panel-role"),
    panelJd:   $("#panel-jd"),

    // Roles
    roleGrid:        $("#role-grid"),
    roleSearch:      $("#role-search"),
    selectedLabel:   $("#selected-role-label"),
    selectedName:    $("#selected-role-name"),
    clearRoleBtn:    $("#clear-role-btn"),

    // JD form
    jdRole:          $("#jd-role"),
    jdExperience:    $("#jd-experience"),
    jdEducation:     $("#jd-education"),
    jdResponsibilities: $("#jd-responsibilities"),
    jdRequiredSkills:   $("#jd-required-skills"),
    jdPreferredSkills:  $("#jd-preferred-skills"),
    submitJdBtn:     $("#submit-jd-btn"),
    jdStatus:        $("#jd-status"),

    // Analyze
    analyzeBtn:  $("#analyze-btn"),
    analyzeHint: $("#analyze-hint"),

    // Results
    resultsSection:  $("#results-section"),
    matchRingFill:   $("#match-ring-fill"),
    matchPercentText:$("#match-percent-text"),
    missingSkillsList:$("#missing-skills-list"),
    analysisText:    $("#analysis-text"),

    // Features
    featuresSection: $("#features-section"),
    btnRoles:     $("#btn-roles"),
    btnRoadmap:   $("#btn-roadmap"),
    resultRoles:     $("#result-roles"),
    resultRoadmap:   $("#result-roadmap"),

    // Toast
    toastContainer: $("#toast-container"),
};


/* ══════════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", async () => {
    await checkAPIStatus();
    await loadRoles();
    bindEvents();
    injectRingSVGGradient();
});


/* ─── API HEALTH CHECK ─── */
async function checkAPIStatus() {
    try {
        const resp = await fetch(`${API_BASE}/`);
        if (resp.ok) {
            els.statusDot.classList.add("online");
            els.statusText.textContent = "API Online";
        } else { throw new Error(); }
    } catch {
        els.statusDot.classList.add("offline");
        els.statusText.textContent = "API Offline";
    }
}


/* ─── LOAD ROLES ─── */
async function loadRoles() {
    try {
        const resp = await fetch("roles.json");
        let data;
        if (resp.ok) {
            data = await resp.json();
        } else {
            // Fallback: fetch from data folder relative path won't work for static, hardcode available
            data = { roles: [
                "ai engineer", "machine learning engineer", "generative ai / llm engineer",
                "software engineer", "backend developer", "full stack developer",
                "data scientist", "data engineer", "data analyst", "cloud engineer",
                "devops engineer", "cybersecurity engineer", "cloud security engineer",
                "frontend developer", "mlops engineer / ml platform engineer"
            ]};
        }
        renderRoles(data.roles);
    } catch {
        // Hardcoded fallback
        renderRoles([
            "ai engineer", "machine learning engineer", "generative ai / llm engineer",
            "software engineer", "backend developer", "full stack developer",
            "data scientist", "data engineer", "data analyst", "cloud engineer",
            "devops engineer", "cybersecurity engineer", "cloud security engineer",
            "frontend developer", "mlops engineer / ml platform engineer"
        ]);
    }
}

/* Role icon map for visual flair */
const roleIcons = {
    "ai engineer": "🤖",
    "machine learning engineer": "🧠",
    "generative ai / llm engineer": "✨",
    "software engineer": "💻",
    "backend developer": "⚙️",
    "full stack developer": "🔗",
    "data scientist": "📊",
    "data engineer": "🔧",
    "data analyst": "📈",
    "cloud engineer": "☁️",
    "devops engineer": "🚀",
    "cybersecurity engineer": "🛡️",
    "cloud security engineer": "🔒",
    "frontend developer": "🎨",
    "mlops engineer / ml platform engineer": "📦",
};

function renderRoles(roles) {
    els.roleGrid.innerHTML = "";
    roles.forEach(role => {
        const chip = document.createElement("button");
        chip.className = "role-chip";
        chip.dataset.role = role;
        const icon = roleIcons[role] || "💼";
        chip.innerHTML = `${icon} ${capitalize(role)}`;
        chip.addEventListener("click", () => selectRole(role, chip));
        els.roleGrid.appendChild(chip);
    });
}

function capitalize(str) {
    return str.replace(/\b\w/g, c => c.toUpperCase());
}


/* ═══════════════════════════════════════════════════════════
   EVENT BINDINGS
   ═══════════════════════════════════════════════════════════ */

function bindEvents() {
    // ── Upload ──
    els.browseBtn.addEventListener("click", (e) => { e.stopPropagation(); els.fileInput.click(); });
    els.uploadZone.addEventListener("click", () => { if (!state.resumeUploaded) els.fileInput.click(); });
    els.fileInput.addEventListener("change", handleFileSelect);
    els.changeFileBtn.addEventListener("click", resetUpload);

    // Drag & drop
    els.uploadZone.addEventListener("dragover",  (e) => { e.preventDefault(); els.uploadZone.classList.add("drag-over"); });
    els.uploadZone.addEventListener("dragleave", ()  => { els.uploadZone.classList.remove("drag-over"); });
    els.uploadZone.addEventListener("drop", (e) => {
        e.preventDefault();
        els.uploadZone.classList.remove("drag-over");
        const file = e.dataTransfer.files[0];
        if (file) uploadFile(file);
    });

    // ── Tabs ──
    els.tabRole.addEventListener("click", () => switchTab("role"));
    els.tabJd.addEventListener("click",   () => switchTab("jd"));

    // ── Role search ──
    els.roleSearch.addEventListener("input", filterRoles);
    els.clearRoleBtn.addEventListener("click", clearRole);

    // ── JD submit ──
    els.submitJdBtn.addEventListener("click", submitJD);

    // ── Analyze ──
    els.analyzeBtn.addEventListener("click", runAnalysis);

    // ── Features ──
    els.btnRoles.addEventListener("click",     () => fetchFeature("roles"));
    els.btnRoadmap.addEventListener("click",   () => fetchFeature("roadmap"));
}


/* ═══════════════════════════════════════════════════════════
   FILE UPLOAD
   ═══════════════════════════════════════════════════════════ */

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) uploadFile(file);
}

async function uploadFile(file) {
    if (file.type !== "application/pdf") {
        toast("Only PDF files are allowed", "error");
        return;
    }

    // Show loading
    els.uploadIdle.classList.add("hidden");
    els.uploadSuccess.classList.add("hidden");
    els.uploadLoading.classList.remove("hidden");

    try {
        const formData = new FormData();
        formData.append("file", file);

        const resp = await fetch(`${API_BASE}/upload-pdf`, {
            method: "POST",
            body: formData,
        });

        if (!resp.ok) {
            const err = await resp.json();
            throw new Error(err.detail || "Upload failed");
        }

        state.resumeUploaded = true;
        els.fileNameDisplay.textContent = file.name;
        els.uploadLoading.classList.add("hidden");
        els.uploadSuccess.classList.remove("hidden");
        toast("Resume uploaded successfully!", "success");
        updateAnalyzeButton();

    } catch (err) {
        els.uploadLoading.classList.add("hidden");
        els.uploadIdle.classList.remove("hidden");
        toast(err.message || "Upload failed", "error");
    }
}

function resetUpload(e) {
    e.stopPropagation();
    state.resumeUploaded = false;
    els.fileInput.value = "";
    els.uploadSuccess.classList.add("hidden");
    els.uploadIdle.classList.remove("hidden");
    updateAnalyzeButton();
}


/* ═══════════════════════════════════════════════════════════
   TAB SWITCHING
   ═══════════════════════════════════════════════════════════ */

function switchTab(tab) {
    state.activeTab = tab;

    els.tabRole.classList.toggle("active", tab === "role");
    els.tabJd.classList.toggle("active",   tab === "jd");
    els.panelRole.classList.toggle("active", tab === "role");
    els.panelJd.classList.toggle("active",   tab === "jd");

    // Move slider
    const slider = $(".tab-slider");
    slider.style.transform = tab === "jd" ? "translateX(100%)" : "translateX(0)";

    // Hide previous results — context has changed
    hideResults();

    updateAnalyzeButton();
}


/* ═══════════════════════════════════════════════════════════
   ROLE SELECTION
   ═══════════════════════════════════════════════════════════ */

async function selectRole(role, chipEl) {
    // Deselect all
    $$(".role-chip").forEach(c => c.classList.remove("selected"));
    chipEl.classList.add("selected");

    state.roleSelected = role;
    state.jdSubmitted = false;

    els.selectedLabel.classList.remove("hidden");
    els.selectedName.textContent = capitalize(role);

    // POST to backend
    try {
        const resp = await fetch(`${API_BASE}/role-select?role=${encodeURIComponent(role)}`, {
            method: "POST",
        });
        if (!resp.ok) throw new Error();
        toast(`Role set: ${capitalize(role)}`, "info");
    } catch {
        toast("Failed to set role on server", "error");
    }

    updateAnalyzeButton();
}

function clearRole() {
    $$(".role-chip").forEach(c => c.classList.remove("selected"));
    state.roleSelected = null;
    els.selectedLabel.classList.add("hidden");
    updateAnalyzeButton();
}

function filterRoles() {
    const q = els.roleSearch.value.toLowerCase();
    $$(".role-chip").forEach(chip => {
        chip.style.display = chip.dataset.role.includes(q) ? "" : "none";
    });
}


/* ═══════════════════════════════════════════════════════════
   CUSTOM JD
   ═══════════════════════════════════════════════════════════ */

async function submitJD() {
    const role = els.jdRole.value.trim();
    const requiredSkills = els.jdRequiredSkills.value.trim();

    if (!role) { toast("Role title is required", "error"); return; }
    if (!requiredSkills) { toast("Required skills are required", "error"); return; }

    const payload = {
        role: role,
        experience: els.jdExperience.value.trim() || "",
        education: els.jdEducation.value.trim() || "",
        responsibilities: splitCSV(els.jdResponsibilities.value),
        required_skills: splitCSV(requiredSkills),
        preferred_skills: splitCSV(els.jdPreferredSkills.value),
    };

    try {
        const resp = await fetch(`${API_BASE}/upload-jd`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!resp.ok) {
            const err = await resp.json();
            throw new Error(err.detail || "JD submission failed");
        }

        state.jdSubmitted = true;
        state.roleSelected = null; // JD overrides role
        els.jdStatus.classList.remove("hidden");
        hideResults();  // hide stale results from previous analysis
        toast("Custom JD submitted!", "success");
        updateAnalyzeButton();
    } catch (err) {
        toast(err.message || "Failed to submit JD", "error");
    }
}

function splitCSV(str) {
    return str.split(",").map(s => s.trim()).filter(Boolean);
}


/* ═══════════════════════════════════════════════════════════
   ANALYZE BUTTON STATE
   ═══════════════════════════════════════════════════════════ */

function updateAnalyzeButton() {
    const ready = state.resumeUploaded &&
        ((state.activeTab === "role" && state.roleSelected) || (state.activeTab === "jd" && state.jdSubmitted));

    els.analyzeBtn.disabled = !ready;
    els.analyzeBtn.classList.toggle("disabled", !ready);

    if (ready) {
        els.analyzeHint.textContent = "Ready to analyze!";
        els.analyzeHint.style.color = "var(--success)";
    } else {
        const parts = [];
        if (!state.resumeUploaded) parts.push("upload resume");
        if (state.activeTab === "role" && !state.roleSelected) parts.push("select a role");
        if (state.activeTab === "jd" && !state.jdSubmitted) parts.push("submit a JD");
        els.analyzeHint.textContent = `${capitalize(parts.join(" & "))} to enable`;
        els.analyzeHint.style.color = "";
    }
}


/* ─── HIDE RESULTS & RESET FEATURES (context changed) ─── */

function hideResults() {
    state.analysisData = null;

    // Hide result sections
    els.resultsSection.classList.add("hidden");
    els.featuresSection.classList.add("hidden");

    // Reset feature buttons so they can be re-fetched
    [els.btnRoles, els.btnRoadmap].forEach(btn => {
        btn.dataset.fetched = "";
        btn.disabled = false;
        btn.classList.remove("btn-fetched");
        const content = btn.querySelector(".btn-content");
        const loading = btn.querySelector(".btn-loading");
        if (content) { content.classList.remove("hidden"); }
        if (loading) { loading.classList.add("hidden"); }
    });

    // Clear feature result containers
    els.resultRoles.classList.add("hidden");
    els.resultRoles.innerHTML = "";
    els.resultRoadmap.classList.add("hidden");
    els.resultRoadmap.innerHTML = "";
}


/* ═══════════════════════════════════════════════════════════
   RUN ANALYSIS
   ═══════════════════════════════════════════════════════════ */

async function runAnalysis() {
    if (els.analyzeBtn.disabled) return;

    // Toggle loading state
    const content = els.analyzeBtn.querySelector(".btn-content");
    const loading = els.analyzeBtn.querySelector(".btn-loading");
    content.classList.add("hidden");
    loading.classList.remove("hidden");
    els.analyzeBtn.disabled = true;

    try {
        const resp = await fetch(`${API_BASE}/analyze`);
        if (!resp.ok) {
            let detail = `Server error (${resp.status})`;
            try { const err = await resp.json(); detail = err.detail || detail; } catch { detail = await resp.text() || detail; }
            throw new Error(detail);
        }

        const data = await resp.json();
        state.analysisData = data;

        renderResults(data);

        toast("Analysis complete!", "success");
    } catch (err) {
        toast(err.message || "Analysis failed", "error");
    } finally {
        content.classList.remove("hidden");
        loading.classList.add("hidden");
        els.analyzeBtn.disabled = false;
    }
}


/* ═══════════════════════════════════════════════════════════
   RENDER RESULTS
   ═══════════════════════════════════════════════════════════ */

function renderResults(data) {
    // Parse match_answer (might be string or object)
    let matchData;
    if (typeof data.match_answer === "string") {
        try { matchData = JSON.parse(data.match_answer); } catch { matchData = {}; }
    } else {
        matchData = data.match_answer || {};
    }

    const percent  = matchData.match_percent ?? 0;
    const missing  = matchData.missing_skills ?? [];
    const analysis = matchData.short_analysis ?? "No analysis available.";

    // ── Match Ring ──
    const circumference = 2 * Math.PI * 52; // r=52
    const offset = circumference - (percent / 100) * circumference;
    els.matchRingFill.style.strokeDashoffset = offset;
    els.matchPercentText.textContent = `${percent}%`;

    // Color the ring based on score
    const ringColor = percent >= 75 ? "#00E68A" : percent >= 50 ? "#FFB547" : "#FF5C72";
    els.matchRingFill.style.stroke = ringColor;

    // ── Missing Skills ──
    els.missingSkillsList.innerHTML = "";
    if (missing.length === 0) {
        els.missingSkillsList.innerHTML = `<p style="color:var(--success); font-size:0.85rem;">🎉 No missing skills found!</p>`;
    } else {
        missing.forEach(skill => {
            const tag = document.createElement("div");
            tag.className = "skill-tag";
            tag.textContent = skill;
            els.missingSkillsList.appendChild(tag);
        });
    }

    // ── Analysis ──
    els.analysisText.textContent = analysis;

    // Show results section
    els.resultsSection.classList.remove("hidden");

    // Features (Role Recommendations & Learning Roadmap) are only for selected roles, NOT for custom JD
    if (state.activeTab === "role") {
        els.featuresSection.classList.remove("hidden");
    } else {
        els.featuresSection.classList.add("hidden");
    }

    // Re-trigger animations
    els.resultsSection.querySelectorAll(".result-card").forEach(card => {
        card.style.animation = "none";
        card.offsetHeight; // reflow
        card.style.animation = "";
    });

    // Scroll to results
    els.resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}


/* ═══════════════════════════════════════════════════════════
   FEATURE ENDPOINTS
   ═══════════════════════════════════════════════════════════ */

async function fetchFeature(feature) {
    const btnMap = { roles: els.btnRoles, roadmap: els.btnRoadmap };
    const resultMap = { roles: els.resultRoles, roadmap: els.resultRoadmap };
    const endpointMap = {
        roles:     "/reccomanded-roles",
        roadmap:   "/roadmap",
    };

    const btn = btnMap[feature];
    const result = resultMap[feature];
    const endpoint = endpointMap[feature];

    // If already fetched, do nothing
    if (btn.dataset.fetched === "true") return;

    // Loading state
    const content = btn.querySelector(".btn-content");
    const loading = btn.querySelector(".btn-loading");
    content.classList.add("hidden");
    loading.classList.remove("hidden");
    btn.disabled = true;

    try {
        const resp = await fetch(`${API_BASE}${endpoint}`);
        if (!resp.ok) {
            let detail = `Server error (${resp.status})`;
            try { const err = await resp.json(); detail = err.detail || detail; } catch { detail = await resp.text() || detail; }
            throw new Error(detail);
        }

        const data = await resp.json();
        renderFeatureResult(feature, data, result);
        result.classList.remove("hidden");

        // Mark as fetched — keep button disabled to prevent re-hitting the API
        btn.dataset.fetched = "true";
        loading.classList.add("hidden");
        content.innerHTML = `✓ ${capitalize(feature)} Loaded`;
        content.classList.remove("hidden");
        btn.classList.add("btn-fetched");

        toast(`${capitalize(feature)} loaded!`, "success");
    } catch (err) {
        toast(err.message || `Failed to fetch ${feature}`, "error");
        // Only re-enable on failure so user can retry
        content.classList.remove("hidden");
        loading.classList.add("hidden");
        btn.disabled = false;
    }
}

function renderFeatureResult(feature, data, container) {
    container.innerHTML = "";

    if (feature === "roles") {
        const roles = data.roles || data;
        if (Array.isArray(roles) && roles.length) {
            const wrap = document.createElement("div");
            wrap.style.display = "flex";
            wrap.style.flexWrap = "wrap";
            wrap.style.gap = "6px";
            roles.forEach(role => {
                const chip = document.createElement("span");
                chip.className = "result-role-chip";
                chip.textContent = capitalize(String(role));
                wrap.appendChild(chip);
            });
            container.appendChild(wrap);
        } else {
            container.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem;">No recommendations available.</p>`;
        }
    }

    else if (feature === "roadmap") {
        const sections = [
            { key: "learning_path",        title: "📚 Learning Path" },
            { key: "study_resources",      title: "🔗 Study Resources" },
            { key: "recommended_projects", title: "🛠️ Recommended Projects" },
            { key: "roadmap",              title: "🗺️ Roadmap" },
        ];
        sections.forEach(({ key, title }) => {
            const items = data[key];
            if (items && items.length) {
                const h4 = document.createElement("h4");
                h4.textContent = title;
                container.appendChild(h4);

                const ul = document.createElement("ul");
                items.forEach(item => {
                    const li = document.createElement("li");
                    li.textContent = item;
                    ul.appendChild(li);
                });
                container.appendChild(ul);
            }
        });
        if (!container.children.length) {
            container.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem;">No roadmap data available.</p>`;
        }
    }


}


/* ═══════════════════════════════════════════════════════════
   TOAST NOTIFICATIONS
   ═══════════════════════════════════════════════════════════ */

function toast(message, type = "info") {
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;

    const icons = { success: "✓", error: "✕", info: "ℹ" };
    el.innerHTML = `<span>${icons[type] || "ℹ"}</span> ${message}`;

    els.toastContainer.appendChild(el);

    setTimeout(() => {
        el.classList.add("toast-out");
        el.addEventListener("animationend", () => el.remove());
    }, 4000);
}


/* ═══════════════════════════════════════════════════════════
   SVG GRADIENT for MATCH RING (injected for proper rendering)
   ═══════════════════════════════════════════════════════════ */

function injectRingSVGGradient() {
    const svg = $(".match-ring");
    if (!svg) return;
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const grad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    grad.id = "ring-gradient";
    grad.setAttribute("x1", "0%"); grad.setAttribute("y1", "0%");
    grad.setAttribute("x2", "100%"); grad.setAttribute("y2", "100%");
    const s1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    s1.setAttribute("offset", "0%"); s1.setAttribute("stop-color", "#6C63FF");
    const s2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    s2.setAttribute("offset", "100%"); s2.setAttribute("stop-color", "#00D4FF");
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
    svg.insertBefore(defs, svg.firstChild);
}
