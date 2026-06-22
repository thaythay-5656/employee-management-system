from django.core.cache import cache
import random
                                                                          
OTP_EXPIRY = 300  # 5 minutes

def generate_otp(email: str) -> str:
    code = str(random.randint(100000, 999999))
    cache.set(f"otp:{email}", code, timeout=OTP_EXPIRY)
    return code

def verify_otp(email: str, code: str) -> bool:
    stored = cache.get(f"otp:{email}")
    if stored and stored == code:
        cache.delete(f"otp:{email}")
        return True
    return False