import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
from tensorflow.keras.datasets import cifar10
from tensorflow.keras.utils import to_categorical
import matplotlib.pyplot as plt

# Load and preprocess CIFAR-10 dataset
(x_train, y_train), (x_test, y_test) = cifar10.load_data()

# Normalize pixel values between 0 and 1
x_train, x_test = x_train / 255.0, x_test / 255.0

# One-hot encode labels (10 classes)
y_train = to_categorical(y_train, 10)
y_test = to_categorical(y_test, 10)

# Define class labels for CIFAR-10
class_labels = [
    "Airplane", "Automobile", "Bird", "Cat", "Deer",
    "Dog", "Frog", "Horse", "Ship", "Truck"
]

# Define CNN model
model = Sequential()

# 1. First Convolutional Layer + ReLU
model.add(Conv2D(32, (3, 3), activation='relu', padding='same', input_shape=(32, 32, 3)))
model.add(MaxPooling2D(pool_size=(2, 2)))

# 2. Second Convolutional Layer + ReLU
model.add(Conv2D(64, (3, 3), activation='relu', padding='same'))
model.add(MaxPooling2D(pool_size=(2, 2)))

# 3. Third Convolutional Layer + ReLU
model.add(Conv2D(128, (3, 3), activation='relu', padding='same'))
model.add(MaxPooling2D(pool_size=(2, 2)))

# 4. Flatten Layer
model.add(Flatten())

# 5. Fully Connected Layer + ReLU
model.add(Dense(256, activation='relu'))

# 6. Dropout Layer (to prevent overfitting)
model.add(Dropout(0.5))

# 7. Output Layer (Softmax for 10 classes)
model.add(Dense(10, activation='softmax'))

# Compile the model
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

# Print model summary
model.summary()

# Train the model
model.fit(x_train, y_train, batch_size=64, epochs=20, validation_data=(x_test, y_test))

# Evaluate on test data
loss, accuracy = model.evaluate(x_test, y_test)
print(f'Test Accuracy: {accuracy * 100:.2f}%')

# =======================
# 🧠 PREDICTION FUNCTION
# =======================
def predict_image(image_index):
    """Predicts a single image from the test dataset."""
    image = x_test[image_index]
    true_label = np.argmax(y_test[image_index])
    
    # Reshape for prediction
    image_reshaped = image.reshape(1, 32, 32, 3)
    
    # Predict class
    predictions = model.predict(image_reshaped)
    predicted_label = np.argmax(predictions)
    
    # Display the image and prediction
    plt.imshow(image)
    plt.title(f"Predicted: {class_labels[predicted_label]} | Actual: {class_labels[true_label]}")
    plt.axis('off')
    plt.show()

# =======================
# 🎯 MAKE A PREDICTION
# =======================
# Predict and visualize the result for an image (e.g., index 10)
predict_image(10)
