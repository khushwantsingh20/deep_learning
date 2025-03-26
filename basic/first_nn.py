#basic feedforward neural network.

import tensorflow as tf
from tensorflow.keras import Sequential
from tensorflow.keras.layers import Dense, Flatten

# Dummy dataset (e.g., small random numbers for learning purposes)
X_train = tf.random.normal([100, 10])  # 100 samples, each with 10 features
y_train = tf.random.uniform([100], minval=0, maxval=2, dtype=tf.int32)  # 100 labels (binary classification)

# Define a simple model
model = Sequential([
    Flatten(input_shape=(10,)),  # Flatten input (not needed for 1D input but good for images)
    Dense(16, activation='relu'),  # Hidden layer with 16 neurons and ReLU activation
    Dense(1, activation='sigmoid')  # Output layer (sigmoid for binary classification)
])

# Compile the model
model.compile(optimizer='adam',
              loss='binary_crossentropy',  # Loss function for binary classification
              metrics=['accuracy'])

# Train the model
model.fit(X_train, y_train, epochs=5, batch_size=10)

# Print model summary
model.summary()
