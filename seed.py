from csv import DictReader
from app import db
from models import User, Location

db.drop_all()
db.create_all()

with open('generator/Counties.csv') as locations:
    db.session.bulk_insert_mappings(Location, DictReader(locations))

db.session.commit()