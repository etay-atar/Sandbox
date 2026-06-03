# 🛡️ Cybersecurity Sandbox Environment

> An advanced, isolated environment for safe malware analysis, implementing static analysis, AI-driven threat detection, and dynamic sandboxing orchestration.

---

## 📖 Overview

The **Cybersecurity Sandbox** is a microservices-based platform designed to automate the analysis of suspicious files. It leverages a modern asynchronous architecture to handle submissions, perform static analysis (PE headers, YARA, Entropy), utilize AI models for threat scoring, and execute files within a secure, virtualized environment (VirtualBox) to capture behavioral data.

### 🚀 Key Features

*   **Secure API Interface**: RESTful API built with **FastAPI** for file submission and report retrieval.
*   **Asynchronous Processing**: Non-blocking architecture using **Celery** and **Redis** to handle heavy analysis loads.
*   **Object Storage**: S3-compatible storage (**MinIO**) for secure and scalable management of malware binaries.
*   **Robust Security**: JWT Authentication, Argon2 password hashing, and Role-Based Access Control (RBAC).
*   **Hybrid Analysis Engine**: 
    *   **Static**: Automatic hashing, PE Header anomaly detection, Import analysis, Shannon Entropy, YARA rules.
    *   **AI Inference**: Deep learning PyTorch model (MalConv architecture) for zero-day threat detection.
    *   **Dynamic**: VirtualBox VM orchestration with Python guest agents to capture network, filesystem, and process telemetry.
*   **Heuristic Scoring & MITRE ATT&CK**: Maps detected behaviors to MITRE T-Codes and generates a weighted heuristic risk score.
*   **Modern Frontend Dashboard**: React + Vite + Tailwind CSS for visualizing reports, charts, and test statuses.

---

## 🏗️ Architecture

The system follows a clean, modular architecture:

*   **Backend**: Python 3.10+ / FastAPI / SQLAlchemy (Async)
*   **Database**: PostgreSQL 15
*   **Queue**: Redis 7
*   **Storage**: MinIO
*   **Frontend**: React (TypeScript), Vite, TailwindCSS, Chart.js
*   **Infrastructure**: Docker Compose

```text
Project Root
├── backend/            # Core API and Analysis Services
│   ├── app/
│   │   ├── api/        # Endpoints
│   │   ├── core/       # Config & Security
│   │   ├── analysis/   # Static, AI, and Dynamic engines
│   │   ├── db/         # Database Layer
│   │   ├── models/     # SQL Entities
│   │   └── services/   # Storage and integrations
│   └── worker.py       # Celery background tasks
├── frontend/           # React Web Dashboard
├── docs/               # Architecture diagrams and specifications
├── docker-compose.yml  # Container Orchestration
└── README.md           # Project Documentation
```

---

## 📋 The 18 Test Specifications

This platform is specifically designed to fulfill 18 strict cybersecurity testing requirements:

### Static Analysis (Tests 1-6)
1. **Cryptographic Hashing**: Compute SHA-256 and MD5, check against VirusTotal.
2. **PE Header Anomaly Detection**: Analyze sections, entry points, and timestamps.
3. **Import Address Table (IAT)**: Flag suspicious API combinations (e.g., VirtualAlloc + WriteProcessMemory).
4. **String Extraction & Obfuscation**: YARA matching against known suspicious strings.
5. **Entropy Analysis**: Calculate Shannon Entropy to detect packers (>7.0 threshold).
6. **Digital Signature Verification**: Check Authenticode signatures.

### Dynamic Analysis (Tests 7-14)
7. **Process Injection Monitoring**: Track child processes and injection APIs.
8. **File System Heuristics**: Log dropped files and modifications.
9. **Registry Persistence Mechanisms**: Monitor HKCU/Run keys.
10. **Network Beaconing (C2)**: Log HTTP requests and DNS queries.
11. **DGA Detection**: Identify algorithmically generated domains.
12. **Mutex Creation**: Detect infection markers.
13. **Anti-Sandbox Evasion**: Detect attempts to bypass analysis.
14. **Privilege Escalation**: Monitor UAC bypass attempts.

### AI & Intelligence (Tests 15-18)
15. **Deep Learning Inference**: Run MalConv PyTorch model on raw bytes.
16. **YARA Rule Matching**: Scan against custom signature database.
17. **Heuristic Engine Score**: Combine static, dynamic, and VT factors into a 0-100 score.
18. **MITRE ATT&CK Mapping**: Map observed behaviors to T-Codes (e.g., T1055, T1059).

---

## ⚖️ Verdict Logic

The final verdict (`Malicious`, `Suspicious`, `Benign`) is determined using a hybrid weighted scoring formula:

- **Definitive Overrides**: Any positive VirusTotal hit OR matched YARA signature (excluding PE definition) forces an immediate **Malicious** verdict.
- **Weighted Score**:
  - **Static Heuristics (40%)**: Driven by anomalous PE features, missing signatures, high entropy, and suspicious imports.
  - **AI Threat Score (30%)**: Driven by the MalConv deep learning model inference.
  - **Dynamic Risk (30%)**: Driven by behavioral indicators (registry edits, process spawning, network connections).

Thresholds: `>70 = Malicious`, `>40 = Suspicious`, `<40 = Benign`.

---

## 🛠️ Getting Started

### Prerequisites

*   **Docker Desktop** (or Docker Engine + Compose)
*   **Python 3.10+** (for local development)
*   **Node.js 20+** (for frontend development)

### ⚡ Quick Start

1.  **Start Infrastructure Services**
    Launch PostgreSQL, Redis, and MinIO:
    ```bash
    docker-compose up -d
    ```

2.  **Start Services via Script (Windows)**
    Use the provided PowerShell scripts to spin up Uvicorn, Celery, and Vite simultaneously:
    ```powershell
    # Start all services
    .\start_dev.ps1
    
    # Gracefully stop all services
    .\stop_dev.ps1
    ```

### Manual Setup

See [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md) for detailed instructions on running components individually.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
