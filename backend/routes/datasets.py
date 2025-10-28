from flask import Blueprint, request, jsonify
from routes.auth import require_auth
from services.database import db_service

datasets_bp = Blueprint('datasets', __name__)

@datasets_bp.route('', methods=['GET'])
@require_auth
def get_datasets():
    """Get all available datasets"""
    try:
        datasets = db_service.get_datasets()
        return jsonify({'success': True, 'datasets': datasets}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@datasets_bp.route('/<dataset_id>', methods=['GET'])
@require_auth
def get_dataset(dataset_id):
    """Get a specific dataset"""
    try:
        dataset = db_service.get_dataset(dataset_id)
        if not dataset:
            return jsonify({'error': 'Dataset not found'}), 404
        
        return jsonify({'success': True, 'dataset': dataset}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

