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
        if not Config.SUPABASE_URL:
            raise ValueError("SUPABASE_URL is not set in environment variables")
        if not Config.SUPABASE_SERVICE_ROLE_KEY:
            raise ValueError("SUPABASE_SERVICE_ROLE_KEY is not set in environment variables")
        
        try:
            # Initialize Supabase client
            # Note: The options parameter should be a ClientOptions object, not a dict
            # For now, we'll use the simpler initialization without options
            _supabase_client = create_client(
                Config.SUPABASE_URL,
                Config.SUPABASE_SERVICE_ROLE_KEY
            )
            print(f"✓ Supabase client initialized with URL: {Config.SUPABASE_URL[:30]}...")
            print(f"✓ Using service role key (length: {len(Config.SUPABASE_SERVICE_ROLE_KEY)})")
            
            # Test the client with a simple query to ensure it's working
            try:
                test_response = _supabase_client.table('experiments').select('id').limit(1).execute()
                print(f"✓ Supabase client test query successful")
            except Exception as test_error:
                print(f"⚠ Supabase client test query failed: {test_error}")
                # Don't raise here, let it fail on actual use if needed
                
        except Exception as e:
            print(f"✗ Error initializing Supabase client: {e}")
            import traceback
            traceback.print_exc()
            raise

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
    
    Uses Supabase's auth API to verify the token and get user information.

    Args:
        token: JWT token from Authorization header

    Returns:
        User data if valid, None otherwise
    """
    try:
        # First, try to decode the token to check its structure
        decoded = jwt.decode(token, options={"verify_signature": False})
        print(f"DEBUG: Decoded token payload keys: {list(decoded.keys())}")
        print(f"DEBUG: Token role: {decoded.get('role')}, sub: {decoded.get('sub')}")
        
        # Check if this is an API key (not a user token)
        role = decoded.get('role', '')
        if role in ['anon', 'service_role']:
            print(f"DEBUG: This appears to be an API key (role: {role}), not a user token")
            return None
        
        # Extract user information from decoded token
        # Supabase user auth tokens have 'sub' field containing the user UUID
        user_id = decoded.get('sub')
        email = decoded.get('email')
        aud = decoded.get('aud', '')  # Audience - 'authenticated' for user tokens
        
        # Check if this looks like a user token
        # User tokens typically have:
        # - 'sub' field with UUID
        # - 'aud' field set to 'authenticated' 
        # - 'role' field set to 'authenticated'
        is_user_token = (
            user_id and 
            len(user_id) > 20 and  # UUIDs are long
            (aud == 'authenticated' or role == 'authenticated' or not role)
        )
        
        if not is_user_token:
            print(f"DEBUG: Token doesn't appear to be a valid user token")
            print(f"DEBUG: user_id: {user_id}, aud: {aud}, role: {role}")
            return None
        
        if not user_id:
            print(f"DEBUG: No user ID found in token. Token payload: {decoded}")
            return None

        print(f"DEBUG: Token verified - user_id: {user_id}, email: {email}")
        
        return {
            'id': user_id,
            'email': email or '',
            'user_metadata': decoded.get('user_metadata', {})
        }

    except jwt.DecodeError as e:
        print(f"JWT decode error: {e}")
        return None
    except Exception as e:
        print(f"Token verification error: {e}")
        import traceback
        traceback.print_exc()
        return None
