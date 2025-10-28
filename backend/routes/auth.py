from flask import Blueprint, request, jsonify
from functools import wraps
from services.database import db_service
from services.supabase_auth import verify_token
import os

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/verify', methods=['POST'])
def verify():
    """Verify authentication token"""
    try:
        token = request.headers.get('Authorization')
        if not token or not token.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid token'}), 401
        
        token = token.replace('Bearer ', '')
        user = verify_token(token)
        
        if user:
            return jsonify({
                'success': True,
                'user': {
                    'id': user['id'],
                    'email': user.get('email'),
                    'user_metadata': user.get('user_metadata', {})
                }
            }), 200
        else:
            return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 401

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token or not token.startswith('Bearer '):
            return jsonify({'error': 'Unauthorized'}), 401
        
        token = token.replace('Bearer ', '')
        user = verify_token(token)
        
        if not user:
            return jsonify({'error': 'Invalid token'}), 401
        
        request.current_user = user
        return f(*args, **kwargs)
    
    return decorated_function

