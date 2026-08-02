# Cybersecurity Sandbox Environment: Project Architecture & File Overview

The Cybersecurity Sandbox is a microservices-based application. The primary goal of the system is to take user-uploaded files, queue them, and safely analyze them using three different engines (Static, Dynamic, and AI) to determine if they are malicious, suspicious, or benign.

Here is a broad breakdown of the system architecture and a file-by-file explanation of the project.

---

## 1. High-Level Architecture

The architecture is split into a **Frontend** and a **Backend**.
- **Frontend**: A React application (built with Vite) that provides a user interface for analysts to log in, upload files, view analysis status, and read detailed reports.
- **Backend**: A Python FastAPI application that provides REST endpoints. Because malware analysis takes time (especially dynamic execution in a VM), the API doesn't do the heavy lifting synchronously. Instead, it uploads the file to an S3-compatible storage system (**MinIO**), saves a record to a **PostgreSQL** database, and places a job on a **Redis** queue.
- **Worker**: A background process running **Celery** picks up jobs from the Redis queue. It downloads the file from MinIO and runs the analysis engines.

---

## 2. Root Directory Files

The root directory contains infrastructure configuration and testing scripts to validate the system.

- **`docker-compose.yml`**: Defines the infrastructure containers required to run the project locally (PostgreSQL for the database, Redis for the task queue, and MinIO for object storage).
- **`README.md`**: The main project documentation outlining the 18 specific test cases and overall requirements.
- **`start_dev.ps1` & `stop_dev.ps1`**: PowerShell scripts to easily spin up (and shut down) the backend server, the celery worker, and the frontend dashboard on a Windows development machine.
- **`verify_*.py` Scripts**: (e.g., `verify_e2e_pipeline.py`, `verify_static_analysis.py`). These are automated integration tests written to ensure the backend correctly parses files, computes heuristic scores, and that the API is functioning properly.
- **`*.bat` Files**: (e.g., `Malicious.bat`, `Benign.bat`). These are dummy payload scripts used to test the Sandbox's capabilities (e.g., simulating process injection or benign behavior) to verify the analyzer logic correctly flags them.

---

## 3. Backend (`backend/app/`)

This directory houses the core Python API and Analysis Engines.

### API & Routing (`backend/app/api/`)
This module handles HTTP requests from the frontend.
- **`api.py`**: Combines all the individual routers (auth, submissions) into a single API router.
- **`deps.py`**: Contains "Dependencies" for FastAPI, primarily used to get the current database session or authenticate the current user from a JWT token before allowing access to an endpoint.
- **`v1/auth.py`**: Endpoints for user registration and login.
- **`v1/submissions.py`**: Endpoints for uploading files, listing past submissions, and retrieving the final analysis reports.
- **`v1/admin.py` & `v1/audit.py`**: Endpoints restricted to administrators for managing the system and viewing audit logs.

### Core Configuration & Security (`backend/app/core/`)
- **`config.py`**: Loads environment variables and secrets (like database URLs, Redis URIs, and JWT secret keys).
- **`security.py`**: Contains the cryptography logic for the application—specifically, hashing passwords securely (using Argon2) and generating JSON Web Tokens (JWT) for authentication.

### Analysis Engines (`backend/app/core/analysis/`)
This is the "brain" of the sandbox, containing the logic for the 18 test specifications.
- **`base.py`**: Defines an abstract `AnalysisEngine` base class to ensure all analyzers share a standard interface.
- **`static_analyzer.py`**: Analyzes files without running them. It computes file hashes (MD5, SHA256), parses Windows Executable headers (PE files) to look for anomalies, checks for suspicious API imports (like `VirtualAlloc`), computes Shannon Entropy to detect packed files, checks digital signatures, and runs YARA rules. It also calculates the final "Heuristic Score".
- **`dynamic_analyzer.py`**: Orchestrates VirtualBox. It restores a clean VM snapshot, injects the uploaded file along with a Python guest agent into the VM, executes it, and retrieves the logs. It also has a smart simulation fallback if VirtualBox is not installed.
- **`ai_analyzer.py`**: Loads a deep learning neural network (MalConv) built in PyTorch to evaluate the raw bytes of the file and generate an AI threat score indicating zero-day threats.
- **`agent.py`**: The script that is actually injected *into* the VirtualBox VM. It runs alongside the malware to monitor system calls, registry changes, and network activity, passing the data back to `dynamic_analyzer.py`.

### Database & Data Models (`backend/app/db/` & `backend/app/models/`)
- **`db/session.py`**: Establishes the asynchronous connection to the PostgreSQL database using SQLAlchemy.
- **`db/repository.py`**: Contains helper functions to query, insert, and update database records.
- **`models/models.py`**: Defines the actual SQL tables (Users, Submissions, Reports, AuditLogs) and their relationships.

### Data Validation (`backend/app/schemas/`)
- **`schemas.py`**: Contains Pydantic models. These ensure that the JSON data sent to (and returned by) the API is strictly typed and formatted correctly.

### External Services (`backend/app/services/`)
- **`storage.py`**: Contains the logic to interface with the MinIO (S3) bucket, providing functions to securely save uploaded binaries and retrieve them later for analysis.

### Execution Flow
- **`main.py`**: The entry point for the FastAPI application. It wires the database, API routers, and configuration together.
- **`worker.py`**: The Celery background task worker. When `submissions.py` receives a file, it drops a message in Redis. `worker.py` listens to Redis, downloads the file from MinIO, sequentially runs the Static, Dynamic, and AI analyzers, consolidates their findings, and updates the database with the final report.

---

## 4. Frontend (`frontend/`)

A single-page React application that communicates with the backend API.

- **`package.json` / `vite.config.ts` / `tailwind.config.js`**: Configuration files for managing dependencies, the Vite build system, and the Tailwind CSS styling framework.
- **`src/main.tsx` & `src/App.tsx`**: The entry points of the React application where routing (React Router) is typically set up.
- **`src/api/`**: Contains Axios interceptors and wrapper functions to easily make HTTP requests to the backend (e.g., automatically attaching the JWT token to requests).
- **`src/context/`**: Contains React Context providers, usually for managing global state like the currently logged-in user's session.
- **`src/pages/`**: Contains the full-page views:
  - e.g., `Login.tsx` (for authenticating)
  - e.g., `Dashboard.tsx` (for uploading files and seeing a list of past submissions)
  - e.g., `Report.tsx` (for viewing the detailed charts and MITRE ATT&CK mappings of an analyzed file).
- **`src/components/`**: Reusable UI elements used to build the pages (e.g., buttons, navigation bars, stat cards).
