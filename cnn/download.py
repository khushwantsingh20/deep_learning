import numpy as np
import matplotlib.pyplot as plt
from tensorflow.keras.datasets import cifar10
import os

# Load CIFAR-10 dataset
(x_train, y_train), (x_test, y_test) = cifar10.load_data()

# Define class labels
class_labels = [
    "Airplane", "Automobile", "Bird", "Cat", "Deer",
    "Dog", "Frog", "Horse", "Ship", "Truck"
]

# Create directory to save images
save_dir = "cifar10_images"
if not os.path.exists(save_dir):
    os.makedirs(save_dir)

# Save 10 images from each class
num_images_per_class = 10

# Iterate through classes
for class_index in range(10):
    class_dir = os.path.join(save_dir, class_labels[class_index])
    if not os.path.exists(class_dir):
        os.makedirs(class_dir)
    
    # Get indexes of images belonging to the class
    class_indices = np.where(y_train.flatten() == class_index)[0]
    
    # Save images for each class
    for i, index in enumerate(class_indices[:num_images_per_class]):
        image = x_train[index]
        plt.imsave(os.path.join(class_dir, f"{class_labels[class_index]}_{i}.png"), image)

print(f"✅ CIFAR-10 images saved successfully in '{save_dir}' folder!")
