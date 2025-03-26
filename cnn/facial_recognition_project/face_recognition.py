import os
from deepface import DeepFace
import cv2
import matplotlib.pyplot 

# Path to the directory containing images
dataset_path = "images/"

# Function to analyze and represent face encodings
def analyze_face(img_path):
    try:
        analysis = DeepFace.analyze(img_path, actions=['age', 'gender', 'race', 'emotion'])
        return analysis
    except Exception as e:
        print(f"Error processing image {img_path}: {e}")
        return None

# Function to verify and recognize faces in the dataset
def recognize_face(new_image_path):
    for img_name in os.listdir(dataset_path):
        if img_name.endswith((".jpg", ".png", ".jpeg")):
            img_path = os.path.join(dataset_path, img_name)
            
            # Verify face with stored images
            result = DeepFace.verify(new_image_path, img_path, model_name='VGG-Face')
            
            if result["verified"]:
                print(f"✅ Match found! The person in {new_image_path} is {img_name.split('.')[0]}")
                return img_name.split('.')[0]

    print("❌ No match found.")
    return None

# Path of new image to recognize
new_image_path = "images/iron.jpeg"

# Analyze and print face features
analysis = analyze_face(new_image_path)
if analysis:
    print(f"Age: {analysis[0]['age']}")
    print(f"Gender: {analysis[0]['dominant_gender']}")
    print(f"Race: {analysis[0]['dominant_race']}")
    print(f"Emotion: {analysis[0]['dominant_emotion']}")

# Recognize the person in the new image
recognize_face(new_image_path)
