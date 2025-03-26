import tensorflow as tf
from tensorflow.keras import layers, models
import numpy as np

# Step 1: Define the model architecture
model = models.Sequential()

# Input Layer: We expect the input to have 2 features (size of the house, number of bedrooms)
model.add(layers.InputLayer(input_shape=(2,)))

# Hidden Layer 1: 64 neurons and ReLU activation
model.add(layers.Dense(64, activation='relu'))

# Hidden Layer 2: 32 neurons and ReLU activation
model.add(layers.Dense(32, activation='relu'))

# Output Layer: 1 neuron for the predicted house price
model.add(layers.Dense(1))

# Step 2: Compile the model
model.compile(optimizer='adam', loss='mean_squared_error')

# Step 3: Example training data
# X_train: Features (size of the house, number of bedrooms)
X_train = np.array([[1200, 3], [1500, 4], [1000, 2], [2000, 5], [1800, 3]])

# y_train: Target values (house prices)
y_train = np.array([500000, 600000, 400000, 800000, 650000])

# Step 4: Train the model
model.fit(X_train, y_train, epochs=200, batch_size=1)

# Step 5: Making predictions on new data
# Let's predict the price of a house with size 1300 sq ft and 3 bedrooms
predictions = model.predict(np.array([[1300, 3]]))

# Output the predicted price
print(f"Predicted house price for 1300 sq ft and 3 bedrooms: ${predictions[0][0]:,.2f}")