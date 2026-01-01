"""
User Authentication System
Handles user registration, login, and JWT tokens
"""

import jwt
from datetime import datetime, timedelta
import hashlib
from typing import Optional, Dict, List
import json
from pathlib import Path

# JWT Configuration
SECRET_KEY = "agrichain_secret_key_2025"  # In production, use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

def hash_password(password: str) -> str:
    """Hash a password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return hash_password(plain_password) == hashed_password

class AuthManager:
    """
    Manages user authentication and authorization
    """
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        self.users_file = self.data_dir / "users.json"
        
        # Initialize with demo users if file doesn't exist
        if not self.users_file.exists():
            self._create_demo_users()
    
    def _create_demo_users(self):
        """Create demo farmer and consumer accounts"""
        demo_users = [
            {
                "id": "farmer_1",
                "email": "farmer@agrichain.com",
                "password_hash": hash_password("farmer123"),
                "role": "farmer",
                "name": "Rajan Singh",
                "phone": "+91 9876543210",
                "location": "Village Farm, Punjab",
                "created_at": datetime.now().isoformat(),
                "profile": {
                    "farm_size": "5 hectares",
                    "crops": ["Rice", "Wheat", "Tomatoes"],
                    "experience_years": 15,
                    "organic_certified": True
                }
            },
            {
                "id": "consumer_1",
                "email": "consumer@agrichain.com",
                "password_hash": hash_password("consumer123"),
                "role": "consumer",
                "name": "Priya Sharma",
                "phone": "+91 9876543211",
                "location": "New Delhi",
                "created_at": datetime.now().isoformat(),
                "profile": {
                    "delivery_address": "123 Green Street, New Delhi, 110001",
                    "preferred_categories": ["Organic", "Vegetables"],
                    "member_since": "2025"
                }
            },
            {
                "id": "farmer_2",
                "email": "ramesh@agrichain.com",
                "password_hash": hash_password("ramesh123"),
                "role": "farmer",
                "name": "Ramesh Kumar",
                "phone": "+91 9876543212",
                "location": "Green Valley Farm, Maharashtra",
                "created_at": datetime.now().isoformat(),
                "profile": {
                    "farm_size": "3 hectares",
                    "crops": ["Potatoes", "Onions", "Cabbage"],
                    "experience_years": 10,
                    "organic_certified": False
                }
            }
        ]
        
        self._save_users(demo_users)
        print("[AUTH] Created demo users:")
        print("  Farmer: farmer@agrichain.com / farmer123")
        print("  Consumer: consumer@agrichain.com / consumer123")
        print("  Farmer 2: ramesh@agrichain.com / ramesh123")
    
    def _load_users(self) -> List[Dict]:
        """Load users from file"""
        try:
            with open(self.users_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading users: {e}")
            return []
    
    def _save_users(self, users: List[Dict]):
        """Save users to file"""
        try:
            with open(self.users_file, 'w', encoding='utf-8') as f:
                json.dump(users, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error saving users: {e}")
    
    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email"""
        users = self._load_users()
        for user in users:
            if user['email'] == email:
                return user
        return None
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        """Get user by ID"""
        users = self._load_users()
        for user in users:
            if user['id'] == user_id:
                return user
        return None
    
    def create_user(self, email: str, password: str, role: str, name: str, 
                   phone: str, location: str, profile: Dict = None) -> Dict:
        """Create a new user"""
        users = self._load_users()
        
        # Check if email already exists
        if any(u['email'] == email for u in users):
            raise ValueError("Email already registered")
        
        # Generate user ID
        user_id = f"{role}_{len([u for u in users if u['role'] == role]) + 1}"
        
        new_user = {
            "id": user_id,
            "email": email,
            "password_hash": hash_password(password),
            "role": role,
            "name": name,
            "phone": phone,
            "location": location,
            "created_at": datetime.now().isoformat(),
            "profile": profile or {}
        }
        
        users.append(new_user)
        self._save_users(users)
        
        return new_user
    
    def authenticate_user(self, email: str, password: str) -> Optional[Dict]:
        """Authenticate user with email and password"""
        user = self.get_user_by_email(email)
        if not user:
            return None
        
        if not verify_password(password, user['password_hash']):
            return None
        
        return user
    
    def create_access_token(self, user_id: str, email: str, role: str) -> str:
        """Create JWT access token"""
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode = {
            "sub": user_id,
            "email": email,
            "role": role,
            "exp": expire
        }
        
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Optional[Dict]:
        """Verify JWT token and return payload"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            print("Token expired")
            return None
        except jwt.JWTError as e:
            print(f"Token error: {e}")
            return None
    
    def get_current_user(self, token: str) -> Optional[Dict]:
        """Get current user from token"""
        payload = self.verify_token(token)
        if not payload:
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        user = self.get_user_by_id(user_id)
        if user:
            # Remove password hash from response
            user_copy = user.copy()
            user_copy.pop('password_hash', None)
            return user_copy
        
        return None
    
    def update_user_profile(self, user_id: str, updates: Dict) -> bool:
        """Update user profile"""
        users = self._load_users()
        
        for i, user in enumerate(users):
            if user['id'] == user_id:
                # Update allowed fields
                if 'name' in updates:
                    users[i]['name'] = updates['name']
                if 'phone' in updates:
                    users[i]['phone'] = updates['phone']
                if 'location' in updates:
                    users[i]['location'] = updates['location']
                if 'profile' in updates:
                    users[i]['profile'].update(updates['profile'])
                
                self._save_users(users)
                return True
        
        return False
    
    def delete_user(self, user_id: str) -> bool:
        """Delete user account"""
        users = self._load_users()
        
        # Find and remove user
        users = [u for u in users if u['id'] != user_id]
        self._save_users(users)
        
        print(f"[OK] User {user_id} deleted")
        return True


# Global instance
auth_manager = AuthManager()


if __name__ == "__main__":
    # Test authentication
    print("Testing authentication system...")
    
    # Test login
    user = auth_manager.authenticate_user("farmer@agrichain.com", "farmer123")
    if user:
        print(f"\n[OK] Authenticated: {user['name']} ({user['role']})")
        
        # Create token
        token = auth_manager.create_access_token(user['id'], user['email'], user['role'])
        print(f"[OK] Token created: {token[:50]}...")
        
        # Verify token
        current_user = auth_manager.get_current_user(token)
        if current_user:
            print(f"[OK] Token verified: {current_user['name']}")
    else:
        print("[ERROR] Authentication failed")

