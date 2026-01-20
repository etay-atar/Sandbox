# 🛡️ Cybersecurity Sandbox Environment

> An advanced, isolated environment for safe malware analysis, implementing static analysis, AI-driven threat detection, and (future) dynamic sandboxing.

---

## 📖 Overview

The **Cybersecurity Sandbox** is a microservices-based platform designed to automate the analysis of suspicious files. It leverages a modern asynchronous architecture to handle submissions, perform static analysis (PE headers, YARA), utilize AI models for threat scoring, and execute files within a secure, virtualized environment (KVM/QEMU) to capture behavioral data.

### 🚀 Key Features

*   **Secure API Interface**: RESTful API built with **FastAPI** for file submission and report retrieval.
*   **Asynchronous Processing**: Non-blocking architecture using **Celery** and **Redis** to handle heavy analysis loads.
*   **Object Storage**: S3-compatible storage (**MinIO**) for secure and scalable management of malware binaries.
*   **Robust Security**: JWT Authentication, Argon2 password hashing, and Role-Based Access Control (RBAC).
*   **Static Analysis Engine**: 
    *   Automatic file hashing (MD5, SHA256).
    *   PE Header anomaly detection & Import analysis.
    *   YARA rule matching for known signature detection.
*   **AI Integration** (Phase 2): Pluggable architecture for MalConv/CodeBERT models to detect zero-day threats.
*   **Dynamic Sandboxing** (Phase 3): Virtual machine orchestration using KVM for full behavioral monitoring.

---

## 🏗️ Architecture

The system follows a clean, modular architecture:

*   **Backend**: Python 3.10+ / FastAPI / SQLAlchemy (Async)
*   **Database**: PostgreSQL 15
*   **Queue**: Redis 7
*   **Storage**: MinIO
*   **Infrastructure**: Docker Compose

```text
Project Root
├── backend/            # Core API and Analysis Services
│   ├── app/
│   │   ├── api/        # Endpoints
│   │   ├── core/       # Config & Security
│   │   ├── db/         # Database Layer
│   │   ├── models/     # SQL Entities
│   │   └── services/   # Analysis Logic (Storage, AI, etc.)
│   └── tests/          # Pytest Suite
├── docker-compose.yml  # Container Orchestration
└── README.md           # Project Documentation
```

---

## 🛠️ Getting Started

### Prerequisites

*   **Docker Desktop** (or Docker Engine + Compose)
*   **Python 3.10+** (for local development)

### ⚡ Quick Start

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/etay-atar/Sandbox.git
    cd Sandbox
    ```

2.  **Start Infrastructure Services**
    Launch PostgreSQL, Redis, and MinIO:
    ```bash
    docker-compose up -d
    ```

3.  **Setup Backend (Local)**
    ```bash
    cd backend
    python -m venv .venv
    # Windows
    .venv\Scripts\activate
    # Linux/Mac
    source .venv/bin/activate
    
    pip install -r requirements.txt
    ```

4.  **Run Migrations**
    Initialize the database schema:
    ```bash
    alembic upgrade head
    ```

5.  **Start the Server**
    ```bash
    uvicorn app.main:app --reload
    ```
    The API will be available at `http://localhost:8000`.
    Interactive Docs: `http://localhost:8000/docs`.

---

## 🧪 Testing

The project maintains high code quality standards with a comprehensive test suite using **pytest**.

```bash
cd backend
python -m pytest -v
```
*Current Status: 100% Pass Rate (Phase 1)*

---

## 🗺️ Roadmap

- [x] **Phase 1: Foundation**
    - [x] Microservices Architecture
    - [x] Database & Object Storage
    - [x] Authentication & Security
    - [x] API & Mock Analysis Logic

- [ ] **Phase 2: Core Analysis (In Progress)**
    - [ ] Real Static Analysis (PE, YARA)
    - [ ] AI Service Integration

- [ ] **Phase 3: Dynamic Sandboxing**
    - [ ] KVM/Libvirt Orchestration
    - [ ] Guest Agent Communication

- [ ] **Phase 4: Reporting & Polish**
    - [ ] Unified Reporting Engine
    - [ ] Admin Dashboard & IOC Extraction

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Developed by Etay Atar for Advanced Cyber Analysis.*
