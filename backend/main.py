from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
import uvicorn
import shutil
import os
import zipfile
import requests
from rag_engine import brain 
import traceback
from dotenv import load_dotenv
load_dotenv()
GENAI_API_KEY = os.getenv("GENAI_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    if not GENAI_API_KEY:
        raise ValueError("API Key not found. Please set GENAI_API_KEY in .env file.")
    client = genai.Client(api_key=GENAI_API_KEY)
except Exception as e:
    print(f"Init Error: {e}")

class RefactorRequest(BaseModel):
    code: str
    use_personalization: bool = False

class GitHubRequest(BaseModel):
    repo_url: str

@app.post("/ingest-github")
async def ingest_github(request: GitHubRequest):
    try:
        parts = request.repo_url.rstrip("/").split("/")
        if len(parts) < 2: return {"error": "Invalid GitHub URL"}
        
        owner, repo = parts[-2], parts[-1]
        api_url = f"https://api.github.com/repos/{owner}/{repo}/contents"
        
        print(f"Fetching GitHub: {api_url}")
        response = requests.get(api_url)
        if response.status_code != 200: 
            return {"error": f"GitHub API Error: {response.status_code}"}
            
        files = response.json()
        count = 0
        
        for file in files[:15]: 
            if file['type'] == 'file' and file['name'].endswith(('.py', '.js', '.tsx', '.java')):
                try:
                    code_content = requests.get(file['download_url']).text
                    if len(code_content) > 10: 
                        brain.learn_from_text(file['name'], code_content)
                        count += 1
                except: continue
                    
        return {"message": f"Synced {count} files from GitHub."}

    except Exception as e:
        print(f"GitHub Error: {e}")
        return {"error": str(e)}

@app.post("/upload-knowledge")
async def upload_knowledge(file: UploadFile = File(...)):
    temp_filename = f"temp_{file.filename}"
    extract_path = "temp_extracted"
    try:
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        with zipfile.ZipFile(temp_filename, 'r') as zip_ref:
            zip_ref.extractall(extract_path)
        count = 0
        for root, dirs, files in os.walk(extract_path):
            for file_name in files:
                if file_name.endswith((".py", ".js", ".tsx", ".java")):
                    try:
                        with open(os.path.join(root, file_name), "r", encoding="utf-8") as f:
                            content = f.read()
                            if len(content) > 10: 
                                brain.learn_from_text(file_name, content)
                                count += 1
                    except: continue
        
        if os.path.exists(temp_filename): os.remove(temp_filename)
        if os.path.exists(extract_path): shutil.rmtree(extract_path)
        return {"message": f"Learned from {count} files."}
    except Exception as e:
        print(f"Upload Error: {e}")
        return {"error": str(e)}

@app.post("/refactor")
async def refactor_code(request: RefactorRequest):
    print(f"Refactor Request. Personalization: {request.use_personalization}")
    
    style_context = ""
    
    if request.use_personalization:
        try:
            past_examples = brain.recall_style(request.code)
            if past_examples:
                print(f"Found {len(past_examples)} style examples.")
                
                style_context += "\n\n### CRITICAL: USER CODING STYLE EXAMPLES ###\n"
                style_context += "You MUST adopt the exact coding style found in the examples below.\n"
                style_context += "If the examples use emojis (🚀), specific naming, or excessive comments, YOU MUST COPY THAT STYLE.\n"
                
                for i, example in enumerate(past_examples):
                    header = "\n--- STYLE EXAMPLE " + str(i+1) + " ---\n"
                    body = example[:1500] + "\n"
                    style_context += header + body
        except Exception as e:
            print(f"RAG Error: {e}")
            style_context = ""

    prompt_parts = [
        "You are an expert Senior Developer. Refactor the following code.",
        style_context,
        "\nRULES:",
        "1. Output strictly in the requested format.",
        "2. Explanation must be a clean bulleted list.",
        "3. If style examples were provided, your refactored code MUST look like it was written by the same person.",
        "\nRESPONSE FORMAT:",
        "1. Refactored Code (Clean).",
        "2. <<SPLIT>>",
        "3. Explanation (Markdown Bullet Points).",
        "\nCODE TO REFACTOR:",
        request.code 
    ]
    
    final_prompt = "\n".join(prompt_parts)
    
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash", 
            contents=final_prompt
        )
        
        full_text = response.text
        if "<<SPLIT>>" in full_text:
            parts = full_text.split("<<SPLIT>>")
            return {"refactored_code": parts[0].strip(), "explanation": parts[1].strip().replace("**", "")}
        else:
            return {"refactored_code": full_text, "explanation": "Refactoring complete."}
            
    except Exception as e:
        print("!!! CRITICAL GENERATION ERROR !!!")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI Generation Failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)