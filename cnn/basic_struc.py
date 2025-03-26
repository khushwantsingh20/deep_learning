import tensorflow as tf
from tensorflow.keras.models import Sequencial
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout

#define cnn model
model = Sequencial()

#convo layer and relu
model.add(Conv2D(32, (3, 3),activation='relu' ,input_shape=(64,64,3)))

#pooling layer
model.add(MaxPooling2D(pool_size=(2, 2)))

#second convo + relu
model.add(Conv2D(64, (3, 3), activation='relu'))
model.add(MaxPooling2D(pool_size=(2, 2)))

#flatten layer
model.add(Flatten())

#fully connected layer + relu
model.add(Dense(128, activation='relu'))


#dropout layer
model.add(Dropout(0.5))

#output layer
model.add(Dense(10, activation='softmax'))

#compile the model
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

#summary
model.summary()
                 
