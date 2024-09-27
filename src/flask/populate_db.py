import os
import json
import pycouchdb
from functions import get_hashed_password


PYCOUCH_DB_PASSWORD = os.environ['PYCOUCH_DB_PASSWORD']
server = pycouchdb.Server(f"http://admin:{PYCOUCH_DB_PASSWORD}@localhost:5984/")

notebooks_db = server.database("notebooks")
users_db = server.database("users")


#with open("./templates/data.json") as file:
#    data = json.load(file)
#    notebooks = data["main"]
#
#    # Asetetaan notebook data
#    notebooks_db.save_bulk(notebooks)


#with open("./templates/users.json") as file:
#    data = json.load(file)
#    users = data["users"]
#
#    # Asetetaan user data
#    for user in users:
#        password = get_hashed_password(user['password'].strip())
#        username = user['name'].strip()
#        user = {
#            "name": username,
#            "password": password.decode('utf-8'),
#            "id": user['id'],
#            "notebooks": user["notebooks"]
#        }
#        users_db.save(user)


