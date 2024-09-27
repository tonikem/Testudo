import os
import jwt
import json
import datetime
import pycouchdb
from string_utils.validation import is_url
from sys import getsizeof
from flask import Flask, render_template, request, redirect
from flask_cors import CORS, cross_origin
from flask_restful import Resource, Api
from functions import check_password


DATE_FORMAT = "%m/%d/%Y, %H:%M:%S"
TOKEN_EXPIRATION_TIME = 2630750  # 86400  # <- 1 päivä
MAX_DATA_SIZE = 6000000000  # 6GB

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

PYCOUCH_DB_PASSWORD = os.environ['PYCOUCH_DB_PASSWORD']
server = pycouchdb.Server(f"http://admin:{PYCOUCH_DB_PASSWORD}@localhost:5984")

notebooks_db = server.database("notebooks")
users_db = server.database("users")


def decode_token(token):
    if token == "undefined":
        return None
    return jwt.decode(token, "SECRET_KEY_1234", algorithms=["HS256"])


def get_user_by_id(user_id):
    for user in users_db.all():
        if user['doc']['id'] == user_id:
            return user
    return None


def get_user_by_name(username):
    for user in users_db.all():
        if user['doc']['username'] == username:
            return user
    return None


def get_notebook_by_id(notebook_id):
    for notebook in notebooks_db.all():
        if notebook['doc']['id'] == notebook_id:
            return notebook
    return None


def authenticate(token):
    if token and is_url(f"http://127.0.0.1:5000/data/{token}"):
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


def update_notebook(id, json):
    doc = get_notebook_by_id(id)
    doc["firstName"] = json["firstName"]
    doc = notebooks_db.save(doc)
    print(doc['_id'], doc['_rev'])
    print("Saved!")


@app.route('/')
def index():
    if request.cookies:
        auth_token = request.cookies["testudoAuthorization"]
        if authenticate(auth_token):
            return render_template("index.html")

    return render_template('login.html')


@cross_origin()
@app.route('/data/<auth_token>')
def test_json(auth_token):
    if authenticate(auth_token):
        collected_notebooks = []
        decoded_token = decode_token(auth_token)

        if decoded_token is None:
            return {"Status": "Failure. Missing token!"}, 404

        user_id = decoded_token["user_id"]
        user = get_user_by_id(user_id)  # users_col.find_one({"id": user_id})

        for notebook_id in user["notebooks"]:
            notebook = get_notebook_by_id(notebook_id)  # notebooks_col.find_one({"id": notebook_id})
            if notebook:
                collected_notebook = {
                    "id": notebook["id"],
                    "name": notebook["name"],
                    "items": notebook["items"]
                }
                collected_notebooks.append(collected_notebook)

        result = {"main": collected_notebooks}

        if getsizeof(result) > MAX_DATA_SIZE:
            return {"message": f"Content too large. Max size is {MAX_DATA_SIZE} bytes"}, 413, {"Access-Control-Allow-Origin": "*"}

        return result
    else:
        return {"Status": "Failure. Missing token!"}, 404


@cross_origin()
@app.route('/login', methods=["POST"])
def login_to_user():
    try:
        data = json.loads(request.data)
        username = data["username"]
        password = data["password"]

        user = get_user_by_name(username)  # users_col.find_one({'name': username})
        print(user)

        if user is None:
            return {"Status": "Failure. User not found!"}, 404

        hashed_password = user['password']
        user_id = user["id"]

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

        if getsizeof(json_data) > MAX_DATA_SIZE:
            return {"message": f"Content too large. Max size is {MAX_DATA_SIZE} bytes"}, 413, {"Access-Control-Allow-Origin": "*"}

        # Etsitään käyttäjä
        luotu_uusi_notebook = False
        decoded_token = decode_token(auth_token)

        if decoded_token is None:
            return {"Status": "Failure. Missing token!"}, 404

        user_id = decoded_token["user_id"]
        user = get_user_by_id(user_id)  # users_col.find_one({"id": user_id})
        notebooks = user['notebooks']

        for obj in data["main"]:
            # query_filter = {'id': obj['id']}
            notebook = get_notebook_by_id(obj['id'])  # notebooks_col.find_one(query_filter)

            if notebook:
                # notebooks_col.update_one(query_filter, update_operation
                pass
            else:
                # notebooks_col.insert_one(obj)
                pass

            if obj['id'] not in notebooks:
                luotu_uusi_notebook = True
                notebooks.insert(0, obj['id'])

        if luotu_uusi_notebook:
            new_user = {
                "id": user["id"],
                "name": user["name"],
                "password": user["password"],
                "tokens": user["tokens"],
                "notebooks": notebooks
            }
            query_filter = {'id': user['id']}
            update_operation = {'$set': new_user}
            users_col.update_one(query_filter, update_operation)

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
        user = users_col.find_one({"id": user_id})
        notebooks = user['notebooks']

        data = json.loads(request.data)
        notebook_id = data['id']

        # Varmistetaan, että oikea käyttäjä poistaa notebookin
        if notebook_id not in notebooks:
            return {"message": "You don't own this notebook."}, 401

        # Poistetaan notebook
        notebooks_col.delete_one({'id': notebook_id})

        # poistetaan notebook id käyttäjältä
        notebooks.remove(notebook_id)

        new_user = {
            "id": user["id"],
            "name": user["name"],
            "password": user["password"],
            "tokens": user["tokens"],
            "notebooks": notebooks
        }

        query_filter = {'id': user['id']}
        update_operation = {'$set': new_user}
        users_col.update_one(query_filter, update_operation)

        return {"message": "Deleted notebook."}, 200, {"Access-Control-Allow-Origin": "*"}

    return {"Status": "Failure. Missing token!"}, 404


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)


