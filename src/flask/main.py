import jwt
import json
import datetime
import requests
from pymongo import MongoClient
from sys import getsizeof
from flask import Flask, render_template, request, redirect
from flask_cors import CORS, cross_origin
from flask_restful import Resource, Api
from functions import check_password


DATE_FORMAT = "%m/%d/%Y, %H:%M:%S"
TOKEN_EXPIRATION_TIME = 86400  # <- 1 päivä
MAX_DATA_SIZE = 6000000000  # 6GB

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

mongo_client = MongoClient("localhost", 27017)

# Tietokannat
testudo_users_db = mongo_client["TestudoUsers"]
testudo_data_db = mongo_client["TestudoData"]

# Tietokanta sarakkeet
notebooks_col = testudo_data_db["notebooks"]
users_col = testudo_users_db["users"]


def decode_token(token):
    return jwt.decode(token, "SECRET_KEY_1234", algorithms=["HS256"])


def authenticate(token):
    if token:
        decoded_token = decode_token(token)
        user_id = decoded_token['user_id']
        token_date = decoded_token["date"]
        token_date = datetime.datetime.strptime(token_date, DATE_FORMAT)
        datetime_now = datetime.datetime.now()
        auth_user = users_col.find_one({"id": user_id})
        expiration = token_date + datetime.timedelta(seconds=TOKEN_EXPIRATION_TIME)
        return auth_user and datetime_now < expiration
    else:
        return False


@app.route('/')
def index():
    if request.cookies:
        token = request.cookies["testudoAuthorization"]
        if authenticate(token):
            return render_template("index.html")

    return render_template('login.html')


@cross_origin()
@app.route('/data/<auth_token>')
def test_json(auth_token):

    if authenticate(auth_token):
        collected_notebooks = []
        decoded_token = decode_token(auth_token)
        user_id = decoded_token["user_id"]
        user = users_col.find_one({"id": user_id})

        for notebook_id in user["notebooks"]:
            notebook = notebooks_col.find_one({"id": notebook_id})
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

    return {"Status": "Failure. Missing token!"}, 404


@cross_origin()
@app.route('/login', methods=["POST"])
def login_to_user():
    data = json.loads(request.data)
    username = data["username"]
    password = data["password"]

    response = users_col.find_one({'name': username})

    if response is None:
        return {"Status": "Failure. User not found!"}, 404

    hashed_password = response['password']
    user_id = response["id"]

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


@cross_origin()
@app.route("/data", methods=["PUT"])
def update_data():
    data = json.loads(request.data)
    json_data = json.dumps(data, indent=4)

    if getsizeof(json_data) > MAX_DATA_SIZE:
        return {"message": f"Content too large. Max size is {MAX_DATA_SIZE} bytes"}, 413, {"Access-Control-Allow-Origin": "*"}

    with open("templates/data.json", "w") as f:
        f.write(json_data)

    return {"message": "Success"}, 200, {"Access-Control-Allow-Origin": "*"}


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)


