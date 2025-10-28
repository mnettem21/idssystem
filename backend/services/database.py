from supabase import create_client, Client
from config import Config
import json

class DatabaseService:
    def __init__(self):
        self.supabase: Client = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)
    
    def get_datasets(self):
        """Get all available datasets"""
        response = self.supabase.table('datasets').select('*').execute()
        return response.data
    
    def get_dataset(self, dataset_id):
        """Get a specific dataset by ID"""
        response = self.supabase.table('datasets').select('*').eq('id', dataset_id).execute()
        if response.data:
            return response.data[0]
        return None
    
    def create_experiment(self, user_id, name, description, dataset_id, algorithm, parameters=None):
        """Create a new experiment"""
        experiment_data = {
            'user_id': user_id,
            'name': name,
            'description': description,
            'dataset_id': dataset_id,
            'algorithm': algorithm,
            'parameters': parameters or {},
            'status': 'pending'
        }
        response = self.supabase.table('experiments').insert(experiment_data).execute()
        return response.data[0]
    
    def get_experiment(self, experiment_id):
        """Get a specific experiment"""
        response = self.supabase.table('experiments').select('*').eq('id', experiment_id).execute()
        if response.data:
            return response.data[0]
        return None
    
    def get_user_experiments(self, user_id):
        """Get all experiments for a user"""
        response = self.supabase.table('experiments').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
        return response.data
    
    def update_experiment_status(self, experiment_id, status, **kwargs):
        """Update experiment status and other fields"""
        from datetime import datetime
        
        update_data = {'status': status}
        
        # Handle datetime fields
        for key, value in kwargs.items():
            if value == 'NOW()':
                update_data[key] = datetime.utcnow().isoformat()
            else:
                update_data[key] = value
        
        response = self.supabase.table('experiments').update(update_data).eq('id', experiment_id).execute()
        return response.data[0] if response.data else None
    
    def create_experiment_result(self, experiment_id, metrics):
        """Create experiment results"""
        result_data = {
            'experiment_id': experiment_id,
            **metrics
        }
        response = self.supabase.table('experiment_results').insert(result_data).execute()
        return response.data[0]
    
    def get_experiment_result(self, experiment_id):
        """Get result for an experiment"""
        response = self.supabase.table('experiment_results').select('*').eq('experiment_id', experiment_id).execute()
        if response.data:
            return response.data[0]
        return None
    
    def get_experiment_with_result(self, experiment_id):
        """Get experiment with its result"""
        exp = self.get_experiment(experiment_id)
        if exp:
            result = self.get_experiment_result(experiment_id)
            if result:
                exp['result'] = result
        return exp
    
    def create_comparison(self, user_id, name, description, baseline_experiment_id, comparison_experiment_id, comparison_metrics):
        """Create a comparison between two experiments"""
        comparison_data = {
            'user_id': user_id,
            'name': name,
            'description': description,
            'baseline_experiment_id': baseline_experiment_id,
            'comparison_experiment_id': comparison_experiment_id,
            'comparison_metrics': comparison_metrics
        }
        response = self.supabase.table('comparisons').insert(comparison_data).execute()
        return response.data[0]
    
    def get_user_comparisons(self, user_id):
        """Get all comparisons for a user"""
        response = self.supabase.table('comparisons').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
        return response.data
    
    def get_comparison(self, comparison_id):
        """Get a specific comparison"""
        response = self.supabase.table('comparisons').select('*').eq('id', comparison_id).execute()
        if response.data:
            return response.data[0]
        return None

db_service = DatabaseService()

