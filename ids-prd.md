# IDS-ML Development Environment - Product Requirements Document
## 10-Week Development Plan

### Executive Summary
Development of a web-based Intrusion Detection System (IDS) development environment built on the open-source IDS-ML framework from Western-OC2-Lab. The system will provide researchers with an intuitive interface to develop, train, evaluate, and deploy machine learning models for network intrusion detection.

### Project Overview
- **Duration**: 10 weeks
- **Team Size**: 3-5 developers
- **Technology Stack**:
  - Backend: Python, FastAPI
  - Frontend: React
  - Database: Supabase (PostgreSQL)
  - ML Framework: IDS-ML (existing)
  - Infrastructure: Docker, potentially cloud deployment

### Core Objectives
1. Develop web-based UI for IDS-ML framework interaction
2. Implement database backend for storing parameters, results, and model configurations
3. Validate LCCDE paper (2022) findings
4. Stretch goal: Enhance existing ML algorithms

---

## Week 1-2: Foundation & Planning

### Week 1: Project Setup & Architecture Design
**Objectives:**
- Complete environment setup and team onboarding
- Finalize system architecture
- Set up development infrastructure

**Deliverables:**
- System architecture document
- Development environment setup guide
- Git repository with initial project structure
- Docker configuration files

**Technical Tasks:**
- Initialize FastAPI backend structure
- Create React frontend boilerplate
- Configure Supabase project and schema design
- Set up CI/CD pipeline basics
- Install and test IDS-ML framework dependencies

**Database Schema (Initial):**
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Models table
CREATE TABLE models (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  model_type VARCHAR NOT NULL,
  parameters JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Training_runs table
CREATE TABLE training_runs (
  id UUID PRIMARY KEY,
  model_id UUID REFERENCES models(id),
  status VARCHAR,
  metrics JSONB,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

### Week 2: Core Backend Infrastructure
**Objectives:**
- Implement core FastAPI endpoints
- Integrate IDS-ML framework with API
- Set up authentication system

**Deliverables:**
- RESTful API with basic CRUD operations
- Authentication middleware
- API documentation (Swagger/OpenAPI)

**API Endpoints (Initial):**
```python
# Core endpoints structure
/api/v1/auth/login
/api/v1/auth/register
/api/v1/projects
/api/v1/models
/api/v1/datasets
/api/v1/training/start
/api/v1/training/status/{run_id}
/api/v1/results/{run_id}
```

---

## Week 3-4: Frontend Development & Data Management

### Week 3: React Frontend Foundation
**Objectives:**
- Build core React components
- Implement routing and navigation
- Create authentication flow

**Deliverables:**
- Login/Registration pages
- Dashboard layout
- Project management interface
- Component library setup (Material-UI or Ant Design)

**Key Components:**
- AuthProvider (context for authentication)
- ProjectList & ProjectDetail
- ModelConfiguration
- DatasetUploader
- TrainingMonitor

### Week 4: Data Pipeline Implementation
**Objectives:**
- Implement dataset upload functionality
- Create data preprocessing pipeline
- Build dataset visualization tools

**Deliverables:**
- File upload system (CSV, PCAP formats)
- Data validation and preprocessing
- Dataset statistics dashboard
- Feature selection interface

**Technical Requirements:**
- Support for CICIDS2017 dataset format
- Real-time data validation
- Batch processing capabilities
- Data transformation options

---

## Week 5-6: ML Integration & Model Management

### Week 5: IDS-ML Framework Integration
**Objectives:**
- Integrate Tree-based IDS
- Implement LCCDE framework
- Set up MTH-IDS capabilities

**Deliverables:**
- Model selection interface
- Hyperparameter configuration UI
- Training job scheduler
- Model versioning system

**Supported Models:**
- Decision Tree (DT)
- Random Forest (RF)
- Extra Trees (ET)
- XGBoost
- LightGBM
- CatBoost
- Ensemble methods (Stacking, Voting)

### Week 6: Training & Evaluation System
**Objectives:**
- Implement training pipeline
- Build real-time monitoring
- Create evaluation metrics dashboard

**Deliverables:**
- Training progress visualization
- Real-time metrics updates (WebSocket)
- Model comparison tools
- Confusion matrix visualization
- ROC curves and performance metrics

**Metrics to Track:**
- Accuracy
- Precision
- Recall
- F1-Score
- Training time
- Inference time
- False positive/negative rates

---

## Week 7-8: Advanced Features & Optimization

### Week 7: Hyperparameter Optimization
**Objectives:**
- Implement Bayesian Optimization
- Add Grid Search and Random Search
- Create HPO visualization tools

**Deliverables:**
- HPO configuration interface
- Optimization progress tracking
- Best parameters recommendation
- HPO history and comparison

**HPO Methods:**
- Bayesian Optimization (scikit-optimize)
- Grid Search
- Random Search
- Optuna integration (stretch goal)

### Week 8: Results Analysis & Reporting
**Objectives:**
- Build comprehensive results dashboard
- Implement model export functionality
- Create report generation system

**Deliverables:**
- Interactive results visualization
- Model export (pickle, ONNX)
- PDF report generation
- Results comparison across runs
- LCCDE paper validation results

**Report Contents:**
- Model performance summary
- Feature importance analysis
- Attack type detection rates
- Comparative analysis
- Recommendations

---

## Week 9-10: Testing, Deployment & Documentation

### Week 9: Testing & Quality Assurance
**Objectives:**
- Comprehensive testing coverage
- Performance optimization
- Security assessment

**Deliverables:**
- Unit tests (>80% coverage)
- Integration tests
- E2E tests (Cypress/Playwright)
- Performance benchmarks
- Security audit report

**Testing Focus Areas:**
- API endpoint validation
- ML pipeline integrity
- Data processing accuracy
- UI/UX testing
- Load testing

### Week 10: Deployment & Documentation
**Objectives:**
- Production deployment setup
- Complete documentation
- Knowledge transfer

**Deliverables:**
- Docker Compose configuration
- Kubernetes manifests (optional)
- User documentation
- API documentation
- Deployment guide
- Video tutorials

**Documentation Sections:**
- Installation guide
- User manual
- API reference
- ML model documentation
- Troubleshooting guide
- Best practices

---

## Technical Specifications

### Backend (FastAPI)
```python
# Project structure
ids-ml-backend/
├── app/
│   ├── api/
│   │   ├── endpoints/
│   │   ├── dependencies.py
│   │   └── middleware.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── ml_engine.py
│   ├── models/
│   ├── schemas/
│   └── services/
├── tests/
├── requirements.txt
└── Dockerfile
```

### Frontend (React)
```javascript
// Project structure
ids-ml-frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── context/
│   ├── utils/
│   └── styles/
├── public/
├── package.json
└── Dockerfile
```

### Database Schema (Complete)
```sql
-- Extended schema
CREATE TABLE datasets (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  name VARCHAR NOT NULL,
  file_path VARCHAR,
  size_mb FLOAT,
  features INTEGER,
  samples INTEGER,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE experiments (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  name VARCHAR NOT NULL,
  description TEXT,
  config JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE predictions (
  id UUID PRIMARY KEY,
  model_id UUID REFERENCES models(id),
  input_data JSONB,
  prediction JSONB,
  confidence FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Risk Management

### Technical Risks
1. **IDS-ML Framework Integration Complexity**
   - Mitigation: Allocate extra time in Week 5 for integration
   - Fallback: Use simplified wrapper if needed

2. **Real-time Training Monitoring**
   - Mitigation: Implement WebSocket carefully with fallback to polling
   - Fallback: Batch updates every 5 seconds

3. **Large Dataset Handling**
   - Mitigation: Implement streaming and pagination
   - Fallback: Set file size limits initially

### Schedule Risks
1. **ML Algorithm Enhancement (Stretch Goal)**
   - Only attempt if core features completed by Week 8
   - Can be deferred to post-launch update

2. **LCCDE Validation**
   - Priority task - must be completed by Week 8
   - Allocate dedicated resources if behind schedule

---

## Success Metrics

### Technical Metrics
- API response time < 200ms for 95% of requests
- Model training completion rate > 95%
- System uptime > 99.5%
- Page load time < 2 seconds

### User Metrics
- Successfully train and evaluate at least 5 different model types
- Generate comprehensive reports for all experiments
- Support concurrent users (minimum 10)

### Business Metrics
- Complete core features by Week 8
- Achieve 80% test coverage
- Documentation completion 100%
- LCCDE paper validation completed

---

## Team Responsibilities

### Backend Developer (1-2 people)
- FastAPI implementation
- IDS-ML integration
- Database design
- API documentation

### Frontend Developer (1-2 people)
- React components
- UI/UX implementation
- State management
- Visualization tools

### ML Engineer (1 person)
- Model integration
- HPO implementation
- Performance optimization
- LCCDE validation

### DevOps (Part-time or shared)
- CI/CD pipeline
- Docker/Kubernetes setup
- Deployment configuration
- Monitoring setup

---

## Post-Launch Roadmap

### Version 1.1 (Weeks 11-12)
- User feedback incorporation
- Performance optimizations
- Additional visualization options
- Bug fixes

### Version 2.0 (Future)
- Multi-user collaboration features
- Cloud-based training options
- AutoML integration
- Real-time network monitoring integration
- Mobile application

---

## Appendices

### A. Technology Versions
- Python: 3.9+
- FastAPI: 0.100+
- React: 18.0+
- Supabase Client: Latest
- scikit-learn: 1.3+
- XGBoost: 1.7+
- LightGBM: 3.3+
- CatBoost: 1.2+

### B. Development Tools
- VS Code or PyCharm
- Postman for API testing
- Docker Desktop
- Git/GitHub
- Jira or Linear for project management

### C. References
- IDS-ML GitHub: https://github.com/Western-OC2-Lab/Intrusion-Detection-System-Using-Machine-Learning
- LCCDE Paper (2022)
- FastAPI Documentation
- React Documentation
- Supabase Documentation

---

## Approval & Sign-off

**Project Sponsor**: _________________  
**Technical Lead**: _________________  
**Date**: _________________  

---

*This PRD is a living document and will be updated as requirements evolve during the development process.*