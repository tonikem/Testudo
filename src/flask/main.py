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
TOKEN_EXPIRATION_TIME = 60

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
    if cookie:
        decoded_cookie = jwt.decode(cookie, "SECRET_KEY_1234", algorithms=["HS256"])
        user_id = decoded_cookie['user_id']
        token_date = decoded_cookie["date"]
        print(token_date)

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
        cookie = request.cookies["testudoAuthorization"]

        if authenticate(cookie):
            return render_template("index.html")

    return render_template('login.html')


@cross_origin()
@app.route('/data')
def test_json():

    if len(request.cookies) == 0:
        return {"Status": "Failure. Missing token!"}, 404

    return render_template("data.json")


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

    if getsizeof(json_data) > 6000000000:
        return {"message": "Content too large. Max size is 6GB"}, 413, {"Access-Control-Allow-Origin": "*"}

    with open("templates/data.json", "w") as f:
        f.write(json_data)

    return {"message": "Success"}, 200, {"Access-Control-Allow-Origin": "*"}


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)


