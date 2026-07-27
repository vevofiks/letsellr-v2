import sys
from app.db.base import Base
import app.main # this should import all models
for table in Base.metadata.tables:
    if 'seeker' in table:
        print(f"Found table: {table}")
print("Done")
