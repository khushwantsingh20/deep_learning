import numpy as np
from tensorflow.keras.datasets import imdb
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, LSTM, Dense
from tensorflow.keras.preprocessing.text import Tokenizer

# Load and preprocess IMDB data
vocab_size = 10000
max_length = 200
(X_train, y_train), (X_test, y_test) = imdb.load_data(num_words=vocab_size)

X_train = pad_sequences(X_train, maxlen=max_length, padding='post')
X_test = pad_sequences(X_test, maxlen=max_length, padding='post')

# Define LSTM model
model = Sequential()
model.add(Embedding(input_dim=vocab_size, output_dim=128, input_length=max_length))
model.add(LSTM(100, dropout=0.2, recurrent_dropout=0.2))
model.add(Dense(1, activation='sigmoid'))

# Compile the model
model.compile(loss='binary_crossentropy', optimizer='adam', metrics=['accuracy'])

# Train the model
history = model.fit(X_train, y_train, epochs=5, batch_size=64, validation_split=0.2)

# Evaluate the model
loss, accuracy = model.evaluate(X_test, y_test)
print(f'Test Accuracy: {accuracy * 100:.2f}%')

# Sample review for prediction
sample_review = "The movie was absolutely fantastic! I loved every part of it."
tokenizer = Tokenizer(num_words=vocab_size)
tokenizer.fit_on_texts([sample_review])
sequence = tokenizer.texts_to_sequences([sample_review])
padded_sequence = pad_sequences(sequence, maxlen=max_length, padding='post')

# Make prediction
prediction = model.predict(padded_sequence)
sentiment = "Positive" if prediction[0][0] > 0.5 else "Negative"
print(f'Review Sentiment: {sentiment}')
