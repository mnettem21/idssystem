"""
ML Engine Coordinator for IDS Experiments
Routes to appropriate engine based on algorithm selection
"""
from lccde_engine import LCCDEEngine
from mth_engine import MTHEngine
from tree_based_engine import TreeBasedEngine


def run_ids_experiment(dataset_path, config):
    """
    Run an IDS experiment with the specified algorithm

    Args:
        dataset_path: Path to dataset file
        config: Experiment configuration dictionary
            - algorithm: 'lccde', 'mth', or 'tree-based'
            - train_size: Training set proportion (default: 0.8)
            - test_size: Test set proportion (default: 0.2)
            - random_state: Random seed (default: 0)
            - smote_enabled: Whether to apply SMOTE (default: True)
            - smote_sampling_strategy: SMOTE sampling strategy dict
            - feature_selection_enabled: Whether to apply feature selection
            - Algorithm-specific parameters

    Returns:
        Dictionary containing results for all models and visualizations
    """
    algorithm = config.get('algorithm', 'lccde').lower()
    
    if algorithm == 'lccde':
        engine = LCCDEEngine(dataset_path, config)
    elif algorithm == 'mth':
        engine = MTHEngine(dataset_path, config)
    elif algorithm == 'tree-based' or algorithm == 'tree_based':
        engine = TreeBasedEngine(dataset_path, config)
    else:
        raise ValueError(f"Unknown algorithm: {algorithm}. Supported: 'lccde', 'mth', 'tree-based'")
    
    results = engine.run_experiment()
    return results
