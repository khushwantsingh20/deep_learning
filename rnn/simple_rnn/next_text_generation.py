# Import Required Libraries
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import SimpleRNN, Dense, Embedding
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.utils import to_categorical
import random
import sys

# Load and Preprocess Data
text = """Shall I compare thee to a summer's day? Thou art more lovely and more temperate:
Rough winds do shake the darling buds of May, And summer's lease hath all too short a date:
Sometime too hot the eye of heaven shines, And often is his gold complexion dimm'd;
And every fair from fair sometime declines, By chance, or nature's changing course untrimm'd."""

# Convert Text to Lowercase
text = text.lower()

# Create Character Mapping
chars = sorted(list(set(text)))
char_to_index = {c: i for i, c in enumerate(chars)}
index_to_char = {i: c for i, c in enumerate(chars)}

# Define Sequence Length
SEQ_LENGTH = 40
STEP_SIZE = 3

# Create Input-Output Pairs
sequences = []
next_chars = []

for i in range(0, len(text) - SEQ_LENGTH, STEP_SIZE):
    sequences.append(text[i:i + SEQ_LENGTH])
    next_chars.append(text[i + SEQ_LENGTH])

# Vectorize Input and Output
X = np.zeros((len(sequences), SEQ_LENGTH, len(chars)), dtype=np.bool_)
y = np.zeros((len(sequences), len(chars)), dtype=np.bool_)

for i, sequence in enumerate(sequences):
    for t, char in enumerate(sequence):
        X[i, t, char_to_index[char]] = 1
    y[i, char_to_index[next_chars[i]]] = 1

# Build the RNN Model
model = Sequential()
model.add(SimpleRNN(128, input_shape=(SEQ_LENGTH, len(chars))))
model.add(Dense(len(chars), activation='softmax'))

# Compile the Model
model.compile(loss='categorical_crossentropy', optimizer='adam')

# Train the Model
# Increase epochs to 50 or more
model.fit(X, y, batch_size=128, epochs=50)

# Save the Model
model.save('simplernn_textgen_model.keras')
print("Model saved as 'simplernn_textgen_model.keras'")

# Generate New Text
def generate_text(seed_text, length):
    generated = seed_text
    for i in range(length):
        x_pred = np.zeros((1, SEQ_LENGTH, len(chars)))
        for t, char in enumerate(seed_text):
            if char in char_to_index:
                x_pred[0, t, char_to_index[char]] = 1.0

        # Predict Next Character
        predictions = model.predict(x_pred, verbose=0)[0]
        next_index = np.argmax(predictions)
        next_char = index_to_char[next_index]

        # Append Next Character
        generated += next_char
        seed_text = seed_text[1:] + next_char

    return generated

# Generate New Text with Seed
seed_text = "shall i compare thee to a summer's day? "
generated_text = generate_text(seed_text, 200)
print(f"Generated Text:\n{generated_text}")
