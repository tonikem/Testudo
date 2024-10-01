import bcrypt
import filetype


AUDIO_MIMES = (
    "audio/mpeg", "audio/aac", "audio/midi",
    "audio/mpeg", "audio/mp4", "audio/ogg",
    "audio/x-flac", "audio/x-wav", "audio/amr",
    "audio/x-aiff")

SALT = bcrypt.gensalt()


def get_hashed_password(plain_text_password):
    return bcrypt.hashpw(plain_text_password.encode('UTF-8'), SALT)


def check_password(plain_text_password, hashed_password):
    return bcrypt.checkpw(plain_text_password.encode('UTF-8'), bytes(hashed_password, 'UTF-8'))


def is_valid_audio(filename):
    kind = filetype.guess(filename)

    if kind is None:
        return False

    if kind.mime in AUDIO_MIMES:
        return True

    return False

