import hashlib
import json
import os
import uuid
from datetime import datetime
from typing import Dict, Optional

from utils.file_utils import USERS_FILE, read_json, write_json, init_dirs

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"
ADMIN_EMAIL = "admin@rag.local"

_token_store: Dict[str, str] = {}


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


def init_users() -> None:
    init_dirs()
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f)

    users = read_json(USERS_FILE)
    admin_exists = any(u.get('username') == ADMIN_USERNAME for u in users)
    if not admin_exists:
        admin_user = {
            'id': 'user-admin',
            'username': ADMIN_USERNAME,
            'email': ADMIN_EMAIL,
            'password': hash_password(ADMIN_PASSWORD),
            'role': 'admin',
            'createdAt': datetime.now().isoformat(),
        }
        users.insert(0, admin_user)
        write_json(USERS_FILE, users)


def get_user_by_email(email: str) -> Optional[Dict]:
    users = read_json(USERS_FILE)
    email_lower = email.lower()
    return next((u for u in users if u.get('email', '').lower() == email_lower), None)


def get_user_by_username(username: str) -> Optional[Dict]:
    users = read_json(USERS_FILE)
    return next((u for u in users if u.get('username', '').lower() == username.lower()), None)


def get_user_by_id(user_id: str) -> Optional[Dict]:
    users = read_json(USERS_FILE)
    return next((u for u in users if u.get('id') == user_id), None)


def create_user(email: str, password: str, role: str = 'user') -> Dict:
    normalized_email = email.strip().lower()
    if get_user_by_email(normalized_email):
        raise ValueError('A user with this email already exists.')

    user_id = f'user-{int(datetime.now().timestamp())}'
    username = normalized_email.split('@')[0]
    new_user = {
        'id': user_id,
        'username': username,
        'email': normalized_email,
        'password': hash_password(password),
        'role': role,
        'createdAt': datetime.now().isoformat(),
    }
    users = read_json(USERS_FILE)
    users.insert(0, new_user)
    write_json(USERS_FILE, users)
    return new_user


def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed


def authenticate(identifier: str, password: str) -> Dict:
    identifier = identifier.strip()
    user = None
    if identifier.lower() == ADMIN_USERNAME:
        user = get_user_by_username(ADMIN_USERNAME)
    if user is None:
        user = get_user_by_username(identifier) or get_user_by_email(identifier)
    if not user or not verify_password(password, user.get('password', '')):
        raise ValueError('Invalid credentials')
    return user


def generate_token(user_id: str) -> str:
    token = str(uuid.uuid4())
    _token_store[token] = user_id
    return token


def get_user_by_token(token: str) -> Optional[Dict]:
    user_id = _token_store.get(token)
    if not user_id:
        return None
    return get_user_by_id(user_id)


def revoke_token(token: str) -> None:
    _token_store.pop(token, None)


def public_user(user: Dict) -> Dict:
    return {
        'id': user['id'],
        'username': user.get('username'),
        'email': user.get('email'),
        'role': user.get('role', 'user'),
        'createdAt': user.get('createdAt'),
    }
