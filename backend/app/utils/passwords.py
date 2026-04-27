from __future__ import annotations

import re


COMMON_PASSWORDS = {
    "123456",
    "123456789",
    "admin",
    "password",
    "qwerty",
    "senha123",
    "abc123",
    "111111",
}


def validate_password_strength(password: str) -> None:
    if len(password) < 8:
        raise ValueError("A senha deve ter pelo menos 8 caracteres.")
    if password.lower() in COMMON_PASSWORDS:
        raise ValueError("A senha informada é muito comum.")
    if not re.search(r"[A-Z]", password):
        raise ValueError("A senha deve conter pelo menos uma letra maiúscula.")
    if not re.search(r"[a-z]", password):
        raise ValueError("A senha deve conter pelo menos uma letra minúscula.")
    if not re.search(r"[0-9]", password):
        raise ValueError("A senha deve conter pelo menos um número.")
    if not re.search(r"[^\w\s]", password):
        raise ValueError("A senha deve conter pelo menos um caractere especial.")
