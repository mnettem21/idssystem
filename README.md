# IDS Research Platform

A comprehensive research platform for Intrusion Detection System (IDS) experiments using Machine Learning algorithms. This platform provides an IDE-like environment for cybersecurity researchers to experiment with different algorithms, compare results, and track performance improvements over time.

## Features

- **Dataset Management**: Manage and select from available datasets
- **Algorithm Selection**: Run various ML algorithms including LCCDE, XGBoost, LightGBM, and CatBoost
- **Parameter Configuration**: Configure algorithm-specific parameters
- **Automated Execution**: Background processing of experiments with real-time status updates
- **Results Tracking**: Comprehensive metrics storage and visualization
- **Comparison Tools**: Compare multiple experiments to analyze performance differences
- **Authentication**: Secure user authentication via Supabase

## Architecture

The system consists of three main components:

1. **Frontend** (React): User interface for interaction and visualization
2. **Backend** (Flask): API layer for processing and coordination
3. **Detection Engine** (Python): ML algorithm execution engine

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 16+
- Supabase account
- Redis (for background task processing)

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

4. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

5. Configure your Supabase credentials in `.env`:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   JWT_SECRET_KEY=your_random_secret_key
   REDIS_URL=redis://localhost:6379/0
   UPLOAD_FOLDER=./data/uploads
   ```

6. Run the Flask server:
   ```bash
   python app.py
   ```

The backend will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. Start the development server:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

### Database Setup

The database schema is automatically created when you run the first migration. The system includes tables for:

- `datasets`: Available datasets
- `experiments`: Experiment configurations and metadata
- `experiment_results`: Detailed results and metrics
- `comparisons`: Experiment comparison data

### Seeding Datasets

To add datasets to the system, you can use the Supabase interface or the API:

```bash
# Example: Add CICIDS2017 dataset
curl -X POST http://localhost:5000/api/datasets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CICIDS2017 Sample",
    "description": "CICIDS2017 sampled dataset",
    "file_path": "data/CICIDS2017_sample_km.csv"
  }'
```

## Usage

### Creating an Experiment

1. Navigate to the "Experiments" page
2. Click "New Experiment"
3. Fill in the experiment details:
   - Name and description
   - Select a dataset
   - Choose an algorithm
   - Configure parameters (optional)
4. Click "Create Experiment"

The system will queue the experiment for processing and update the status in real-time.

### Viewing Results

1. Go to "Experiments"
2. Click on a completed experiment
3. View detailed metrics including:
   - Accuracy, Precision, Recall, F1 Score
   - Per-class F1 scores
   - Execution time
   - Confusion matrix

### Comparing Experiments

1. Open an experiment detail page
2. Click "Compare with Another Experiment"
3. Select the baseline experiment
4. View the comparison metrics showing improvements

## API Endpoints

### Authentication
- `POST /api/auth/verify` - Verify authentication token

### Datasets
- `GET /api/datasets` - List all datasets
- `GET /api/datasets/:id` - Get dataset details

### Experiments
- `GET /api/experiments` - List user's experiments
- `GET /api/experiments/:id` - Get experiment details
- `POST /api/experiments` - Create new experiment
- `DELETE /api/experiments/:id` - Delete experiment

### Results
- `GET /api/results/experiment/:id` - Get experiment results

### Comparisons
- `GET /api/comparisons` - List all comparisons
- `GET /api/comparisons/:id` - Get comparison details
- `POST /api/comparisons` - Create new comparison

## Algorithms

### LCCDE (Leader Class and Confidence Decision Ensemble)

The LCCDE algorithm is an ensemble method that:
- Trains three base learners: LightGBM, XGBoost, and CatBoost
- Identifies the best-performing model for each attack class
- Uses confidence-based decision making for predictions
- Combines predictions based on leader models and confidence scores

## File Structure

```
idssystem/
├── backend/
│   ├── app.py                 # Flask application
│   ├── config.py              # Configuration
│   ├── requirements.txt      # Python dependencies
│   ├── routes/                # API routes
│   ├── services/              # Business logic services
│   └── ml_engine/             # ML algorithm implementations
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── pages/            # React pages
│   │   ├── components/        # React components
│   │   └── contexts/          # Context providers
│   ├── package.json
│   └── package-lock.json
├── data/                      # Dataset files
└── README.md
```

## Contributing

This is a research platform. Contributions are welcome! Please ensure you:
- Follow the existing code style
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

## License

MIT License - See LICENSE file for details

## Citation

If you use this platform in your research, please cite the original papers:

1. Yang, L., Shami, A., Stevens, G., & DeRusett, S. (2022). LCCDE: A Decision-Based Ensemble Framework for Intrusion Detection in The Internet of Vehicles. IEEE Global Communications Conference (GLOBECOM).

2. Yang, L., Moubayed, A., & Shami, A. (2022). MTH-IDS: A Multi-Tiered Hybrid Intrusion Detection System for Internet of Vehicles. IEEE Internet of Things Journal.

3. Yang, L., Moubayed, A., Hamieh, I., & Shami, A. (2019). Tree-Based Intelligent Intrusion Detection System in Internet of Vehicles. IEEE Global Communications Conference (GLOBECOM).

## Support

For issues, questions, or contributions, please open an issue on GitHub.

