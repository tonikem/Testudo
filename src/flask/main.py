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


def authenticate(cookie):
    decoded_cookie = jwt.decode(cookie, "SECRET_KEY_1234", algorithms=["HS256"])
    user_id = decoded_cookie['user_id']
    auth_user = users_col.find_one({"id": user_id})
    return auth_user


@app.route('/')
def index():
    if request.cookies:
        cookie = request.cookies["testudoAuthorization"]

        if cookie and authenticate(cookie):
            return render_template("index.html")

    return render_template('login.html')


@cross_origin()
@app.route('/data')
def test_json():
    return render_template("data.json")


@cross_origin()
@app.route('/login', methods=["POST"])
def login_to_user():
    users_col = testudo_users_db["users"]

    data = json.loads(request.data)
    username = data["username"]
    password = data["password"]

    response = users_col.find_one({'name': username})

    if response is None:
        return {"Status": "Failure. User not found!"}, 404

    hashed_password = response['password']
    user_id = response["id"]

    if check_password(password, hashed_password):
        res_data = {
            "username": username,  # Token should expire after 24 hrs
            "token": jwt.encode({"user_id": user_id}, "SECRET_KEY_1234", algorithm="HS256")
        }
        return {"message": "Successfully fetched auth token", "data": res_data}, 200
    else:
        return {"message": "Failure. Password not found!"}, 404


@cross_origin()
@app.route("/data", methods=["PUT"])
def update_data():
    data = json.loads(request.data)
    json_data = json.dumps(data, indent=4)

    if getsizeof(json_data) > 6000000000:
        return {"message": "Content too large. Max size is 6GB"}, 413, {"Access-Control-Allow-Origin": "*"}

    with open("templates/data.json", "w") as f:
        f.write(json_data)

    return {"message": "Success"}, 200, {"Access-Control-Allow-Origin": "*"}


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)


