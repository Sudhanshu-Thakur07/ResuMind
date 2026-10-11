# 🤖 ResuMind — RAG AI Resume Analyzer & Job Fit Intelligence

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python&logoColor=white" alt="Python Version" />
  <img src="https://img.shields.io/badge/FastAPI-0.141-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Groq%20LLM-Qwen%203.8--27B-f55036?style=for-the-badge&logo=fastapi&logoColor=white" alt="Groq" />
  <img src="https://img.shields.io/badge/Qdrant-Vector%20Cloud-DC2626?style=for-the-badge&logo=qdrant&logoColor=white" alt="Qdrant" />
  <img src="https://img.shields.io/badge/Embeddings-BAAI%2Fbge--small--en-purple?style=for-the-badge" alt="FastEmbed" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <a href="https://www.linkedin.com/in/sudhanshu-thakur07/">
    <img src="https://img.shields.io/badge/LinkedIn-Sudhanshu%20Thakur-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
  </a>
  <a href="https://github.com/Sudhanshu-Thakur07/RAG-Ai-Resume-Analyzer">
    <img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Repo" />
  </a>
</p>

---

## 📌 Overview

**ResuMind** is an AI-powered resume intelligence platform designed to evaluate job candidate fit with deep semantic reasoning rather than simple keyword tallying. 

Upload any resume in PDF format, select from **15 curated technology roles** (or supply a custom Job Description), and receive:
- 🎯 **Overall Match Score** with visual radial progress indicator and tier ratings
- 📝 **Recruiter Feedback & Summary** with one-click copy
- ⚠️ **Skills to Improve or Learn** highlighting exact competency gaps
- 🧭 **Recommended Roles** suggesting adjacent career paths tailored to your background
- 🗺️ **Personalized Learning Roadmap** with step-by-step phases, study resources, practical projects, and milestones with Markdown export

Powered by **Groq Cloud's ultra-fast LLM inference (`qwen/qwen3.8-27b`)**, **Qdrant Vector Database**, and **FastEmbed (`BAAI/bge-small-en-v1.5`)**, delivered through an animated **glassmorphic dark UI built with React 19 and Vite**.

---

## 🧠 System Architecture & Workflow

```
   ┌──────────────────────────┐
   │     User Resume (PDF)    │
   └─────────────┬────────────┘
                 │
                 ▼
   ┌──────────────────────────┐
   │    PyPDF Text Parsing    │
   └─────────────┬────────────┘
                 │
                 ▼
   ┌──────────────────────────┐
   │ Resume Heuristic Check   │ ──► [Non-resume rejected with 422 error]
   └─────────────┬────────────┘
                 │ (Validated)
                 ▼
   ┌──────────────────────────┐      Semantic Vector Search (Top-K)
   │ FastEmbed (bge-small-en) │ ───────────────────────────────────────┐
   └─────────────┬────────────┘                                        │
                 │                                                     ▼
                 │                                        ┌─────────────────────────┐
                 │                                        │  Qdrant Vector Database │
                 │                                        │ (15 Pre-loaded Role JDs)│
                 ▼                                        └────────────┬────────────┘
   ┌──────────────────────────┐                                        │
   │  Groq LLM (Qwen-27B)     │ ◄──────────────────────────────────────┘
   │  - Semantic Extraction   │       Retrieved Role Knowledge / Custom JD
   │  - Multi-factor Matching │
   └─────────────┬────────────┘
                 │
                 ├────────────────────────┬────────────────────────┐
                 ▼                        ▼                        ▼
        ┌──────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
        │  Match Score &   │    │  Recommended     │    │ Personalized        │
        │  Feedback Memo   │    │  Career Roles    │    │ Learning Roadmap    │
        └────────┬─────────┘    └────────┬─────────┘    └──────────┬──────────┘
                 │                       │                         │
                 └───────────────────────┼─────────────────────────┘
                                         ▼
                        ┌─────────────────────────────────┐
                        │   ResuMind Glassmorphic UI      │
                        │   (React 19 + Vite Frontend)    │
                        │   (http://127.0.0.1:8000/app/)  │
                        └─────────────────────────────────┘
```

---

## Project Demo Video


https://github.com/user-attachments/assets/a0b7940f-ba79-45b3-aad0-079e265b5445



## 🌟 Key Features

| Feature | Description |
|---|---|
| **📄 Smart Resume Validation** | PyPDF parser checks content depth and structural resume keywords (education, skills, experience) to block invalid files. |
| **🔍 Semantic Vector Retrieval** | FastEmbed generates dense embeddings; Qdrant retrieves top-15 relevant role chunks based on semantic meaning. |
| **🤖 Groq LLM Reasoning** | Uses high-throughput Qwen 3.8-27B to evaluate skills conceptually rather than naive exact-keyword matching. |
| **🎯 Dual Target Mode** | Choose from **15 curated technology roles** with plain-English descriptions or supply a custom job description. |
| **📊 Overall Match Score** | Animated circular SVG match score with intuitive rating tiers (*Strong Match*, *Good Match*, *Moderate Match*, *Needs Improvement*). |
| **📝 Recruiter Feedback & Gaps** | Detailed feedback summary and clear tags of skills to improve or learn. |
| **🧭 Recommended Roles** | Identifies alternative career positions matching your unique background. |
| **🗺️ Gap-Closing Roadmap** | Phased learning path, curated study resources, practical projects, and milestones with Markdown export. |
| **🌐 Unified Single Server** | FastAPI serves both backend REST endpoints and frontend production assets on a single port without CORS hassle. |

---

## 📁 Repository File Structure

```
RAG-Ai-Resume-Analyzer-main/
│
├── backend/                             # ⚡ FastAPI Backend Application
│   ├── config.py                        # Environment loading, Groq & Qdrant client setup
│   ├── cors_app.py                      # 🌐 CORS wrapper & Frontend Static File Server
│   ├── main.py                          # 🚀 Core API endpoints & PDF validation logic
│   ├── schemas.py                       # 📋 Pydantic schemas for structured JSON output
│   ├── setup_vector_db.py               # ⚙️ Auto-vectorization & Qdrant collection seeder
│   └── services/                        # 🧠 AI & DB Business Logic Services
│       ├── llm_service.py               # Groq LLM prompt execution & JSON extraction
│       ├── qdrant_service.py            # Vector search query & context extraction
│       ├── resume_analysis.py           # Core RAG matching & gap evaluation engine
│       ├── roadmap.py                   # Missing-skills learning roadmap generator
│       └── role_recommendation.py       # Alternative career path recommendation engine
│
├── frontend/                            # 🎨 Compiled Production Web Client (dist)
│   ├── index.html                       # Production entry HTML
│   └── assets/                          # Minified CSS & JS bundles
│
├── frontend-src/                        # ⚡ React 19 + Vite Frontend Source Code
│   ├── src/
│   │   ├── components/                  # Navbar, ResumeDropzone, TargetSelector,
│   │   │                                # ResultsDeck, AnalysisPipelineModal, ToastContainer
│   │   ├── data/rolesData.js            # 15 Curated tech role benchmarks & categories
│   │   ├── App.jsx                      # Main React workspace & workflow coordinator
│   │   ├── index.css                    # Obsidian Nebula Glassmorphic design system
│   │   └── main.jsx                     # React root mount
│   ├── index.html                       # Development HTML template
│   ├── package.json                     # Frontend dependencies & build scripts
│   └── vite.config.js                   # Vite configuration (proxies & build outDir)
│
├── data/                                # 📚 Knowledge Base Data
│   ├── available_roles.json             # Master list of all 15 supported role names
│   └── roles_data/                      # Detailed JSON job descriptions for each role
│       ├── AI_Engineer_JD.json
│       ├── Backend Developer_JD.json
│       ├── Cloud Engineer_JD.json
│       ├── Data Scientist_JD.json
│       ├── DevOps Engineer_JD.json
│       ├── Full Stack Developer_JD.json
│       └── ... (15 role descriptions total)
│
├── .env.example                         # 🔑 Sample configuration file
├── .env                                 # 🔒 Your secret API keys (git-ignored)
├── requirements.txt                     # 📦 Pinned Python dependencies
└── README.md                            # 📖 Project documentation
```

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed on your machine:

1. **Python 3.10 or higher**
   - Check with:
     ```bash
     python --version
     ```
   - Download from: [python.org](https://www.python.org/downloads/)
2. **pip (Python Package Manager)**
   - Check with:
     ```bash
     pip --version
     ```
3. **Git (Optional, to clone the repo)**
   - Download from: [git-scm.com](https://git-scm.com/)

---

## 🔑 Getting Your Free API Keys

ResuMind requires **two free API keys** to run:

### 1. Groq Cloud API Key (LLM Inference)
1. Visit [console.groq.com](https://console.groq.com/) and register for a free account.
2. In the left navigation, click **API Keys**.
3. Click **Create API Key**, give it a name, and copy the key (starts with `gsk_...`).

### 2. Qdrant Cloud API Key & Cluster URL (Vector DB)
1. Visit [cloud.qdrant.io](https://cloud.qdrant.io/) and create a free account.
2. Click **Create Cluster** and select the **Free Tier**.
3. Once cluster creation is complete:
   - Copy your **Cluster URL** (format: `https://xxxxxx-xxxx-xxxx.aws.cloud.qdrant.io:6333`).
   - Under **Data Access Control**, generate an **API Key** and copy it.

---

## 🚀 Beginner Step-by-Step Installation & Setup

Follow these exact steps to set up and run the project from scratch:

### Step 1: Clone or Download the Repository

**Using Git:**
```bash
git clone https://github.com/Sudhanshu-Thakur07/RAG-Ai-Resume-Analyzer.git
cd RAG-Ai-Resume-Analyzer
```

*Or download the ZIP from GitHub, extract it, open your terminal / command prompt, and navigate (`cd`) into the folder.*

---

### Step 2: Create and Activate a Python Virtual Environment

A virtual environment prevents conflicts with other Python projects on your machine.

#### On Windows (PowerShell or Command Prompt):
```powershell
python -m venv venv
venv\Scripts\activate
```

#### On macOS / Linux:
```bash
python3 -m venv venv
source venv/bin/activate
```

> 💡 **Confirmation:** Once activated, you will see `(venv)` prepended to your command prompt.

---

### Step 3: Install Required Dependencies

Install all project libraries using `requirements.txt`:

```bash
pip install -r requirements.txt
```

This installs:
- `fastapi` & `uvicorn` — High-performance ASGI web framework and server
- `groq` — Official Groq Cloud LLM SDK
- `qdrant-client` — Cloud vector database client
- `fastembed` — High-speed local embedding inference model
- `pypdf` — PDF document parsing and text extraction
- `python-dotenv` — Secure environment variable management

> ⏳ **Note:** On the very first run, `fastembed` will download the lightweight `BAAI/bge-small-en-v1.5` model (~130 MB). This is completely automatic and cached locally.

---

### Step 4: Configure Environment Variables (`.env`)

1. In the **root directory** of the project (same level as `requirements.txt`), duplicate `.env.example` to create your `.env` file:

   **On Windows:**
   ```powershell
   copy .env.example .env
   ```

   **On macOS / Linux:**
   ```bash
   cp .env.example .env
   ```

2. Open the newly created `.env` file in VS Code or Notepad and replace with your actual keys:

   ```env
   GROQ_API_KEY=gsk_your_actual_groq_api_key_here
   QDRANT_URL=https://your-cluster-id.aws.cloud.qdrant.io:6333
   QDRANT_API_KEY=your_actual_qdrant_api_key_here
   ```

> ⚠️ **Important formatting rules:**
> - Do **not** wrap keys in quotes (`"` or `'`).
> - Keep `.env` in the root folder, not inside `backend/`.
> - Never commit your `.env` file to public GitHub repositories.

---

### Step 5: Start Backend & Frontend (One Command!)

Run the application using the CORS & static server wrapper:

```bash
python -m uvicorn backend.cors_app:app --reload
```

#### What happens when you run this command:
1. **Vector DB Auto-Check**: The server automatically connects to Qdrant. If the `roles_knowledge` collection is not present, it will automatically embed and load all 15 role descriptions from `data/roles_data/`!
2. **FastAPI Server Starts**: Launches on `http://127.0.0.1:8000`.
3. **Frontend Mounts Automatically**: The web UI is statically hosted through the server.

You should see terminal output like this:
```text
Connected to Qdrant successfully.
[Step 1/2] Checking vector database...
  Vector DB ready — 638 knowledge chunks loaded.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

---

### Step 6: Open the Application in Your Browser

Open your web browser and navigate to:

👉 **[http://127.0.0.1:8000/app/](http://127.0.0.1:8000/app/)**

You will be greeted by the ResuMind dashboard with a live status indicator showing **`System Online`**.

---

### 💻 Optional: Frontend Development with Hot Reloading (Vite)

If you want to modify or develop the React frontend with instant hot-module replacement (HMR):

```bash
cd frontend-src
npm install
npm run dev
```
- Open `http://localhost:5173` in your browser (Vite automatically proxies API requests to `http://localhost:8000`).
- To compile updated production assets for FastAPI static hosting:
  ```bash
  npm run build
  ```
  *(The compiled bundle is automatically placed into `../frontend/`)*

---

## 🖥️ How to Use the ResuMind Web App

1. **Upload Resume**:
   - Drag & drop your resume PDF or click **Browse Files**.
   - ResuMind validates the PDF in real-time to confirm readable resume structure (experience, skills, education).
2. **Select Target Role or Provide Custom JD**:
   - **Popular Job Roles**: Choose from 15 curated tech positions with clear, plain-English summaries.
   - **Custom Job Description**: Enter target title, experience level, required skills, and key responsibilities.
3. **Run AI Analysis**:
   - Click the gradient **Analyze Resume Fit** button.
   - ResuMind compares your background with the target requirements using Groq LLM reasoning and Qdrant vector retrieval.
4. **Explore the Results Sections**:
   - **Match & Feedback**: Check your **Overall Match Score** (animated circular meter with tier rating), read the **Recruiter Feedback & Summary** (with one-click copy), and review **Skills to Improve or Learn**.
   - **Recommended Roles**: Browse adjacent career paths and tech roles that fit your existing skills.
   - **Learning Roadmap**: Review your phased learning path, curated study resources, practical projects, and milestones with an **Export Roadmap (Markdown)** button.

---

## 🎯 15 Pre-Configured Roles

| # | Role | Knowledge Data File |
|:---:|---|---|
| 1 | AI Engineer | `data/roles_data/AI_Engineer_JD.json` |
| 2 | Machine Learning Engineer | `data/roles_data/Machine Learning Engineer_JD.json` |
| 3 | Generative AI / LLM Engineer | `data/roles_data/GEN_AI Engineer_JD.json` |
| 4 | Software Engineer | `data/roles_data/Software Engineer_JD.json` |
| 5 | Backend Developer | `data/roles_data/Backend Developer_JD.json` |
| 6 | Full Stack Developer | `data/roles_data/Full Stack Developer_JD.json` |
| 7 | Data Scientist | `data/roles_data/Data Scientist_JD.json` |
| 8 | Data Engineer | `data/roles_data/Data Engineer_JD.json` |
| 9 | Data Analyst | `data/roles_data/Data Analyst_JD.json` |
| 10 | Cloud Engineer | `data/roles_data/Cloud Engineer_JD.json` |
| 11 | DevOps Engineer | `data/roles_data/DevOps Engineer_JD.json` |
| 12 | Cybersecurity Engineer | `data/roles_data/Cybersecurity Engineer_JD.json` |
| 13 | Cloud Security Engineer | `data/roles_data/Cloud Security Engineer_JD.json` |
| 14 | Frontend Developer | `data/roles_data/Frontend Developer_JD.json` |
| 15 | MLOps Engineer / Platform Engineer | `data/roles_data/MLOps Engineer_JD.json` |

---

## 📡 REST API Reference

You can also interact directly with the FastAPI backend using cURL, Postman, or Python scripts:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check (`{"Description": "ResuMind..."}`) |
| `POST` | `/upload-pdf` | Upload resume PDF file (`multipart/form-data`) |
| `POST` | `/role-select?role=<role_name>` | Select predefined role target |
| `POST` | `/upload-jd` | Submit custom job description JSON body |
| `GET` | `/analyze` | Execute RAG analysis between resume & target |
| `GET` | `/reccomanded-roles` | Get alternate role recommendations |
| `GET` | `/roadmap` | Generate skill-gap learning roadmap |
| `GET` | `/docs` | Interactive Swagger API documentation |

---

## ❓ Troubleshooting & FAQs

### 1. `python -m uvicorn` gives `'uvicorn' is not recognized` or `ModuleNotFoundError`
- **Fix:** Ensure your virtual environment is activated (`venv\Scripts\activate` on Windows or `source venv/bin/activate` on Mac/Linux) and run `pip install -r requirements.txt`.

### 2. Error: `ValueError: .env content is missing`
- **Fix:** Confirm your `.env` file is named exactly `.env` (not `.env.txt`) and placed in the project root directory alongside `requirements.txt`. Ensure all three keys (`GROQ_API_KEY`, `QDRANT_URL`, `QDRANT_API_KEY`) are populated without quotes.

### 3. Qdrant Connection Error / Timeout
- **Fix:** Free tier clusters on Qdrant Cloud may pause after inactivity. Log into [cloud.qdrant.io](https://cloud.qdrant.io/) and click **Resume**. Also ensure your cluster URL includes the `:6333` port or HTTPS protocol as displayed in your Qdrant console.

### 4. Upload Error: `The uploaded PDF does not appear to be a resume`
- **Fix:** ResuMind includes safety heuristics requiring at least 3 standard resume sections (e.g., education, experience, skills, projects). Make sure you are uploading a valid resume and not an arbitrary PDF document.

### 5. Frontend shows `API Offline`
- **Fix:** Ensure the terminal running `python -m uvicorn backend.cors_app:app --reload` is running and has no unhandled crash errors. Access the frontend via `http://127.0.0.1:8000/app/`.

---

## 👨‍💻 Author & Connect

**Sudhanshu Thakur**  
AI & Full Stack Developer

- 💼 **LinkedIn**: [linkedin.com/in/sudhanshu-thakur07](https://www.linkedin.com/in/sudhanshu-thakur07/)
- 🐙 **GitHub**: [github.com/Sudhanshu-Thakur07](https://github.com/Sudhanshu-Thakur07)
- 📧 **Repository**: [RAG-Ai-Resume-Analyzer](https://github.com/Sudhanshu-Thakur07/RAG-Ai-Resume-Analyzer)

If you found this project helpful, please consider giving it a ⭐ on GitHub!

---

## 📜 License

This project is licensed under the [MIT License](LICENSE) — free for educational, personal, and open-source usage.
