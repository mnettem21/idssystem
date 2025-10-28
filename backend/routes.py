"""
API Routes for IDS Experiment System
"""
from flask import Blueprint, request, jsonify, current_app
from functools import wraps
import threading
import uuid
import os
import shutil
from datetime import datetime
from supabase_client import get_supabase_client, verify_token
from ml_engine import run_ids_experiment
from config import Config

experiments_bp = Blueprint('experiments', __name__)
auth_bp = Blueprint('auth', __name__)

# Store for running experiments (in-memory for now)
running_experiments = {}


def cleanup_catboost_info():
    """Remove catboost_info directory if it exists"""
    catboost_dir = os.path.join(os.path.dirname(__file__), 'catboost_info')
    if os.path.exists(catboost_dir):
        try:
            shutil.rmtree(catboost_dir)
            print(f"✓ Cleaned up catboost_info directory")
        except Exception as e:
            print(f"Warning: Could not remove catboost_info: {e}")


def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        print(f"DEBUG: require_auth called for {f.__name__}")
        auth_header = request.headers.get('Authorization')
        print(f"DEBUG: auth_header = {auth_header[:50] if auth_header else None}...")

        if not auth_header or not auth_header.startswith('Bearer '):
            print("DEBUG: No auth header, returning 401")
            return jsonify({'error': 'No authorization token provided'}), 401

        token = auth_header.split(' ')[1]
        user = verify_token(token)

        if not user:
            return jsonify({'error': 'Invalid or expired token'}), 401

        # Pass user info to the route handler
        kwargs['user_id'] = user['id']
        kwargs['user'] = user

        return f(*args, **kwargs)

    return decorated_function


@auth_bp.route('/verify', methods=['GET'])
@require_auth
def verify_auth(user_id, user):
    """Verify authentication token"""
    return jsonify({
        'authenticated': True,
        'user': {
            'id': user_id,
            'email': user.get('email')
        }
    })


@experiments_bp.route('/', methods=['GET'])
@require_auth
def list_experiments(user_id, user):
    """List all experiments for the authenticated user"""
    try:
        supabase = get_supabase_client()

        # Query experiments for the user
        response = supabase.table('experiments').select(
            '*',
            count='exact'
        ).eq('user_id', user_id).order('created_at', desc=True).execute()

        return jsonify({
            'experiments': response.data,
            'count': len(response.data)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@experiments_bp.route('/<experiment_id>', methods=['GET'])
@require_auth
def get_experiment(user_id, user, experiment_id):
    """Get details of a specific experiment"""
    try:
        supabase = get_supabase_client()

        # Get experiment
        exp_response = supabase.table('experiments').select('*').eq(
            'id', experiment_id
        ).eq('user_id', user_id).execute()

        if not exp_response.data:
            return jsonify({'error': 'Experiment not found'}), 404

        experiment = exp_response.data[0]

        # Get results
        results_response = supabase.table('experiment_results').select('*').eq(
            'experiment_id', experiment_id
        ).execute()

        return jsonify({
            'experiment': experiment,
            'results': results_response.data
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@experiments_bp.route('/', methods=['POST'])
@require_auth
def create_experiment(user_id, user):
    """Create a new experiment"""
    try:
        data = request.json

        # Validate required fields
        if not data.get('name'):
            return jsonify({'error': 'Experiment name is required'}), 400

        dataset_name = data.get('dataset_name', 'CICIDS2017_sample_km.csv')
        if dataset_name not in Config.AVAILABLE_DATASETS:
            return jsonify({'error': 'Invalid dataset name'}), 400

        supabase = get_supabase_client()

        # Create experiment record
        experiment_data = {
            'user_id': user_id,
            'name': data.get('name'),
            'description': data.get('description', ''),
            'dataset_name': dataset_name,
            'train_size': data.get('train_size', 0.8),
            'test_size': data.get('test_size', 0.2),
            'random_state': data.get('random_state', 0),
            'smote_enabled': data.get('smote_enabled', True),
            'smote_sampling_strategy': data.get('smote_sampling_strategy', {"2": 1000, "4": 1000}),
            'lightgbm_params': data.get('lightgbm_params', {}),
            'xgboost_params': data.get('xgboost_params', {}),
            'catboost_params': data.get('catboost_params', {"verbose": 0, "boosting_type": "Plain"}),
            'status': 'pending'
        }

        response = supabase.table('experiments').insert(experiment_data).execute()

        return jsonify({
            'message': 'Experiment created successfully',
            'experiment': response.data[0]
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


def run_experiment_background(experiment_id, user_id):
    """Background task to run the experiment"""
    try:
        print(f"\n{'='*60}")
        print(f"EXPERIMENT {experiment_id} STARTING")
        print(f"{'='*60}\n")

        supabase = get_supabase_client()

        # Get experiment details
        exp_response = supabase.table('experiments').select('*').eq(
            'id', experiment_id
        ).execute()

        if not exp_response.data:
            print(f"ERROR: Experiment {experiment_id} not found")
            return

        experiment = exp_response.data[0]
        print(f"✓ Experiment loaded: {experiment['name']}")

        # Update status to running
        supabase.table('experiments').update({
            'status': 'running',
            'started_at': datetime.utcnow().isoformat()
        }).eq('id', experiment_id).execute()
        print(f"✓ Status updated to 'running'")

        # Prepare configuration
        config = {
            'train_size': float(experiment['train_size']),
            'test_size': float(experiment['test_size']),
            'random_state': experiment['random_state'],
            'smote_enabled': experiment['smote_enabled'],
            'smote_sampling_strategy': experiment['smote_sampling_strategy'],
            'lightgbm_params': experiment['lightgbm_params'] or {},
            'xgboost_params': experiment['xgboost_params'] or {},
            'catboost_params': experiment['catboost_params'] or {"verbose": 0, "boosting_type": "Plain"}
        }

        # Get dataset path
        dataset_path = Config.AVAILABLE_DATASETS[experiment['dataset_name']]
        print(f"✓ Dataset path: {dataset_path}")
        print(f"\n{'='*60}")
        print(f"STARTING ML TRAINING")
        print(f"{'='*60}\n")

        # Run the experiment
        results = run_ids_experiment(dataset_path, config)

        print(f"\n{'='*60}")
        print(f"ML TRAINING COMPLETE")
        print(f"{'='*60}\n")

        # Save results to database
        print(f"Saving results to database...")
        for model_name, metrics in results.items():
            result_data = {
                'experiment_id': experiment_id,
                'model_name': model_name,
                'accuracy': metrics['accuracy'],
                'precision': metrics['precision'],
                'recall': metrics['recall'],
                'f1_score': metrics['f1_score'],
                'f1_scores_per_class': metrics['f1_scores_per_class'],
                'confusion_matrix': metrics['confusion_matrix'],
                'training_time': metrics['training_time'],
                'classification_report': metrics['classification_report']
            }

            supabase.table('experiment_results').insert(result_data).execute()
            print(f"  ✓ Saved {model_name} results (F1: {metrics['f1_score']:.4f})")

        # Update experiment status to completed
        supabase.table('experiments').update({
            'status': 'completed',
            'completed_at': datetime.utcnow().isoformat()
        }).eq('id', experiment_id).execute()

        print(f"\n{'='*60}")
        print(f"EXPERIMENT {experiment_id} COMPLETED SUCCESSFULLY")
        print(f"{'='*60}\n")

        # Clean up catboost_info directory
        cleanup_catboost_info()

        # Remove from running experiments
        if experiment_id in running_experiments:
            del running_experiments[experiment_id]

    except Exception as e:
        # Update experiment status to failed
        try:
            supabase = get_supabase_client()
            supabase.table('experiments').update({
                'status': 'failed',
                'error_message': str(e),
                'completed_at': datetime.utcnow().isoformat()
            }).eq('id', experiment_id).execute()
        except:
            pass

        # Clean up catboost_info directory
        cleanup_catboost_info()

        # Remove from running experiments
        if experiment_id in running_experiments:
            del running_experiments[experiment_id]


@experiments_bp.route('/<experiment_id>/run', methods=['POST'])
@require_auth
def run_experiment(user_id, user, experiment_id):
    """Run an experiment"""
    print(f"DEBUG: run_experiment called with experiment_id={experiment_id}, user_id={user_id}")
    try:
        supabase = get_supabase_client()

        # Verify experiment exists and belongs to user
        exp_response = supabase.table('experiments').select('*').eq(
            'id', experiment_id
        ).eq('user_id', user_id).execute()

        print(f"DEBUG: exp_response.data = {exp_response.data}")

        if not exp_response.data:
            print(f"DEBUG: Experiment not found in database")
            return jsonify({'error': 'Experiment not found'}), 404

        experiment = exp_response.data[0]

        # Check if experiment is already running or completed
        if experiment['status'] == 'running':
            return jsonify({'error': 'Experiment is already running'}), 400

        # Check concurrent experiments limit
        if len(running_experiments) >= Config.MAX_CONCURRENT_EXPERIMENTS:
            return jsonify({'error': 'Maximum concurrent experiments reached'}), 429

        # Start experiment in background thread
        thread = threading.Thread(
            target=run_experiment_background,
            args=(experiment_id, user_id)
        )
        thread.daemon = True
        thread.start()

        running_experiments[experiment_id] = thread

        print(f"DEBUG: Experiment started successfully")
        return jsonify({
            'message': 'Experiment started successfully',
            'experiment_id': experiment_id
        })

    except Exception as e:
        print(f"DEBUG: Error in run_experiment: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@experiments_bp.route('/<experiment_id>', methods=['DELETE'])
@require_auth
def delete_experiment(user_id, user, experiment_id):
    """Delete an experiment"""
    try:
        supabase = get_supabase_client()

        # Check if experiment is running
        if experiment_id in running_experiments:
            return jsonify({'error': 'Cannot delete a running experiment'}), 400

        # Delete experiment (results will be cascade deleted)
        response = supabase.table('experiments').delete().eq(
            'id', experiment_id
        ).eq('user_id', user_id).execute()

        if not response.data:
            return jsonify({'error': 'Experiment not found'}), 404

        return jsonify({'message': 'Experiment deleted successfully'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@experiments_bp.route('/compare', methods=['POST'])
@require_auth
def compare_experiments(user_id, user):
    """Compare multiple experiments"""
    try:
        data = request.json
        experiment_ids = data.get('experiment_ids', [])

        if not experiment_ids or len(experiment_ids) < 2:
            return jsonify({'error': 'At least 2 experiment IDs are required'}), 400

        supabase = get_supabase_client()

        comparisons = []

        for exp_id in experiment_ids:
            # Get experiment
            exp_response = supabase.table('experiments').select('*').eq(
                'id', exp_id
            ).eq('user_id', user_id).execute()

            if not exp_response.data:
                continue

            experiment = exp_response.data[0]

            # Get results
            results_response = supabase.table('experiment_results').select('*').eq(
                'experiment_id', exp_id
            ).execute()

            comparisons.append({
                'experiment': experiment,
                'results': results_response.data
            })

        return jsonify({'comparisons': comparisons})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@experiments_bp.route('/attack-types', methods=['GET'])
def get_attack_types():
    """Get all attack types"""
    try:
        supabase = get_supabase_client()
        response = supabase.table('attack_types').select('*').order('label').execute()

        return jsonify({'attack_types': response.data})

    except Exception as e:
        return jsonify({'error': str(e)}), 500
