# Sandbox Backend

The backend is built with FastAPI, SQLAlchemy (async), and Celery. It orchestrates the analysis engines and serves the REST API.

## ⚙️ Setup Instructions

### 1. Environment Preparation
Ensure PostgreSQL, Redis, and MinIO are running via Docker Compose in the project root.

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/Mac
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Environment Variables
Create a `.env` file in the `backend` directory:
```env
VT_API_KEY=your_virustotal_api_key_here
```

### 3. Database Migrations
Initialize the database schema:
```bash
alembic upgrade head
```

### 4. Running the Services

You need **two** processes running for the backend to function fully:

**Terminal 1: FastAPI Server**
```bash
uvicorn app.main:app --reload
```
API Documentation available at: `http://localhost:8000/docs`

**Terminal 2: Celery Worker**
```bash
celery -A app.worker.celery_app worker --loglevel=info --pool=solo
```
*Note: Use `--pool=solo` on Windows. On Linux/Mac, you can omit it.*

## 🧠 Analysis Engines

The backend contains three primary analysis engines located in `app/core/analysis/`:

1.  **Static Analyzer (`static_analyzer.py`)**: Computes hashes, parses PE headers, calculates Shannon entropy, and runs YARA rules. Generates a heuristic score and maps behaviors to MITRE ATT&CK.
2.  **AI Analyzer (`ai_analyzer.py`)**: Uses a PyTorch implementation of MalConv. If production weights (`weights/malconv_base.pth`) are missing, it runs an untrained model and normalizes the score to prevent false positives.
3.  **Dynamic Analyzer (`dynamic_analyzer.py`)**: Orchestrates VirtualBox via `VBoxManage`. Features a content-aware simulation fallback when VirtualBox is not available.
