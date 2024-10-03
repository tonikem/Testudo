import os
import jwt
import json
import datetime
import pycouchdb
from pathlib import Path
from string_utils.validation import is_full_string
from sys import getsizeof
from flask import Flask, render_template, request, send_file
from flask_cors import CORS, cross_origin
from functions import check_password, is_valid_audio


DATE_FORMAT = "%m/%d/%Y, %H:%M:%S"
TOKEN_EXPIRATION_TIME = 2630750  # 86400
MAX_DATA_SIZE = 6000000000  # 6GB
MAX_AUDIO_SIZE = 1000000000  # 2GB
MAX_DIRECTORY_SIZE = 12000000000  # 12GB
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


@app.route('/')
@app.route('/home')
@app.route('/notebooks')
def index():
    if request.cookies:
        auth_token = request.cookies["testudoAuthorization"]
        if authenticate(auth_token):
            return render_template("index.html")

    # Kirjautuminen mobiililaitteita varten
    if authenticate(request.args.get('cookie')):
        return render_template("index.html")

    return render_template('login.html')


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
            if notebook['doc']['id'] in user['doc']["notebooks"]:
                if 'visible' in notebook['doc'].keys():
                    if notebook['doc']['visible']:
                        collected_notebook = {
                            "id": notebook['doc']["id"],
                            "name": notebook['doc']["name"],
                            "visible": notebook['doc']["visible"],
                            "items": notebook['doc']["items"]
                        }

                        if 'items' in notebook['doc'].keys():
                            notebook['items'] = notebook['doc']['items']
                        else:
                            notebook['items'] = []

                        if collected_notebook['visible']:
                            collected_notebooks.append(collected_notebook)

        result = {"main": collected_notebooks}

        if getsizeof(result) > MAX_DATA_SIZE:
            return {"message": f"Content too large. Max size is {MAX_DATA_SIZE} bytes"}, 413, {"Access-Control-Allow-Origin": "*"}

        return result
    else:
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
            if notebook['doc']['id'] in user['doc']["notebooks"]:
                collected_notebook = {
                    "id": notebook['doc']["id"],
                    "name": notebook['doc']["name"]
                }
                if 'visible' in notebook['doc']:
                    collected_notebook["visible"] = notebook['doc']["visible"]
                else:
                    collected_notebook["visible"] = False

                collected_notebooks.append(collected_notebook)

        return {"main": collected_notebooks}
    else:
        return {"Status": "Failure. Missing token!"}, 404


@cross_origin()
@app.route('/notebooks/<auth_token>', methods=['PUT'])
def save_new_notebooks(auth_token):
    if authenticate(auth_token):
        decoded_token = decode_token(auth_token)

        if decoded_token is None:
            return {"Status": "Failure. Missing token!"}, 404

        bare_bone_notebooks = json.loads(request.data)

        for notebook in bare_bone_notebooks['main']:
            old_notebook = get_notebook_by_id(notebook['id'])

            new_notebook = {
                'id': notebook['id'],
                'name': notebook['name'],
                '_id': old_notebook['doc']['_id'],
                '_rev': old_notebook['doc']['_rev']
            }

            if 'items' in old_notebook['doc'].keys():
                new_notebook['items'] = old_notebook['doc']['items']
            else:
                new_notebook['items'] = []

            if 'visible' in notebook.keys():
                new_notebook['visible'] = notebook['visible']
            else:
                new_notebook['visible'] = False

            notebooks_db.save(new_notebook)

        return {"message": "Successfully updated Notebook"}, 200
    else:
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
@app.route("/data/<auth_token>", methods=["PUT"])
def update_data(auth_token):
    if authenticate(auth_token):
        data = json.loads(request.data)
        json_data = json.dumps(data, indent=4)
        new_notebooks_found = False

        if getsizeof(json_data) > MAX_DATA_SIZE:
            return {"message": f"Content too large. Max size is {MAX_DATA_SIZE} bytes"}, 413

        decoded_token = decode_token(auth_token)

        if decoded_token is None:
            return {"Status": "Failure. Missing token!"}, 404

        user_id = decoded_token["user_id"]
        user = get_user_by_id(user_id)
        notebooks = user['doc']['notebooks']

        for notebook in data["main"]:
            if notebook['id'] not in notebooks:
                new_notebooks_found = True
                notebooks.insert(0, notebook['id'])
                notebooks_db.save(notebook)
            else:
                found_notebook = get_notebook_by_id(notebook['id'])

                notebook_to_be_saved = {
                    '_id': found_notebook['doc']['_id'],
                    '_rev': found_notebook['doc']['_rev'],
                    'id': notebook['id'],
                    'name': notebook['name']
                }

                if 'items' in notebook.keys():
                    notebook_to_be_saved['items'] = notebook['items']
                else:
                    notebook_to_be_saved['items'] = []

                notebooks_db.save(notebook_to_be_saved)

        if new_notebooks_found:
            user_to_be_saved = {
                "_id": user['doc']['_id'],
                '_rev': user['doc']['_rev'],
                "id": user['doc']['id'],
                "name": user['doc']['name'],
                "password": user['doc']['password'],
                "notebooks": notebooks
            }
            users_db.save(user_to_be_saved)

        return {"message": "Success"}, 200, {"Access-Control-Allow-Origin": "*"}
    else:
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
        notebook_id = data['id']

        # Varmistetaan, että oikea käyttäjä poistaa notebookin
        if notebook_id not in notebooks:
            return {"message": "You don't own this notebook."}, 401

        found_notebook = get_notebook_by_id(notebook_id)

        # Poistetaan notebook tietokannasta
        notebook_to_be_deleted = {
            '_id': found_notebook['doc']['_id']
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
    # context = ('./ssl/cert.pem', './ssl/key.pem')
    app.run(host='0.0.0.0', port=5000, debug=True)  # ssl_context=context


