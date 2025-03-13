import tensorflow_hub as hub
import tensorflow_text as text

# Load BERT tokenizer
preprocess_url = "https://tfhub.dev/tensorflow/bert_en_uncased_preprocess/3"
bert_preprocess = hub.KerasLayer(preprocess_url)

# Sample text
text_input = ["This is an example sentence.", "BERT is a powerful model!"]

# Preprocess the input text (tokenization, padding, etc.)
preprocessed_text = bert_preprocess(text_input)

print(preprocessed_text)
