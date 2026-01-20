# Sandbox Backend Module
This directory contains the core logic for the Cybersecurity Sandbox, implemented using **FastAPI**.

## Directory Structure
The codebase follows a "Clean Architecture" approach to separate concerns and ensure scalability.

```text
backend/
├── alembic/            # Database Migrations (Schema version control)
├── app/
│   ├── api/            # REST API Endpoints (Routes)
│   │   └── v1/         # Versioning folder
│   ├── core/           # application-wide configuration
│   │   ├── config.py   # Settings (Env vars)
│   │   └── security.py # Auth utilities (JWT, Hashing)
│   ├── db/             # Database connectivity
│   │   ├── base.py     # SQL Alchemy Base class
│   │   └── session.py  # Async Session creation
│   ├── models/         # Database Models (The "Entities")
│   ├── schemas/        # Pydantic Models (Data Transfer Objects)
│   ├── services/       # Business Logic & External Integrations (MinIO, Celery)
│   └── workers/        # Background Task definitions (Celery Workers)
├── requirements.txt    # Python Dependencies
└── main.py             # Application Entry Point
```

## Setup & installation
1. **Infrastructure**:
   Run the supporting services using Docker Compose from the root directory:
   ```bash
   docker-compose up -d
   ```

2. **Python Environment**:
   It is recommended to use a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Running the App**:
   ```bash
   uvicorn app.main:app --reload
   ```
   The API will be available at `http://localhost:8000`.
   Automatic Documentation: `http://localhost:8000/docs`.

## Key Technologies
- **FastAPI**: Chosen for its high performance (Async I/O) and automatic OpenAPI generation.
- **SQLAlchemy 2.0 (Async)**: For robust database interactions.
- **Celery + Redis**: For handling long-running malware analysis tasks asynchronously.
- **MinIO**: For secure storage of malware binaries.
