import json
from pymongo import MongoClient


mongo_client = MongoClient("localhost", 27017)

# Tietokannat
testudo_users_db = mongo_client["TestudoUsers"]
testudo_data_db = mongo_client["TestudoData"]

# Tietokanta sarakkeet
notebooks_col = testudo_data_db["notebooks"]


with open("./templates/data.json") as file:
    data = json.load(file)
    notebooks = data["main"]

    # Poistetaan ensin kaikki Notebookit
    notebooks_col.delete_many({})
    # Asetetaan sitten data
    notebooks_col.insert_many(notebooks)



