"""
Authentication endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import verify_password, get_password_hash, create_access_token, get_current_user
import uuid

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """Login endpoint for both admin and customers"""
    user = db.query(models.User).filter(
        models.User.username == credentials.username
    ).first()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    access_token = create_access_token(data={"sub": user.user_id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.user_id,
        "role": user.role
    }


@router.get("/me", response_model=schemas.User)
def get_current_user_info(current_user: models.User = Depends(get_current_user)):
    """Get current authenticated user information"""
    return current_user

