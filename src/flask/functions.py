import bcrypt


SALT = bcrypt.gensalt()


def get_hashed_password(plain_text_password):
    return bcrypt.hashpw(plain_text_password.encode('UTF-8'), SALT)


def check_password(plain_text_password, hashed_password):
    return bcrypt.checkpw(plain_text_password.encode('UTF-8'), bytes(hashed_password, 'UTF-8'))


def is_valid_mp3(filelike):
    """
    Stolen from:
    http://blog.eringal.com/python/verifying-that-an-mp3-file-is-valid-in-python/

    @param filelike: StringIO or BytesIO
    """
    frame_sync_char = bytes([255])
    is_valid = False

    block = filelike.read(1024)
    frame_start = block.find(frame_sync_char)
    block_count = 0  # abort after 64k
    while len(block) > 0 and frame_start == -1 and block_count < 64:
        block = filelike.read(1024)
        frame_start = block.find(frame_sync_char)
        block_count += 1

    if frame_start > -1:
        frame_hdr = block[frame_start:frame_start + 4]
        is_valid = bytes([frame_hdr[0]]) == frame_sync_char

        mpeg_version = ''
        layer_desc = ''
        uses_crc = False
        bitrate = 0
        sample_rate = 0
        padding = False
        frame_length = 0

        if is_valid:
            is_valid = ord(bytes([frame_hdr[1]])) & 0xe0 == 0xe0  # validate the rest of the frame_sync bits exist

        if is_valid:
            if ord(bytes([frame_hdr[1]])) & 0x18 == 0:
                mpeg_version = '2.5'
            elif ord(bytes([frame_hdr[1]])) & 0x18 == 0x10:
                mpeg_version = '2'
            elif ord(bytes([frame_hdr[1]])) & 0x18 == 0x18:
                mpeg_version = '1'
            else:
                is_valid = False

        if is_valid:
            if ord(bytes([frame_hdr[1]])) & 6 == 2:
                layer_desc = 'Layer III'
            elif ord(bytes([frame_hdr[1]])) & 6 == 4:
                layer_desc = 'Layer II'
            elif ord(bytes([frame_hdr[1]])) & 6 == 6:
                layer_desc = 'Layer I'
            else:
                is_valid = False

        if is_valid:
            uses_crc = ord(bytes([frame_hdr[1]])) & 1 == 0

            bitrate_chart = [
                [0, 0, 0, 0, 0],
                [32, 32, 32, 32, 8],
                [64, 48, 40, 48, 16],
                [96, 56, 48, 56, 24],
                [128, 64, 56, 64, 32],
                [160, 80, 64, 80, 40],
                [192, 96, 80, 96, 40],
                [224, 112, 96, 112, 56],
                [256, 128, 112, 128, 64],
                [288, 160, 128, 144, 80],
                [320, 192, 160, 160, 96],
                [352, 224, 192, 176, 112],
                [384, 256, 224, 192, 128],
                [416, 320, 256, 224, 144],
                [448, 384, 320, 256, 160]]
            bitrate_index = ord(bytes([frame_hdr[2]])) >> 4
            if bitrate_index == 15:
                is_valid = False
            else:
                bitrate_col = 0
                if mpeg_version == '1':
                    if layer_desc == 'Layer I':
                        bitrate_col = 0
                    elif layer_desc == 'Layer II':
                        bitrate_col = 1
                    else:
                        bitrate_col = 2
                else:
                    if layer_desc == 'Layer I':
                        bitrate_col = 3
                    else:
                        bitrate_col = 4
                bitrate = bitrate_chart[bitrate_index][bitrate_col]
                is_valid = bitrate > 0

        if is_valid:
            sample_rate_chart = [
                [44100, 22050, 11025],
                [48000, 24000, 12000],
                [32000, 16000, 8000]]
            sample_rate_index = (ord(bytes([frame_hdr[2]])) & 0xc) >> 2
            if sample_rate_index != 3:
                sample_rate_col = 0
                if mpeg_version == '1':
                    sample_rate_col = 0
                elif mpeg_version == '2':
                    sample_rate_col = 1
                else:
                    sample_rate_col = 2
                sample_rate = sample_rate_chart[sample_rate_index][sample_rate_col]
            else:
                is_valid = False

        if is_valid:
            padding = ord(bytes([frame_hdr[2]])) & 1 == 1

            padding_length = 0
            if layer_desc == 'Layer I':
                if padding:
                    padding_length = 4
                frame_length = (12 * bitrate * 1000 // sample_rate + padding_length) * 4
            else:
                if padding:
                    padding_length = 1
                frame_length = 144 * bitrate * 1000 // sample_rate + padding_length
            is_valid = frame_length > 0

            # Verify the next frame
            if frame_start + frame_length < len(block):
                is_valid = bytes([block[frame_start + frame_length]]) == frame_sync_char
            else:
                offset = (frame_start + frame_length) - len(block)
                block = filelike.read(1024)
                if len(block) > offset:
                    is_valid = bytes([block[offset]]) == frame_sync_char
                else:
                    is_valid = False

    return is_valid


