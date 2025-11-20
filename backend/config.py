import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Application configuration"""

    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'

    # Supabase settings
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY')
    SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    # Dataset paths
    DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)),
                            'Intrusion-Detection-System-Using-Machine-Learning-main', 'data')

    AVAILABLE_DATASETS = {
        'CICIDS2017_sample_km.csv': os.path.join(DATA_DIR, 'CICIDS2017_sample_km.csv'),
        'CICIDS2017_sample.csv': os.path.join(DATA_DIR, 'CICIDS2017_sample.csv')
    }

    # CORS settings
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:3001,http://localhost:5173').split(',')

    # Experiment settings
    MAX_CONCURRENT_EXPERIMENTS = int(os.getenv('MAX_CONCURRENT_EXPERIMENTS', '3'))
