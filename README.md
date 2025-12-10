# IDS Machine Learning Experiment Platform

A full-stack web application for running, managing, and comparing machine learning experiments for Intrusion Detection Systems (IDS). The platform implements multiple state-of-the-art IDS frameworks including LCCDE, MTH-IDS, and Tree-Based IDS.

## Features

- **Multiple IDS Frameworks**: Run experiments using LCCDE, MTH-IDS, or Tree-Based IDS methodologies
- **Web-Based Interface**: Configure and run experiments through an intuitive React UI
- **Experiment Management**: Create, run, view, rerun, and delete experiments
- **Comparison Tools**: Compare multiple experiments side-by-side with visual charts
- **Detailed Metrics**: View accuracy, precision, recall, F1 scores, confusion matrices, and per-attack-type performance
- **User Authentication**: Secure access with Supabase Auth and row-level security

## Architecture

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TailwindCSS, Recharts |
| Backend | Python Flask REST API |
| Database | Supabase (PostgreSQL with RLS) |
| ML Libraries | LightGBM, XGBoost, CatBoost, scikit-learn |

## Supported IDS Frameworks

### 1. LCCDE (Leader Class and Confidence Decision Ensemble)
An ensemble method that trains LightGBM, XGBoost, and CatBoost, then uses confidence-based decision making where each model becomes the "leader" for attack classes it performs best on.

> Based on: L. Yang, A. Shami, G. Stevens, and S. DeRusett, "LCCDE: A Decision-Based Ensemble Framework for Intrusion Detection in The Internet of Vehicles," IEEE GLOBECOM 2022

### 2. MTH-IDS (Multi-Tiered Hybrid Intrusion Detection System)
A multi-tiered approach using Decision Trees, Random Forest, Extra Trees, and XGBoost with feature selection and stacking ensemble techniques.

> Based on: Multi-Tiered Hybrid Intrusion Detection System (IoT Journal)

### 3. Tree-Based IDS
Uses feature importance averaging across multiple tree-based models (Decision Tree, Random Forest, Extra Trees, XGBoost) with stacking for final predictions.

> Based on: Tree-based Intelligent Intrusion Detection System (GLOBECOM 2019)

## Datasets

The system supports the following datasets:

| Dataset | Description |
|---------|-------------|
| `CICIDS2017_sample.csv` | Standard sampled version of CICIDS2017 |
| `CICIDS2017_sample_km.csv` | K-means sampled version of CICIDS2017 |
| `IoT_2020_multi_0.05.csv` | IoT network traffic dataset |

### Attack Types (CICIDS2017)

| Label | Attack Type |
|-------|-------------|
| 0 | BENIGN |
| 1 | Bot |
| 2 | BruteForce |
| 3 | DoS |
| 4 | Infiltration |
| 5 | PortScan |
| 6 | WebAttack |

## Installation

### Prerequisites
- Python 3.9+
- Node.js 18+
- Supabase account

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp ../.env.example .env
# Edit .env with your Supabase credentials:
# - SUPABASE_URL
# - SUPABASE_KEY
# - SUPABASE_SERVICE_ROLE_KEY

# Run the server
python app.py
```

The backend runs on `http://localhost:5001`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY

# Run development server
npm run dev
```

The frontend runs on `http://localhost:3000`

## Usage

### Creating an Experiment

1. Sign up or log in
2. Click "Create New Experiment"
3. Configure:
   - **Name & Description**
   - **Framework**: LCCDE, MTH-IDS, or Tree-Based
   - **Dataset**: Select from available datasets
   - **Train/Test Split**: Configure data split ratio
   - **SMOTE**: Enable/configure for class imbalance handling
   - **Model Parameters**: Customize hyperparameters (optional)
4. Click "Create Experiment"

### Running an Experiment

1. Navigate to experiment details
2. Click "Run Experiment"
3. Monitor progress - results appear when complete

### Comparing Experiments

1. From dashboard, select experiments to compare
2. Navigate to comparison view
3. View side-by-side:
   - Performance metrics charts
   - Configuration differences
   - Per-model results

## API Reference

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/verify` | GET | Verify auth token |

### Experiments
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/experiments` | GET | List user's experiments |
| `/api/experiments` | POST | Create experiment |
| `/api/experiments/:id` | GET | Get experiment details |
| `/api/experiments/:id/run` | POST | Run experiment |
| `/api/experiments/:id` | DELETE | Delete experiment |
| `/api/experiments/compare` | POST | Compare experiments |

### Utility
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/datasets` | GET | List datasets |
| `/api/experiments/attack-types` | GET | Get attack types |

## Project Structure

```
idssystem/
├── backend/
│   ├── app.py                 # Flask entry point
│   ├── routes.py              # API route handlers
│   ├── config.py              # Configuration
│   ├── supabase_client.py     # Database client
│   ├── ml_engine.py           # ML experiment runner
│   ├── lccde_engine.py        # LCCDE implementation
│   ├── mth_engine.py          # MTH-IDS implementation
│   ├── tree_based_engine.py   # Tree-Based IDS implementation
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/          # Authentication UI
│   │   │   ├── Dashboard/     # Main dashboard
│   │   │   ├── Experiments/   # Experiment management
│   │   │   └── Layout/        # Navigation & layout
│   │   ├── contexts/          # React context (Auth)
│   │   ├── lib/               # Utilities (Supabase client)
│   │   ├── App.jsx            # Main app component
│   │   └── main.jsx           # Entry point
│   ├── package.json
│   └── vite.config.js
├── Intrusion-Detection-System-Using-Machine-Learning-main/
│   ├── data/                  # Dataset files
│   ├── Figures/               # Architecture diagrams
│   └── *.ipynb                # Original research notebooks
└── README.md
```

## ML Models Used

| Framework | Models |
|-----------|--------|
| LCCDE | LightGBM, XGBoost, CatBoost |
| MTH-IDS | Decision Tree, Random Forest, Extra Trees, XGBoost |
| Tree-Based | Decision Tree, Random Forest, Extra Trees, XGBoost |

## Troubleshooting

### Backend
- **Import errors**: Run `pip install -r requirements.txt`
- **Supabase errors**: Verify `.env` credentials
- **Dataset not found**: Check dataset path in config

### Frontend
- **Build errors**: Delete `node_modules`, run `npm install`
- **Auth errors**: Verify Supabase credentials in `.env`
- **CORS errors**: Ensure backend CORS_ORIGINS includes frontend URL

## References

- LCCDE Paper: L. Yang, A. Shami, G. Stevens, S. DeRusett (2022)
- CICIDS2017 Dataset: Canadian Institute for Cybersecurity
- MTH-IDS: IoT Journal Publication
- Tree-Based IDS: GLOBECOM 2019

## License

This project is for educational and research purposes. See the referenced papers for original research licensing.
