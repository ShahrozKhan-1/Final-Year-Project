import nltk
from nltk.tokenize import word_tokenize

nltk.download('punkt') # Download data for tokenization

text = "This is a sample sentence, used for demonstration."
tokens = word_tokenize(text, language='english', preserve_line=True)

print(tokens)