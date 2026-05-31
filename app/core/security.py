import hashlib
import os

def get_password_hash(password: str) -> str:
    """
    Genera un hash PBKDF2-SHA256 seguro a partir de una contraseña en texto plano,
    con sal aleatoria e iteraciones. Retorna en formato 'salt$hash'.
    """
    salt = os.urandom(16)
    db_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return salt.hex() + "$" + db_hash.hex()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica que la contraseña en texto plano coincida con el hash almacenado.
    """
    try:
        if not hashed_password or "$" not in hashed_password:
            return False
        salt_hex, hash_hex = hashed_password.split("$", 1)
        salt = bytes.fromhex(salt_hex)
        db_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, 100000)
        return db_hash.hex() == hash_hex
    except Exception:
        return False
