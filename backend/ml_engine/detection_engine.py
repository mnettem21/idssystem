from ml_engine.lccde_algorithm import LCCDEAlgorithm
import os

class DetectionEngine:
    """
    Detection Engine that runs various IDS algorithms
    """
    
    def __init__(self):
        self.supported_algorithms = ['LCCDE', 'XGBoost', 'LightGBM', 'CatBoost']
    
    def run_algorithm(self, algorithm, dataset_path, parameters=None):
        """
        Run a specific algorithm on a dataset
        
        Args:
            algorithm: Algorithm name (LCCDE, XGBoost, LightGBM, CatBoost)
            dataset_path: Path to the dataset file
            parameters: Algorithm-specific parameters
            
        Returns:
            dict: Results dictionary
        """
        if algorithm not in self.supported_algorithms:
            raise ValueError(f"Unsupported algorithm: {algorithm}")
        
        # Construct full path
        base_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        full_dataset_path = os.path.join(base_path, dataset_path)
        
        if not os.path.exists(full_dataset_path):
            raise FileNotFoundError(f"Dataset not found: {full_dataset_path}")
        
        if algorithm == 'LCCDE':
            lccde = LCCDEAlgorithm(parameters=parameters)
            results = lccde.run(full_dataset_path)
            return {
                'accuracy': results['accuracy'],
                'precision_weighted': results['precision'],
                'recall_weighted': results['recall'],
                'f1_weighted': results['f1_weighted'],
                'f1_per_class': results['f1_per_class'],
                'confusion_matrix': results['confusion_matrix'],
                'classification_report': results['classification_report'],
                'execution_time_seconds': results['execution_time']
            }
        else:
            # For other algorithms, you can implement similar logic
            # For now, just return a placeholder
            return {
                'accuracy': 0.0,
                'precision_weighted': 0.0,
                'recall_weighted': 0.0,
                'f1_weighted': 0.0,
                'f1_per_class': [],
                'confusion_matrix': [],
                'classification_report': '',
                'execution_time_seconds': 0.0
            }

