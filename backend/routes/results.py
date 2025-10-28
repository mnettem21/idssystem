from flask import Blueprint, request, jsonify
from routes.auth import require_auth
from services.database import db_service

results_bp = Blueprint('results', __name__)

@results_bp.route('/experiment/<experiment_id>', methods=['GET'])
@require_auth
def get_experiment_result(experiment_id):
    """Get results for a specific experiment"""
    try:
        experiment = db_service.get_experiment(experiment_id)
        if not experiment:
            return jsonify({'error': 'Experiment not found'}), 404
        
        # Check ownership
        user_id = request.current_user['id']
        if experiment['user_id'] != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        result = db_service.get_experiment_result(experiment_id)
        if not result:
            return jsonify({'error': 'No results found for this experiment'}), 404
        
        return jsonify({'success': True, 'result': result}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

