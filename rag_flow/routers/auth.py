from fastapi import APIRouter, Depends, Header, HTTPException, status
from typing import List

from schemas.api_schemas import AuthResponse, LoginRequest, SignupRequest, UserOut
from services.auth_service import (
    authenticate,
    create_user,
    generate_token,
    get_user_by_token,
    init_users,
    public_user,
    get_user_by_id,
)
from utils.file_utils import read_json, write_json, USERS_FILE

router = APIRouter()

# Ensure user store and admin user exist
init_users()


def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing or invalid authorization token')

    token = authorization.split(' ', 1)[1].strip()
    user = get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid or expired token')
    return user


def require_admin(current_user=Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin access required')
    return current_user

@router.post('/signup', response_model=AuthResponse)
async def signup(data: SignupRequest):
    try:
        new_user = create_user(data.email, data.password)
        token = generate_token(new_user['id'])
        return {'user': public_user(new_user), 'token': token}
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

@router.post('/login', response_model=AuthResponse)
async def login(data: LoginRequest):
    try:
        user = authenticate(data.identifier, data.password)
        token = generate_token(user['id'])
        return {'user': public_user(user), 'token': token}
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')

@router.get('/me', response_model=UserOut)
async def get_me(current_user=Depends(get_current_user)):
    return public_user(current_user)

@router.get('/users', response_model=List[UserOut])
async def list_users(current_user=Depends(require_admin)):
    users = read_json(USERS_FILE)
    return [public_user(u) for u in users]

@router.delete('/users/{user_id}')
async def delete_user(user_id: str, current_user=Depends(require_admin)):
    if user_id == current_user['id']:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Cannot delete currently authenticated admin')

    users = read_json(USERS_FILE)
    filtered = [u for u in users if u.get('id') != user_id]
    if len(filtered) == len(users):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    write_json(USERS_FILE, filtered)
    return {'success': True}
