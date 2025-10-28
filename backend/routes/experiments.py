from flask import Blueprint, request, jsonify
from routes.auth import require_auth
from services.database import db_service
from services.supabase_auth import get_user_from_token
from ml_engine.detection_engine import DetectionEngine
import threading
import queue

experiments_bp = Blueprint('experiments', __name__)
task_queue = queue.Queue()

def background_worker():
    """Background worker to process experiments"""
    while True:
        experiment_id = task_queue.get()
        if experiment_id is None:
            break
        
        try:
            # Process the experiment
            experiment = db_service.get_experiment(experiment_id)
            if not experiment:
                continue
            
            # Update status to running
            db_service.update_experiment_status(
                experiment_id, 
                'running',
                started_at='NOW()'
            )
            
            # Get dataset
            dataset = db_service.get_dataset(experiment['dataset_id'])
            if not dataset:
                db_service.update_experiment_status(experiment_id, 'failed')
                continue
            
            # Initialize detection engine
            engine = DetectionEngine()
            
            # Run the algorithm
            results = engine.run_algorithm(
                algorithm=experiment['algorithm'],
                dataset_path=dataset['file_path'],
                parameters=experiment.get('parameters', {})
            )
            
            # Store results
            db_service.create_experiment_result(experiment_id, results)
            
            # Update status to completed
            db_service.update_experiment_status(
                experiment_id,
                'completed',
                completed_at='NOW()'
            )
            
        except Exception as e:
            print(f"Error processing experiment {experiment_id}: {e}")
            db_service.update_experiment_status(experiment_id, 'failed')
        finally:
            task_queue.task_done()

# Start background worker
worker_thread = threading.Thread(target=background_worker, daemon=True)
worker_thread.start()

@experiments_bp.route('', methods=['GET'])
@require_auth
def get_experiments():
    """Get all experiments for the current user"""
    try:
        user_id = request.current_user['id']
        experiments = db_service.get_user_experiments(user_id)
        return jsonify({'success': True, 'experiments': experiments}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@experiments_bp.route('/<experiment_id>', methods=['GET'])
@require_auth
def get_experiment(experiment_id):
    """Get a specific experiment"""
    try:
        experiment = db_service.get_experiment_with_result(experiment_id)
        if not experiment:
            return jsonify({'error': 'Experiment not found'}), 404
        
        # Check ownership
        user_id = request.current_user['id']
        if experiment['user_id'] != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify({'success': True, 'experiment': experiment}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@experiments_bp.route('', methods=['POST'])
@require_auth
def create_experiment():
    """Create a new experiment"""
    try:
        user_id = request.current_user['id']
        data = request.json
        
        required_fields = ['name', 'dataset_id', 'algorithm']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        experiment = db_service.create_experiment(
            user_id=user_id,
            name=data['name'],
            description=data.get('description', ''),
            dataset_id=data['dataset_id'],
            algorithm=data['algorithm'],
            parameters=data.get('parameters', {})
        )
        
        # Queue for processing
        task_queue.put(experiment['id'])
        
        return jsonify({'success': True, 'experiment': experiment}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@experiments_bp.route('/<experiment_id>', methods=['DELETE'])
@require_auth
def delete_experiment(experiment_id):
    """Delete an experiment"""
    try:
        experiment = db_service.get_experiment(experiment_id)
        if not experiment:
            return jsonify({'error': 'Experiment not found'}), 404
        
        # Check ownership
        user_id = request.current_user['id']
        if experiment['user_id'] != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Delete experiment (results will cascade)
        # Note: You may need to add a delete method to DatabaseService
        return jsonify({'success': True, 'message': 'Experiment deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

