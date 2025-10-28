from flask import Blueprint, request, jsonify
from routes.auth import require_auth
from services.database import db_service

comparisons_bp = Blueprint('comparisons', __name__)

@comparisons_bp.route('', methods=['GET'])
@require_auth
def get_comparisons():
    """Get all comparisons for the current user"""
    try:
        user_id = request.current_user['id']
        comparisons = db_service.get_user_comparisons(user_id)
        return jsonify({'success': True, 'comparisons': comparisons}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@comparisons_bp.route('', methods=['POST'])
@require_auth
def create_comparison():
    """Create a new comparison between two experiments"""
    try:
        user_id = request.current_user['id']
        data = request.json
        
        required_fields = ['name', 'baseline_experiment_id', 'comparison_experiment_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Get both experiments
        baseline = db_service.get_experiment_with_result(data['baseline_experiment_id'])
        comparison = db_service.get_experiment_with_result(data['comparison_experiment_id'])
        
        if not baseline or not comparison:
            return jsonify({'error': 'One or both experiments not found'}), 404
        
        # Check ownership
        if baseline['user_id'] != user_id or comparison['user_id'] != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get results
        baseline_result = baseline.get('result')
        comparison_result = comparison.get('result')
        
        if not baseline_result or not comparison_result:
            return jsonify({'error': 'Results not available for comparison'}), 400
        
        # Calculate comparison metrics
        comparison_metrics = {
            'baseline': {
                'accuracy': baseline_result.get('accuracy'),
                'f1_weighted': baseline_result.get('f1_weighted'),
                'precision': baseline_result.get('precision_weighted'),
                'recall': baseline_result.get('recall_weighted')
            },
            'comparison': {
                'accuracy': comparison_result.get('accuracy'),
                'f1_weighted': comparison_result.get('f1_weighted'),
                'precision': comparison_result.get('precision_weighted'),
                'recall': comparison_result.get('recall_weighted')
            },
            'improvement': {
                'accuracy': float(comparison_result.get('accuracy', 0)) - float(baseline_result.get('accuracy', 0)),
                'f1_weighted': float(comparison_result.get('f1_weighted', 0)) - float(baseline_result.get('f1_weighted', 0)),
                'precision': float(comparison_result.get('precision_weighted', 0)) - float(baseline_result.get('precision_weighted', 0)),
                'recall': float(comparison_result.get('recall_weighted', 0)) - float(baseline_result.get('recall_weighted', 0))
            }
        }
        
        comparison_obj = db_service.create_comparison(
            user_id=user_id,
            name=data['name'],
            description=data.get('description', ''),
            baseline_experiment_id=data['baseline_experiment_id'],
            comparison_experiment_id=data['comparison_experiment_id'],
            comparison_metrics=comparison_metrics
        )
        
        comparison_obj['metrics'] = comparison_metrics
        
        return jsonify({'success': True, 'comparison': comparison_obj}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@comparisons_bp.route('/<comparison_id>', methods=['GET'])
@require_auth
def get_comparison(comparison_id):
    """Get a specific comparison"""
    try:
        comparison = db_service.get_comparison(comparison_id)
        if not comparison:
            return jsonify({'error': 'Comparison not found'}), 404
        
        # Check ownership
        user_id = request.current_user['id']
        if comparison['user_id'] != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify({'success': True, 'comparison': comparison}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

