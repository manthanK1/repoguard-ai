# 16th May 2026
# RepoGuard AI — Development Log

## Project Overview

RepoGuard AI is an AI-powered Change Risk Intelligence Platform built for the IBM BOB Hackathon.

The platform analyzes repository changes and predicts downstream deployment risks using IBM Bob repository intelligence.

Core objectives:
- Analyze pull request impact
- Predict affected modules/files
- Generate deployment risk scores
- Visualize dependency blast radius
- Identify missing test coverage

---

# Day 1 — Initial Setup

## GitHub Repository Created

Repository initialized:
- repoguard-ai

Git workflow established for project version control.

---

# Frontend Setup

## Stack
- React
- Vite
- Tailwind CSS
- Axios
- React Flow
- Framer Motion

## Actions Completed

### Created frontend application

## Folder Structure
 
```
backend/
└── app/
    ├── main.py
    ├── routes/
    ├── services/
    └── utils/
```
 
---
 
## First API Endpoint
 
**File:** `backend/app/routes/analyze.py`
 
### Mocked `/analyze` Response
 
Returns:
- Risk score
- Risk level
- Impacted files
- Missing tests
- AI summary
**Purpose:** Establish frontend/backend communication and enable rapid UI development before IBM Watson integration.
 
---
 
## Backend Server
 
| | |
|---|---|
| Server | `http://127.0.0.1:8001` |
| Swagger Docs | `http://127.0.0.1:8001/docs` |
 
---
 
## Frontend ↔ Backend Communication
 
React frontend calls `POST /analyze` via Axios. Returned JSON renders dynamically in the dashboard UI.
 
---
 
## Current Architecture
 
```
Frontend (React)
      ↓
FastAPI Backend
      ↓
Analyze Route
      ↓
Mock Risk Engine
      ↓
JSON Response
```
 
---
 
## Feature Status
 
| Feature | Status |
|---|---|
| React frontend | ✅ Working |
| FastAPI backend | ✅ Working |
| API communication | ✅ Working |
| Mock AI response | ✅ Working |
| Dynamic dashboard rendering | ✅ Working |
| Tailwind UI modernization | 🔄 In Progress |
| Risk visualization cards | 🔄 In Progress |
| Blast radius graph | 🔄 In Progress |
| IBM Watson integration | ⏳ Pending |
| Repository parsing engine | ⏳ Pending |
 
---
 
## Project Status
 
| Layer | Status |
|---|---|
| Backend | ✅ Working |
| Frontend | ✅ Working |
| API Layer | ✅ Working |
| AI Integration | ⏳ Pending |
| Visualization Layer | 🔄 In Progress |
 
---
 
## Immediate Next Goals
 
1. Improve dashboard UI
2. Add Tailwind styling
3. Implement dependency graph visualization
4. Build repository cloning service
5. Add repository parser
6. Integrate IBM Watson
7. Generate real AI-powered analysis
---
 
## Technical Notes
 
### VS Code Interpreter Fix
Selected correct Python venv interpreter — resolves FastAPI import warnings and dependency inconsistencies.
 
### Windows Port Conflict
Port 8000 was occupied; server moved to port 8001.
 
---
 
## Hackathon Strategy
 
**Focus:**
- Stable MVP
- Strong demo quality
- Enterprise AI positioning
- Visual clarity
- Fast execution
**Avoiding:**
- Overengineering
- Unnecessary infrastructure
- Auth systems
- Complex DevOps pipelines
- Premature optimization