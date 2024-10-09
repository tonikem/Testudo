# source .venv/bin/activate
# document.cookie = "testudoAuthorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMjM4OTA3NGVyN3l3cTlyZThmdTk4ZTQzd3locjl3Zjg5d3VlZjlld3k3Zjh1ZjlzdyIsImRhdGUiOiIxMC8wOS8yMDI0LCAxMzozODoyNiJ9.FMECoXw_QqXYxVMUawPZOmr545-gGr6wk__JW4L-c1c"

import os
import jwt
import json
import uuid
import base64
import datetime
import pycouchdb as pycouchdb
from pathlib import Path
from string_utils.validation import is_full_string
from sys import getsizeof
from flask import Flask, render_template, request, send_file
from flask_cors import CORS, cross_origin
from functions import check_password, is_valid_audio, is_valid_video

DATE_FORMAT = "%m/%d/%Y, %H:%M:%S"
TOKEN_EXPIRATION_TIME = 2630750  # 86400
MAX_DATA_SIZE = 6000000000  # 6GB
MAX_AUDIO_SIZE = 1000000000  # 2GB
MAX_DIRECTORY_SIZE = 12000000000  # 12GB
MAX_DIRECTORY_SIZE_PREMIUM = 500000000000  # 500GB

SECRET_KEY = "SECRET_KEY_1234"

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

PYCOUCH_DB_PASSWORD = os.environ['PYCOUCH_DB_PASSWORD']
server = pycouchdb.Server(f"http://admin:{PYCOUCH_DB_PASSWORD}@localhost:5984")

notebooks_db = server.database("notebooks")
users_db = server.database("users")


def get_user_by_id(user_id):
    for user in users_db.all():
        if user['doc']['id'] == user_id:
            return user
    return None


def get_user_by_name(username):
    for user in users_db.all():
        if user['doc']['name'] == username:
            return user
    return None


def get_notebook_by_id(notebook_id):
    for notebook in notebooks_db.all():
        if notebook['doc']['id'] == notebook_id:
            return notebook
    return None


def decode_token(token):
    if is_full_string(token) and token != 'undefined':
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    return None


def authenticate(token):
    if is_full_string(token) and token != 'undefined':
        decoded_token = decode_token(token)

        if decoded_token is None:
            return False

        user_id = decoded_token['user_id']
        token_date = datetime.datetime.strptime(decoded_token["date"], DATE_FORMAT)
        datetime_now = datetime.datetime.now()

        user = get_user_by_id(user_id)

        expiration = token_date + datetime.timedelta(seconds=TOKEN_EXPIRATION_TIME)
        return user and datetime_now < expiration

    return False


def get_user_by_notebook_id(notebook_id):
    for user in users_db.all():
        if notebook_id in user['doc']['notebooks']:
            return user
    return None


@app.route('/')
@app.route('/home')
@app.route('/notebooks')
def index():
    if request.cookies:
        auth_token = request.cookies["testudoAuthorization"]
        if authenticate(auth_token):
            return render_template("index.html")

    return render_template('login.html')


@cross_origin()
@app.route('/video/<auth_token>/<filename>')
def get_video_files(auth_token, filename):
    if authenticate(auth_token) and is_full_string(filename) and filename != 'undefined':
        decoded_token = decode_token(auth_token)

        if decoded_token is None:
            return {"Status": "Failure. Missing token!"}, 404

        user_id = decoded_token["user_id"]

        return send_file(f"./files/{user_id}/{filename}", as_attachment=True)

    return {"Status": "Failure. Missing token!"}, 404


@cross_origin()
@app.route('/video/<auth_token>/<filename>', methods=["POST"])
def save_video_file(auth_token, filename):
    if authenticate(auth_token) and is_full_string(filename) and filename != 'undefined':
        decoded_token = decode_token(auth_token)

        if decoded_token is None:
            return {"Status": "Failure. Missing token!"}, 404

        user_id = decoded_token["user_id"]
        folder = f'./files/{user_id}/'
        Path(folder).mkdir(parents=True, exist_ok=True)

        if getsizeof(request.data) > MAX_AUDIO_SIZE:
            return {"message": f"Content too large. Max size is {MAX_AUDIO_SIZE} bytes"}, 413

        total_size = 0  # Lasketaan kansion tiedostojen yhteiskoko

        for path, dirs, files in os.walk(folder):
            for f in files:
                fp = os.path.join(path, f)
                total_size += os.path.getsize(fp)

        total_size += getsizeof(request.data)

        if total_size > MAX_DIRECTORY_SIZE:
            return {"message": f"Content too large. Max size is {MAX_DIRECTORY_SIZE} bytes"}, 413

        with open(folder + filename, "wb") as file:
            file.write(request.data)

        if is_valid_video(folder + filename):
            return {"message": "Successfully saved a file"}, 200, {"Access-Control-Allow-Origin": "*"}
        else:
            os.remove(folder + filename)
            return {"message": "Not a video file!"}, 403

    return {"Status": "Failure. Missing token or filename!"}, 404


@cross_origin()
@app.route('/audio/<auth_token>/<filename>')
def get_audio_files(auth_token, filename):
    if authenticate(auth_token) and is_full_string(filename) and filename != 'undefined':
        decoded_token = decode_token(auth_token)

        if decoded_token is None:
            return {"Status": "Failure. Missing token!"}, 404

        user_id = decoded_token["user_id"]

        return send_file(f"./files/{user_id}/{filename}", as_attachment=True)

    return {"Status": "Failure. Missing token!"}, 404


@cross_origin()
@app.route('/audio/<auth_token>/<filename>', methods=["POST"])
def save_audio_file(auth_token, filename):
    if authenticate(auth_token) and is_full_string(filename) and filename != 'undefined':
        decoded_token = decode_token(auth_token)

        if decoded_token is None:
            return {"Status": "Failure. Missing token!"}, 404

        user_id = decoded_token["user_id"]
        folder = f'./files/{user_id}/'
        Path(folder).mkdir(parents=True, exist_ok=True)

        if getsizeof(request.data) > MAX_AUDIO_SIZE:
            return {"message": f"Content too large. Max size is {MAX_AUDIO_SIZE} bytes"}, 413

        total_size = 0  # Lasketaan kansion tiedostojen yhteiskoko

        for path, dirs, files in os.walk(folder):
            for f in files:
                fp = os.path.join(path, f)
                total_size += os.path.getsize(fp)

        total_size += getsizeof(request.data)

        if total_size > MAX_DIRECTORY_SIZE:
            return {"message": f"Content too large. Max size is {MAX_DIRECTORY_SIZE} bytes"}, 413

        with open(folder + filename, "wb") as file:
            file.write(request.data)

        if is_valid_audio(folder + filename):
            return {"message": "Successfully saved a file"}, 200, {"Access-Control-Allow-Origin": "*"}
        else:
            os.remove(folder + filename)
            return {"message": "Not an audio file!"}, 403

    return {"Status": "Failure. Missing token or filename!"}, 404


@cross_origin()
@app.route('/audio/<auth_token>/<filename>', methods=['GET', 'DELETE'])
def delete_audio_file(auth_token, filename):
    if authenticate(auth_token) and is_full_string(filename) and filename != 'undefined':
        decoded_token = decode_token(auth_token)

        if decoded_token is None:
            return {"Status": "Failure. Missing token!"}, 404

        user_id = decoded_token["user_id"]

        os.remove(f'./files/{user_id}/{filename}')

        return {"message": "Successfully deleted an audio file"}, 200

    return {"Status": "Failure. Missing token or filename!"}, 404


@cross_origin()
@app.route('/note/<notebook_id>/<note_id>')
def get_individual_note(notebook_id, note_id):
    if is_full_string(notebook_id) and is_full_string(note_id):
        old_notebook = notebooks_db.get(notebook_id)

        if 'published' in old_notebook.keys() and old_notebook['published']:
            user = get_user_by_notebook_id(notebook_id)
            user_id = user['doc']['id']

            for item in old_notebook['items']:
                for note in item['content']:
                    if note['url-id'] == note_id:
                        if note['type'] == 'Audio':
                            with open(f'./files/{user_id}/{note['payload']}', 'rb') as file:
                                file_type = note['payload'].split('.')[-1]
                                base64_data = base64.b64encode(file.read()).decode('ascii')
                                audio_file = f"data:audio/{file_type};base64,{base64_data}"
                                return render_template('audio.html', file_name=note['payload'], audio_file=audio_file)
                        elif note['type'] == 'Video':
                            with open(f'./files/{user_id}/{note['payload']}', 'rb') as file:
                                file_type = note['payload'].split('.')[-1]
                                base64_data = base64.b64encode(file.read()).decode('ascii')
                                video_file = f"data:video/{file_type};base64,{base64_data}"
                                return render_template('video.html', file_name=note['payload'], video_file=video_file)
                        else:
                            return render_template('file.html', file_name=note['name'], file_payload=note['payload'])

            return {"message": "File was not found!"}, 404

    return {"Status": "Failure. Missing token!"}, 404


@cross_origin()
@app.route('/notebooks/<auth_token>')
def get_notebooks_without_items(auth_token):
    if authenticate(auth_token):
        collected_notebooks = []

        decoded_token = decode_token(auth_token)

        if decoded_token is None:
            return {"Status": "Failure. Missing token!"}, 404

        user_id = decoded_token["user_id"]
        user = get_user_by_id(user_id)

        for notebook in notebooks_db.all():
            if notebook['doc']['_id'] in user['doc']["notebooks"]:
                collected_notebook = {
                    "id": notebook['doc']["id"],
                    "_id": notebook['doc']["_id"],
                    "name": notebook['doc']["name"]
                }
                if 'visible' in notebook['doc'].keys():
                    collected_notebook["visible"] = notebook['doc']["visible"]
                else:
                    collected_notebook["visible"] = False

                collected_notebooks.append(collected_notebook)

        return {"main": collected_notebooks}
    else:
        return {"Status": "Failure. Missing token!"}, 404


@cross_origin()
@app.route('/notebooks/<auth_token>', methods=['PUT'])
def save_bare_notebooks(auth_token):
    if authenticate(auth_token):
        decoded_token = decode_token(auth_token)

        if decoded_token is None:
            return {"Status": "Failure. Missing token!"}, 404

        new_notebooks_found = False
        user_id = decoded_token["user_id"]
        user = get_user_by_id(user_id)
        notebooks = user['doc']['notebooks']
        bare_bone_notebooks = json.loads(request.data)

        for bare_bone_notebook in bare_bone_notebooks['main']:
            try:
                _id = bare_bone_notebook['_id']
                old_notebook = notebooks_db.get(_id)
                notebook_to_be_saved = {
                    'id': old_notebook['id'],
                    '_id': _id,
                    '_rev': old_notebook['_rev'],
                    'name': old_notebook['name'],
                    'visible': bare_bone_notebook['visible'],
                }

                if 'items' in old_notebook.keys():
                    notebook_to_be_saved['items'] = old_notebook['items']
                else:
                    notebook_to_be_saved['items'] = []

                if 'published' in old_notebook.keys():
                    notebook_to_be_saved['published'] = old_notebook['published']
                else:
                    notebook_to_be_saved['published'] = False

                saved_notebook = notebooks_db.save(notebook_to_be_saved)

            except KeyError:
                notebook_to_be_saved = {
                    'id': bare_bone_notebook['id'],
                    'name': bare_bone_notebook['name'],
                    'visible': bare_bone_notebook['visible'],
                }

                if 'items' in bare_bone_notebook.keys():
                    notebook_to_be_saved['items'] = bare_bone_notebook['items']
                else:
                    notebook_to_be_saved['items'] = []

                if 'published' in bare_bone_notebook.keys():
                    notebook_to_be_saved['published'] = bare_bone_notebook['published']
                else:
                    notebook_to_be_saved['published'] = False

                saved_notebook = notebooks_db.save(notebook_to_be_saved)

            if saved_notebook['_id'] not in notebooks:
                new_notebooks_found = True
                notebooks.insert(0, saved_notebook['_id'])

        if new_notebooks_found:
            user_to_be_saved = {
                "_id": user['doc']['_id'],
                "_rev": user['doc']['_rev'],
                "id": user['doc']['id'],
                "name": user['doc']['name'],
                "password": user['doc']['password'],
                "notebooks": notebooks
            }
            users_db.save(user_to_be_saved)

        return {"message": "Success"}, 200, {"Access-Control-Allow-Origin": "*"}

    return {"Status": "Failure. Missing token!"}, 404


@cross_origin()
@app.route('/login', methods=["POST"])
def login_to_user():
    try:
        data = json.loads(request.data)
        username = data["username"]
        password = data["password"]

        user = get_user_by_name(username)

        if user is None:
            return {"Status": "Failure. User not found!"}, 404

        hashed_password = user['doc']['password']
        user_id = user['doc']["id"]

        if check_password(password, hashed_password):
            token_date = datetime.datetime.now().strftime(DATE_FORMAT)
            res_data = {
                "username": username,
                "token": jwt.encode({
                    "user_id": user_id,
                    "date": str(token_date)
                }, "SECRET_KEY_1234", algorithm="HS256")
            }
            return {"message": "Successfully fetched auth token", "data": res_data}, 200
        else:
            return {"message": "Failure. Password not found!"}, 404

    except json.decoder.JSONDecodeError:
        return {"message": "Fail. Unwanted JSON-document."}, 400


@cross_origin()
@app.route('/data/<auth_token>')
def get_notebooks_and_items(auth_token):
    if authenticate(auth_token):
        collected_notebooks = []

        decoded_token = decode_token(auth_token)

        if decoded_token is None:
            return {"Status": "Failure. Missing token!"}, 404

        user_id = decoded_token["user_id"]
        user = get_user_by_id(user_id)

        for notebook in notebooks_db.all():
            if notebook['doc']['_id'] in user['doc']["notebooks"]:
                if 'visible' in notebook['doc'].keys() and notebook['doc']["visible"]:
                    collected_notebook = {
                        '_id': notebook['doc']["_id"],
                        "id": notebook['doc']["id"],
                        "name": notebook['doc']["name"],
                        "visible": notebook['doc']["visible"],
                        "items": notebook['doc']["items"]
                    }

                    if 'published' in notebook['doc'].keys():
                        collected_notebook['published'] = notebook['doc']['published']
                    else:
                        collected_notebook['published'] = False

                    if 'items' in notebook['doc'].keys():
                        collected_notebook['items'] = notebook['doc']['items']
                    else:
                        collected_notebook['items'] = []

                    collected_notebooks.append(collected_notebook)

        result = {"main": collected_notebooks}

        if getsizeof(result) > MAX_DATA_SIZE:
            return {"message": f"Content too large. Max size is {MAX_DATA_SIZE} bytes."}, 413, {"Access-Control-Allow-Origin": "*"}

        return result
    else:
        return {"Status": "Failure. Missing token!"}, 404


@cross_origin()
@app.route("/data/<auth_token>", methods=["PUT"])
def save_notebooks(auth_token):
    if authenticate(auth_token):
        data = json.loads(request.data)
        json_data = json.dumps(data, indent=4)

        if getsizeof(json_data) > MAX_DATA_SIZE:
            return {"message": f"Content too large. Max size is {MAX_DATA_SIZE} bytes"}, 413

        decoded_token = decode_token(auth_token)

        if decoded_token is None:
            return {"Status": "Failure. Missing token!"}, 404

        user_id = decoded_token["user_id"]
        user = get_user_by_id(user_id)
        notebooks = user['doc']['notebooks']

        for notebook in data["main"]:
            if '_id' in notebook.keys():
                old_notebook = notebooks_db.get(notebook['_id'])
                new_notebook = {
                    '_id': old_notebook['_id'],
                    '_rev': old_notebook['_rev'],
                    'id': notebook['id'],
                    'items': notebook['items'],
                    'name': notebook['name'],
                }

                if 'visible' in notebook.keys():
                    new_notebook['visible'] = notebook['visible']
                else:
                    new_notebook['visible'] = False

                if 'published' in notebook.keys():
                    new_notebook['published'] = notebook['published']
                else:
                    new_notebook['published'] = False

                for i, item in enumerate(new_notebook['items']):
                    if 'url-id' not in item.keys():
                        new_notebook['items'][i]['url-id'] = str(uuid.uuid4())

                    if 'content' in new_notebook['items'][i].keys():
                        for u, note in enumerate(new_notebook['items'][i]['content']):
                            if 'url-id' not in note.keys():
                                new_notebook['items'][i]['content'][u]['url-id'] = str(uuid.uuid4())

                saved_notebook = notebooks_db.save(new_notebook)
            else:
                saved_notebook = notebooks_db.save(notebook)

            if saved_notebook['_id'] not in notebooks:
                notebooks.insert(0, saved_notebook['_id'])

        user_to_be_saved = {
            "_id": user['doc']['_id'],
            "_rev": user['doc']['_rev'],
            "id": user['doc']['id'],
            "name": user['doc']['name'],
            "password": user['doc']['password'],
            "notebooks": notebooks
        }
        users_db.save(user_to_be_saved)

        return {"message": "Success"}, 200, {"Access-Control-Allow-Origin": "*"}

    return {"Status": "Failure. Missing token!"}, 404


@cross_origin()
@app.route("/data/<auth_token>", methods=["DELETE"])
def delete_data(auth_token):
    if authenticate(auth_token):
        decoded_token = decode_token(auth_token)

        if decoded_token is None:
            return {"Status": "Failure. Missing token!"}, 404

        user_id = decoded_token["user_id"]
        user = get_user_by_id(user_id)
        notebooks = user['doc']['notebooks']

        data = json.loads(request.data)
        notebook_id = data['_id']

        # Varmistetaan, että oikea käyttäjä poistaa notebookin
        if notebook_id not in notebooks:
            return {"message": "You don't own this notebook."}, 401

        found_notebook = notebooks_db.get(notebook_id)
        print(found_notebook)

        # Poistetaan notebook tietokannasta
        notebook_to_be_deleted = {
            '_id': found_notebook['_id']
        }
        notebooks_db.delete(notebook_to_be_deleted)

        # poistetaan notebook id käyttäjältä
        notebooks.remove(notebook_id)

        user_to_be_saved = {
            "_id": user['doc']['_id'],
            '_rev': user['doc']['_rev'],
            "id": user['doc']['id'],
            "name": user['doc']['name'],
            "password": user['doc']['password'],
            "notebooks": notebooks
        }
        users_db.save(user_to_be_saved)

        return {"message": "Deleted notebook."}, 200, {"Access-Control-Allow-Origin": "*"}

    return {"Status": "Failure. Missing token!"}, 404


if __name__ == "__main__":
    app.run(host='127.0.0.1', port=5000, debug=True)


