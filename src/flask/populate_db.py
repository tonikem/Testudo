import json
from pymongo import MongoClient


mongo_client = MongoClient("localhost", 27017)
testudo_users_db = mongo_client["TestudoUsers"]
testudo_data_db = mongo_client["TestudoData"]


with open("./templates/data.json") as file:
    data = json.load(file)
    notebooks = data["main"]

    for notebook in notebooks:
        print(notebook)



