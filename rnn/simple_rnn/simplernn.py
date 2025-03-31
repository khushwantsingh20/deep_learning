# Import Required Libraries
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import SimpleRNN, Dense
from sklearn.preprocessing import MinMaxScaler
import matplotlib.pyplot as plt
import matplotlib

# Set matplotlib backend to prevent rendering issues in CLI
matplotlib.use('Agg')  # Use Agg to save plots if GUI is unavailable

# Check TensorFlow version
print(f"TensorFlow Version: {tf.__version__}")

# Generate a sine wave as sequence data
def generate_sequence(n_steps):
    x = np.linspace(0, 50, n_steps)
    y = np.sin(x)
    return y

# Define number of steps
n_steps = 500
sequence = generate_sequence(n_steps)

# Normalize the sequence using MinMaxScaler
scaler = MinMaxScaler(feature_range=(0, 1))
sequence_scaled = scaler.fit_transform(sequence.reshape(-1, 1))

# Visualize the scaled sequence
plt.plot(sequence_scaled)
plt.title('Sample Sequence Data (Sine Wave - Scaled)')
plt.xlabel('Time Steps')
plt.ylabel('Normalized Value')
plt.savefig('sequence_plot.png')
print("Sequence plot saved as 'sequence_plot.png'")

# Create input-output pairs for training
def create_dataset(sequence, lookback):
    X, y = [], []
    for i in range(len(sequence) - lookback):
        X.append(sequence[i:i + lookback])
        y.append(sequence[i + lookback])
    return np.array(X), np.array(y)

# Define lookback window size
lookback = 20
X, y = create_dataset(sequence_scaled, lookback)

# Reshape input to [samples, time steps, features]
X = X.reshape((X.shape[0], X.shape[1], 1))



# Create RNN model
model = Sequential()
model.add(SimpleRNN(100, activation='relu', input_shape=(lookback, 1)))  # Increased neurons to 100
model.add(Dense(1))

# Compile the model
model.compile(optimizer='adam', loss='mse')

# Model summary
model.summary()

# Train the model
history = model.fit(X, y, epochs=50, batch_size=32, verbose=1)

# Save the trained model
model.save('simplernn_model.keras')
print("Model saved as 'simplernn_model.keras'")

# Generate predictions
predictions = model.predict(X)

# Inverse transform predictions to original scale
predictions_inverse = scaler.inverse_transform(predictions)
y_inverse = scaler.inverse_transform(y.reshape(-1, 1))

# Plot actual vs predicted values
plt.plot(range(len(y_inverse)), y_inverse, label="Actual")
plt.plot(range(len(predictions_inverse)), predictions_inverse, label="Predicted")
plt.title("Actual vs Predicted Values")
plt.xlabel("Time Steps")
plt.ylabel("Value")
plt.legend()
plt.savefig('predictions_plot.png')  # Save the plot instead of showing
print("Predictions plot saved as 'predictions_plot.png'")

# Evaluate the model performance
mse = np.mean(np.square(y_inverse - predictions_inverse))  # Manual MSE calculation
print(f"Mean Squared Error: {mse:.6f}")
