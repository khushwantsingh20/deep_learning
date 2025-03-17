from ultralytics import YOLO
import cv2

# Load Pretrained YOLOv8 Model
model = YOLO("yolov8n.pt")  # 'n' means nano version (lightweight)

# Load Image
image_path = "car.jpeg"
image = cv2.imread(image_path)

# Run Object Detection
results = model(image)

# Display Results
results[0].show()  # Access the first result and show it
