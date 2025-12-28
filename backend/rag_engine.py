import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from google import genai
import os
from dotenv import load_dotenv

load_dotenv()
GENAI_API_KEY = os.getenv("GENAI_API_KEY")

class RefactorlyBrain:
    def __init__(self):
        self.memory = [] 
        
        try:
            if not GENAI_API_KEY:
                print("Error: API Key missing in rag_engine.py")
                self.client = None
            else:
                self.client = genai.Client(api_key=GENAI_API_KEY)
        except Exception as e:
            print(f"Brain Error: {e}")
            self.client = None

    def get_embedding(self, text):
        if not self.client: return np.zeros(768)
        try:
            result = self.client.models.embed_content(
                model="text-embedding-004",
                contents=text
            )
            return np.array(result.embeddings[0].values)
        except Exception as e:
            print(f"Embedding failed: {e}")
            return np.zeros(768)

    def learn_from_text(self, filename, code_content):
        print(f"Learning from: {filename}")
        vector = self.get_embedding(code_content)
        self.memory.append({
            "filename": filename,
            "text": code_content,
            "vector": vector
        })

    def recall_style(self, query_code, n_results=2):
        if not self.memory:
            return []

        query_vector = self.get_embedding(query_code).reshape(1, -1)
        
        memory_vectors = np.array([item['vector'] for item in self.memory])
        
        scores = cosine_similarity(query_vector, memory_vectors)[0]
        
        top_indices = scores.argsort()[-n_results:][::-1]
        
        results = []
        for idx in top_indices:
            results.append(self.memory[idx]['text'])
            
        return results

brain = RefactorlyBrain()