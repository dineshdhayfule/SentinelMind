from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

def get_database():
	mongo_uri = os.getenv("MONGO_URI")
	if not mongo_uri:
		return None

	try:
		client = MongoClient(mongo_uri, serverSelectionTimeoutMS=2000)
		# Force a quick connectivity check so failures are handled here.
		client.admin.command("ping")
		return client["sentinelmind"]
	except Exception:
		return None


db = get_database()
