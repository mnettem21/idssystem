# Project Structure

## Overview

```
idssystem/
├── backend/              # Flask API Server
│   ├── app.py           # Main Flask application
│   ├── config.py        # Configuration management
│   ├── requirements.txt # Python dependencies
│   │
│   ├── ml_engine/       # Machine Learning Algorithms
│   │   ├── lccde_algorithm.py    # LCCDE implementation
│   │   └── detection_engine.py  # Detection engine wrapper
│   │
│   ├── routes/          # API Routes
│   │   ├── auth.py              # Authentication endpoints
│   │   ├── datasets.py          # Dataset management
│   │   ├── experiments.py       # Experiment management
│   │   ├── results.py           # Result retrieval
│   │   └── comparisons.py       # Comparison features
│   │
│   ├── services/        # Business Logic Services
│   │   ├── database.py         # Database operations
│   │   └── supabase_auth.py    # Supabase authentication
│   │
│   └── scripts/         # Utility Scripts
│       └── seed_datasets.py    # Dataset seeding script
│
├── frontend/            # React Frontend
│   ├── public/          # Static files
│   │   └── index.html
│   │
│   └── src/
│       ├── App.js       # Main app component
│       ├── index.js     # Entry point
│       │
│       ├── pages/       # Page Components
│       │   ├── Login.js              # Login/Signup
│       │   ├── Dashboard.js          # Main dashboard
│       │   ├── Experiments.js       # Experiment list
│       │   ├── NewExperiment.js     # Create experiment
│       │   ├── ExperimentDetail.js  # Experiment details
│       │   └── Comparisons.js       # Comparison view
│       │
│       ├── components/   # Reusable Components
│       │   ├── Navbar.js    # Navigation bar
│       │   └── Navbar.css
│       │
│       └── contexts/    # React Contexts
│           └── AuthContext.js  # Authentication context
│
├── Intrusion-Detection-System-Using-Machine-Learning-main/
│   └── data/            # Dataset files (reference)
│
└── Documentation
    ├── README.md          # Main documentation
    ├── SETUP.md           # Detailed setup guide
    ├── QUICK_START.md     # Quick start guide
    └── PROJECT_STRUCTURE.md  # This file
```

## Component Description

### Backend (Flask)

**app.py**: Main Flask application with route registration and configuration

**ml_engine/**: Core ML algorithm implementations
- `lccde_algorithm.py`: Complete LCCDE algorithm extracted from Jupyter notebook
- `detection_engine.py`: Wrapper to run different algorithms

**routes/**: REST API endpoints
- Authentication, CRUD operations for experiments, datasets, results, comparisons

**services/**: Business logic layer
- Database interactions via Supabase
- Authentication verification

### Frontend (React)

**pages/**: Main application views
- Authentication and navigation
- Experiment creation and management
- Results visualization
- Comparison tools

**components/**: Reusable UI components
- Navigation, forms, tables

**contexts/**: Global state management
- Authentication state

## Database Schema

### Supabase Tables

**datasets**: Available ML datasets
- id, name, description, file_path, feature_count, sample_count

**experiments**: Experiment configurations
- id, user_id, name, description, dataset_id, algorithm, parameters, status, timestamps

**experiment_results**: Detailed results
- id, experiment_id, accuracy, precision, recall, f1 scores, confusion_matrix, execution_time

**comparisons**: Experiment comparisons
- id, user_id, baseline_experiment_id, comparison_experiment_id, comparison_metrics

## Data Flow

1. **User creates experiment** → Frontend sends request to Backend
2. **Backend validates** → Checks auth and creates experiment record
3. **Experiment queued** → Added to background processing queue
4. **Background worker** → Picks up experiment and runs algorithm
5. **Algorithm executes** → LCCDE runs on selected dataset
6. **Results stored** → Metrics saved to database
7. **User views results** → Frontend displays metrics and visualizations

## Key Features

- **Authentication**: Supabase Auth with JWT tokens
- **Background Processing**: Queue-based experiment execution
- **Results Storage**: Comprehensive metrics tracking
- **Comparison Tools**: Side-by-side experiment comparison
- **Parameter Optimization**: Easy parameter modification and re-running
- **Historical Tracking**: Timestamped results for trend analysis

## Extension Points

To add new algorithms:
1. Implement in `ml_engine/` directory
2. Update `detection_engine.py` to support new algorithm
3. Add algorithm option in frontend

To add new datasets:
1. Place dataset file in appropriate location
2. Run seed script or use API
3. Update dataset list in frontend

