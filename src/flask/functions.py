import bcrypt
import filetype


AUDIO_MIMES = (
    "audio/mpeg", "audio/aac", "audio/midi",
    "audio/mpeg", "audio/mp4", "audio/ogg",
    "audio/x-flac", "audio/x-wav", "audio/amr",
    "audio/x-aiff")

VIDEO_MIMES = (
 "video/3gpp", "video/mp4", "video/x-m4v",
 "video/x-matroska", "video/webm", "video/quicktime",
 "video/x-msvideo", "video/x-ms-wmv", "video/mpeg",
 "video/x-flv"
)

SALT = bcrypt.gensalt()


def get_hashed_password(plain_text_password):
    return bcrypt.hashpw(plain_text_password.encode('UTF-8'), SALT)


def check_password(plain_text_password, hashed_password):
    return bcrypt.checkpw(plain_text_password.encode('UTF-8'), bytes(hashed_password, 'UTF-8'))


def is_valid_audio(filename):
    kind = filetype.guess(filename)
    if kind.mime in AUDIO_MIMES:
        return True
    return False


def is_valid_video(filename):
    kind = filetype.guess(filename)
    if kind.mime in VIDEO_MIMES:
        return True
    return False

