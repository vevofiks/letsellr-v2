import asyncio
import os
import uuid
import boto3
from botocore.config import Config
from dotenv import load_dotenv

load_dotenv("letsellr-api/.env")

s3 = boto3.client(
    "s3",
    endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
    aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
    aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
    config=Config(signature_version="s3v4"),
    region_name="auto"
)

key = "uploads/test.txt"
s3.put_object(
    Bucket=os.environ["R2_BUCKET_NAME"],
    Key=key,
    Body=b"hello world",
    ContentType="text/plain"
)
print(f"Uploaded to {key}")
