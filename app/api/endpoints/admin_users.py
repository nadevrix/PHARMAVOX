from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel, EmailStr

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserOut
from app.core.security import get_password_hash, verify_password

router = APIRouter()

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/users/login", response_model=UserOut)
async def login_user(
    login_in: UserLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Autentica un usuario en el sistema con email y contraseña.
    """
    db_user = db.query(User).filter(User.email == login_in.email).first()
    if not db_user or not verify_password(login_in.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales de acceso incorrectas."
        )
    return db_user


def require_admin(x_role: str = Header("pharmacist", description="Cabecera para control de acceso simulado. Requiere: admin")):
    if x_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Se requieren permisos de administrador."
        )
    return x_role

@router.get("/admin/users", response_model=List[UserOut])
async def list_users(
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin)
):
    """
    Lista todos los usuarios registrados en el sistema. (Solo Admin)
    """
    return db.query(User).all()

@router.post("/admin/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin)
):
    """
    Crea una nueva cuenta de usuario en el sistema. (Solo Admin)
    """
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario registrado con este correo electrónico."
        )
    
    hashed_pwd = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        role=user_in.role,
        timezone=user_in.timezone,
        hashed_password=hashed_pwd
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/admin/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin)
):
    """
    Actualiza la información de un usuario existente. (Solo Admin)
    """
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado."
        )
    
    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data:
        raw_password = update_data.pop("password")
        if raw_password:
            db_user.hashed_password = get_password_hash(raw_password)
            
    for field, value in update_data.items():
        setattr(db_user, field, value)
        
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/admin/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin)
):
    """
    Elimina un usuario del sistema por completo. (Solo Admin)
    """
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado."
        )
        
    db.delete(db_user)
    db.commit()
    return None
