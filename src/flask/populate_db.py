import json
from pymongo import MongoClient
from functions import get_hashed_password


mongo_client = MongoClient("localhost", 27017)

# Tietokannat
testudo_users_db = mongo_client["TestudoUsers"]
testudo_data_db = mongo_client["TestudoData"]

# Tietokanta sarakkeet
notebooks_col = testudo_data_db["notebooks"]
users_col = testudo_users_db["users"]


with open("./templates/data.json") as file:
    data = json.load(file)
    notebooks = data["main"]

    # Poistetaan ensin kaikki Notebookit
    notebooks_col.delete_many({})

    # Asetetaan sitten data
    notebooks_col.insert_many(notebooks)


with open("./templates/users.json") as file:
    data = json.load(file)
    users = data["users"]

    # Poistetaan ensin kaikki käyttäjät
    users_col.delete_many({})

    # Asetetaan sitten data
    for user in users:
        password = get_hashed_password(user['password'].strip())
        username = user['name'].strip()
        user = {
            "name": username,
            "password": password,
            "id": user['id'],
            "tokens": [],
            "notebooks": user["notebooks"]
        }
        users_col.insert_one(user)


