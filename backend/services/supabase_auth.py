from supabase import create_client
from config import Config
import jwt
from typing import Optional, Dict

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
        # Get the JWT secret from Supabase
        # This is a simplified verification - in production, you'd want to properly verify with Supabase's public key
        decoded = jwt.decode(token, options={"verify_signature": False})
        
        # Get user from Supabase
        user_id = decoded.get('sub')
        if user_id:
            response = supabase.auth.get_user(token)
            return response.user.model_dump() if hasattr(response, 'user') else None
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

