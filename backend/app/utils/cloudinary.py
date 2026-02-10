# backend/app/utils/cloudinary.py 

import cloudinary
import cloudinary.uploader
import cloudinary.api
import os

from cloudinary import CloudinaryImage
from cloudinary import CloudinaryVideo

cloudinary.config( 
  cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
  api_key=os.getenv("CLOUDINARY_API_KEY"),
  api_secret=os.getenv("CLOUDINARY_API_SECRET"),
  secure=True,
# secure_distribution = "mydomain.com",
)