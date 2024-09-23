import jwt
import json
from pymongo import MongoClient
from sys import getsizeof
from flask import Flask, render_template, request
from flask_cors import CORS, cross_origin
from flask_restful import Resource, Api

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

mongo_client = MongoClient("localhost", 27017)
testudo_users_db = mongo_client["TestudoUsers"]
testudo_data_db = mongo_client["TestudoData"]


# encoded_jwt = jwt.encode({"some": "payload"}, "secret", algorithm="HS256")
# print(encoded_jwt)


@app.route('/')
def index():

    if True:
        return render_template('login.html')

    return render_template("index.html")


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

    res = users_col.find_one({'name': username})

    if res is None:
        return {"Status": "Failure"}, 404
    else:
        # return render_template("data.json")
        return "Hello World"


@cross_origin()
@app.route("/data", methods=["PUT"])
def update_data():
    data = json.loads(request.data)
    json_data = json.dumps(data, indent=4)

    if getsizeof(json_data) > 6000000000:
        return {"Status": "Content too large. Max size is 6GB"}, 413, {"Access-Control-Allow-Origin": "*"}

    with open("templates/data.json", "w") as f:
        f.write(json_data)

    return {"Status": "Success"}, 200, {"Access-Control-Allow-Origin": "*"}


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)


