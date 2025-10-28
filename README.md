# IDS Machine Learning Experiment System

A full-stack web application for running and managing machine learning experiments for Intrusion Detection Systems (IDS) using the LCCDE (Leader Class and Confidence Decision Ensemble) framework.

## Project Overview

This system allows researchers to:
- Configure and run IDS machine learning experiments through a web interface
- Adjust model parameters and experiment configurations
- Track experiment results and metrics
- Compare multiple experiments side-by-side
- Rerun past experiments with different parameters

The system implements the LCCDE ensemble method from the paper:
> L. Yang, A. Shami, G. Stevens, and S. DeRusett, "LCCDE: A Decision-Based Ensemble Framework for Intrusion Detection in The Internet of Vehicles," in 2022 IEEE Global Communications Conference (GLOBECOM), 2022, pp. 1-6.

## Architecture

- **Frontend**: React with Vite, TailwindCSS, and Recharts for visualization
- **Backend**: Python Flask REST API
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **ML Models**: LightGBM, XGBoost, CatBoost, and LCCDE ensemble
- **Dataset**: CICIDS2017 (sampled versions included)

## Features

### Experiment Management
- Create experiments with configurable parameters
- Run experiments asynchronously
- View detailed results including:
  - Accuracy, Precision, Recall, F1 Score
  - Per-attack-type F1 scores
  - Confusion matrices
  - Training times
- Delete experiments

### Model Configuration
- Train/test split ratio
- Random state for reproducibility
- SMOTE configuration for class imbalance
- Custom hyperparameters for each model (LightGBM, XGBoost, CatBoost)

### Experiment Comparison
- Compare multiple experiments side-by-side
- Visual performance comparison charts
- Configuration comparison tables

### Authentication & Security
- User authentication via Supabase Auth
- Row-level security (RLS) policies
- Users can only access their own experiments

## Installation

### Prerequisites
- Python 3.9+
- Node.js 18+
- Supabase account
- Git

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
```bash
cp ../.env.example .env
```

Edit `.env` and add your Supabase credentials:
- Get `SUPABASE_URL` and `SUPABASE_KEY` from your Supabase project settings
- Get `SUPABASE_SERVICE_ROLE_KEY` from Supabase project API settings (keep this secret!)

5. Run the Flask backend:
```bash
python app.py
```

The backend will run on `http://localhost:5001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon/public key

4. Run the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

### Database Setup

The database schema is already created via Supabase MCP. If you need to recreate it:

1. The migration includes:
   - `experiments` table - stores experiment configurations
   - `experiment_results` table - stores model results
   - `attack_types` table - lookup table for attack classifications
   - Row Level Security (RLS) policies for user data isolation

2. The schema is automatically applied when you first connected Supabase MCP.

## Usage

### Creating an Experiment

1. Sign up or log in to the application
2. Click "Create New Experiment" from the dashboard
3. Configure your experiment:
   - **Basic Information**: Name, description, dataset selection
   - **Data Split**: Train/test ratio, random state
   - **SMOTE**: Enable/disable and configure sampling strategy
   - **Model Parameters**: Custom hyperparameters for each model (optional)
4. Click "Create Experiment"

### Running an Experiment

1. Navigate to the experiment details page
2. Click "Run Experiment"
3. The experiment will run in the background
4. Results will appear once the experiment completes

### Comparing Experiments

1. From the dashboard, note the experiment IDs you want to compare
2. Navigate to `/experiments/compare?ids=id1,id2,id3`
3. View side-by-side comparisons of:
   - Performance metrics
   - Configurations
   - Visual charts

## API Endpoints

### Authentication
- `GET /api/auth/verify` - Verify authentication token

### Experiments
- `GET /api/experiments` - List all experiments for the user
- `POST /api/experiments` - Create a new experiment
- `GET /api/experiments/:id` - Get experiment details
- `POST /api/experiments/:id/run` - Run an experiment
- `DELETE /api/experiments/:id` - Delete an experiment
- `POST /api/experiments/compare` - Compare multiple experiments

### Utility
- `GET /api/health` - Health check
- `GET /api/datasets` - List available datasets
- `GET /api/experiments/attack-types` - Get attack type classifications

## Dataset Information

The system uses the CICIDS2017 dataset, which includes various types of network attacks:

| Label | Attack Type | Description |
|-------|-------------|-------------|
| 0 | BENIGN | Normal network traffic |
| 1 | Bot | Botnet traffic |
| 2 | BruteForce | Brute force attack |
| 3 | DoS | Denial of Service attack |
| 4 | Infiltration | Infiltration attack |
| 5 | PortScan | Port scanning attack |
| 6 | WebAttack | Web-based attack |

Two sampled datasets are available:
- `CICIDS2017_sample_km.csv` - K-means sampled version
- `CICIDS2017_sample.csv` - Standard sampled version

## Model Information

### Base Learners
1. **LightGBM** - Gradient boosting framework
2. **XGBoost** - Extreme gradient boosting
3. **CatBoost** - Gradient boosting with categorical features support

### Ensemble Method: LCCDE
The LCCDE (Leader Class and Confidence Decision Ensemble) method:
1. Trains all three base learners
2. Identifies the best-performing model for each attack class
3. Uses confidence-based decision making for predictions
4. Achieves superior performance compared to individual models

## Project Structure

```
idssystem/
├── backend/
│   ├── app.py                 # Flask application entry point
│   ├── config.py              # Configuration settings
│   ├── routes.py              # API route handlers
│   ├── ml_engine.py           # ML model execution engine
│   ├── supabase_client.py     # Supabase client utilities
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Auth/          # Authentication components
│   │   │   ├── Dashboard/     # Dashboard view
│   │   │   ├── Experiments/   # Experiment-related components
│   │   │   └── Layout/        # Layout components
│   │   ├── contexts/          # React contexts (Auth)
│   │   ├── lib/               # Utility libraries
│   │   ├── App.jsx            # Main app component
│   │   └── main.jsx           # App entry point
│   ├── package.json           # Node dependencies
│   └── vite.config.js         # Vite configuration
├── Intrusion-Detection-System-Using-Machine-Learning-main/
│   ├── data/                  # Dataset files
│   └── LCCDE_IDS_GlobeCom22.ipynb  # Original notebook
└── README.md
```

## Development

### Backend Development
```bash
cd backend
source venv/bin/activate
python app.py
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Building for Production

Frontend:
```bash
cd frontend
npm run build
```

## Troubleshooting

### Backend Issues
- **Import errors**: Ensure all dependencies are installed: `pip install -r requirements.txt`
- **Supabase connection errors**: Verify your `.env` file has correct credentials
- **Dataset not found**: Ensure dataset files exist in the correct path

### Frontend Issues
- **Build errors**: Delete `node_modules` and run `npm install` again
- **Authentication errors**: Verify Supabase credentials in `.env`
- **CORS errors**: Check that backend CORS_ORIGINS includes your frontend URL

## Contributing

This is a university research project. For questions or contributions, please contact the project team.

## License

This project is based on research from:
- LCCDE Paper: L. Yang, A. Shami, G. Stevens, and S. DeRusett, 2022
- CICIDS2017 Dataset: Canadian Institute for Cybersecurity

## Acknowledgments

- UTD Computer Science Department
- Original LCCDE framework authors
- Canadian Institute for Cybersecurity for the CICIDS2017 dataset
