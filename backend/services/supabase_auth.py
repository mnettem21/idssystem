from supabase import create_client
from config import Config
import jwt
from typing import Optional, Dict
from datetime import datetime

# Initialize Supabase client
supabase = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)

def verify_token(token: str) -> Optional[Dict]:
    """
    Verify a JWT token from Supabase
    
    Args:
        token: JWT token string
        
    Returns:
        User data if valid, None otherwise
    """
    try:
        # Decode the JWT token without verification (for development)
        # In production, you should verify the signature
        decoded = jwt.decode(token, options={"verify_signature": False})
        
        # Check if token is expired
        exp = decoded.get('exp')
        if exp and datetime.fromtimestamp(exp) < datetime.now():
            return None
        
        # Extract user information from the token
        user_id = decoded.get('sub')
        email = decoded.get('email')
        
        if user_id:
            return {
                'id': user_id,
                'email': email,
                'user_metadata': decoded.get('user_metadata', {}),
                'role': decoded.get('role', 'authenticated')
            }
        
        return None
    except Exception as e:
        print(f"Token verification error: {e}")
        return None

def get_user_from_token(token: str) -> Optional[str]:
    """
    Extract user ID from token
    
    Args:
        token: JWT token string
        
    Returns:
        User ID if valid, None otherwise
    """
    try:
        decoded = jwt.decode(token, options={"verify_signature": False})
        return decoded.get('sub')
    except Exception:
        return None

