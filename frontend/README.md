# Sandbox Frontend Dashboard

The frontend is a modern single-page application built with React, Vite, and Tailwind CSS. It provides a visual interface for analysts to submit files and review comprehensive analysis reports.

## 🎨 Technology Stack

*   **Framework**: React 18 + TypeScript
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS
*   **Routing**: React Router DOM
*   **Data Visualization**: Chart.js + react-chartjs-2
*   **Icons**: Lucide React
*   **HTTP Client**: Axios

## ⚙️ Setup Instructions

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
The dashboard will be available at `http://localhost:5173`.

## 📁 Key Components

*   `Dashboard.tsx`: Main interface containing the upload dropzone and recent submissions table.
*   `VisualReport.tsx`: Detailed view for a single submission. Renders the static, dynamic, and AI analysis data into readable charts and tables, including the 18 specific test status blocks.
*   `AuthContext.tsx`: Manages JWT tokens, login state, and role-based access control (RBAC).

## 📥 Features

- **Drag & Drop Uploads**: Submit suspicious files directly via the UI.
- **Real-time Status**: View processing queue status (Queued, Processing, Completed, Failed).
- **Comprehensive Reporting**: View breakdown of Heuristic scores, AI threat probability, Network C2 connections, Process Trees, and MITRE ATT&CK techniques.
- **Export Capabilities**: Export extracted Indicators of Compromise (IOCs) as JSON or download the full visual report as a PDF.
