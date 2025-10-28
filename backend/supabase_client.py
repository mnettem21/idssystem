"""
Supabase Client Module
Handles Supabase database and authentication
"""
from supabase import create_client, Client
from config import Config
import jwt


_supabase_client = None


def get_supabase_client() -> Client:
    """Get or create Supabase client instance with service role key for backend operations"""
    global _supabase_client

    if _supabase_client is None:
        # Use service role key in backend to bypass RLS
        # The backend handles authentication separately via JWT verification
        _supabase_client = create_client(
            Config.SUPABASE_URL,
            Config.SUPABASE_SERVICE_ROLE_KEY
        )

    return _supabase_client


def get_admin_client() -> Client:
    """Get Supabase client with service role key for admin operations"""
    return create_client(
        Config.SUPABASE_URL,
        Config.SUPABASE_SERVICE_ROLE_KEY
    )


def verify_token(token: str):
    """
    Verify JWT token from Supabase Auth

    Args:
        token: JWT token from Authorization header

    Returns:
        User data if valid, None otherwise
    """
    try:
        supabase = get_supabase_client()

        # Verify with Supabase
        response = supabase.auth.get_user(token)

        if response and response.user:
            return {
                'id': response.user.id,
                'email': response.user.email,
                'user_metadata': response.user.user_metadata
            }

        return None

    except Exception as e:
        print(f"Token verification error: {e}")
        return None
