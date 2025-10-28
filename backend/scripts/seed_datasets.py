"""
Script to seed initial datasets into the database
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables first
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

from services.database import db_service

def seed_datasets():
    """Seed initial datasets"""
    
    # Hard-coded absolute paths for datasets
    BASE_PATH = '/Users/megha/Desktop/idssystem'
    
    datasets = [
        {
            'name': 'CICIDS2017 Sample (K-means)',
            'description': 'Sampled CICIDS2017 dataset for K-means clustering experiments',
            'file_path': f'{BASE_PATH}/Intrusion-Detection-System-Using-Machine-Learning-main/data/CICIDS2017_sample_km.csv',
            'feature_count': 63,
            'sample_count': 22956
        },
        {
            'name': 'CICIDS2017 Sample',
            'description': 'Sampled CICIDS2017 dataset for standard ML experiments',
            'file_path': f'{BASE_PATH}/Intrusion-Detection-System-Using-Machine-Learning-main/data/CICIDS2017_sample.csv',
            'feature_count': 63,
            'sample_count': 22956
        },
        {
            'name': 'IoT 2020 Multi (5% Sample)',
            'description': 'IoT 2020 dataset sample for intrusion detection',
            'file_path': f'{BASE_PATH}/Intrusion-Detection-System-Using-Machine-Learning-main/data/IoT_2020_multi_0.05.csv',
            'feature_count': 63,
            'sample_count': 50000
        }
    ]
    
    print("Seeding datasets...")
    for dataset in datasets:
        try:
            # Check if exists
            existing = db_service.supabase.table('datasets').select('*').eq('name', dataset['name']).execute()
            if existing.data:
                print(f"Dataset '{dataset['name']}' already exists, skipping...")
            else:
                db_service.supabase.table('datasets').insert(dataset).execute()
                print(f"✓ Created dataset: {dataset['name']}")
        except Exception as e:
            print(f"✗ Error creating dataset '{dataset['name']}': {e}")
    
    print("\nDataset seeding complete!")

if __name__ == '__main__':
    seed_datasets()

