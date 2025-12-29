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
from typing import Optional
from pygments.lexers import guess_lexer, ClassNotFound

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
    language: str = "auto"
    use_personalization: bool = False
    custom_style: str = ""
    user_id: Optional[str] = None

class GitHubRequest(BaseModel):
    repo_url: str

def detect_language(code: str) -> str:
    try:
        lexer = guess_lexer(code)
        return lexer.name.lower()
    except ClassNotFound:
        return "generic"

@app.post("/ingest-github")
async def ingest_github(request: GitHubRequest):
    try:
        parts = request.repo_url.rstrip("/").split("/")
        if len(parts) < 2: return {"error": "Invalid GitHub URL"}
        
        owner, repo = parts[-2], parts[-1]
        api_url = f"https://api.github.com/repos/{owner}/{repo}/contents"
        
        response = requests.get(api_url)
        if response.status_code != 200: 
            return {"error": f"GitHub API Error: {response.status_code}"}
            
        files = response.json()
        count = 0
        
        for file in files[:15]: 
            if file['type'] == 'file' and file['name'].endswith(('.py', '.js', '.tsx', '.java', '.cpp', '.cs', '.go')):
                try:
                    code_content = requests.get(file['download_url']).text
                    if len(code_content) > 10: 
                        brain.learn_from_text(file['name'], code_content)
                        count += 1
                except: continue
                    
        return {"message": f"Synced {count} files from GitHub."}
    except Exception as e:
        return {"error": str(e)}

@app.post("/fetch-github-files")
async def fetch_github_files(request: GitHubRequest):
    try:
        parts = request.repo_url.rstrip("/").split("/")
        if len(parts) < 2: return {"error": "Invalid URL"}
        owner, repo = parts[-2], parts[-1]
        
        api_url = f"https://api.github.com/repos/{owner}/{repo}/contents"
        response = requests.get(api_url)
        
        if response.status_code != 200: return {"error": "Repo not found"}
        
        file_list = []
        for file in response.json()[:15]: 
            if file['type'] == 'file' and file['name'].endswith(('.py', '.js', '.tsx', '.jsx', '.java', '.cpp', '.cs', '.go')):
                try:
                    content = requests.get(file['download_url']).text
                    file_list.append({"name": file['name'], "content": content})
                except: continue
                
        return {"files": file_list}
    except Exception as e:
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
                if file_name.endswith((".py", ".js", ".tsx", ".java", ".cpp", ".cs", ".go")):
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
        return {"error": str(e)}

@app.post("/fetch-zip-files")
async def fetch_zip_files(file: UploadFile = File(...)):
    temp_filename = f"temp_view_{file.filename}"
    extract_path = "temp_view_extracted"
    file_list = []
    
    try:
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        with zipfile.ZipFile(temp_filename, 'r') as zip_ref:
            zip_ref.extractall(extract_path)
            
        for root, dirs, files in os.walk(extract_path):
            for file_name in files:
                if file_name.endswith(('.py', '.js', '.tsx', '.jsx', '.java', '.cpp', '.cs', '.go')):
                    try:
                        with open(os.path.join(root, file_name), "r", encoding="utf-8") as f:
                            file_list.append({"name": file_name, "content": f.read()})
                    except: continue
                    
        if os.path.exists(temp_filename): os.remove(temp_filename)
        if os.path.exists(extract_path): shutil.rmtree(extract_path)
        
        return {"files": file_list[:20]} 
    except Exception as e:
        return {"error": str(e)}

@app.post("/refactor")
async def refactor_code(request: RefactorRequest):
    target_language = request.language
    if target_language == "auto":
        target_language = detect_language(request.code)

    style_context = ""
    
    if request.custom_style:
        style_context += f"\n\n### USER'S MANUAL {target_language.upper()} STYLE RULES ###\n{request.custom_style}\n"

    if request.use_personalization:
        try:
            past_examples = brain.recall_style(request.code)
            if past_examples:
                style_context += f"\n\n### USER CODING STYLE EXAMPLES ({target_language.upper()}) ###\n"
                for i, example in enumerate(past_examples):
                    style_context += f"\n--- EXAMPLE {i+1} ---\n{example[:1500]}\n"
        except Exception as e:
            print(f"RAG Error: {e}")

    prompt_parts = [
    f"### SYSTEM ROLE ###",
    f"You are a Senior {target_language.upper()} Architect specializing in performance and clean code.",
    
    f"\n### CORE CONSTRAINT ###",
    f"1. You MUST maintain the source language: {target_language.upper()}.",
    f"2. DO NOT translate, convert, or port this code to any other language (like T-SQL or Python) unless the input is already that language.",
    f"3. If the input is {target_language.upper()}, the output code block MUST be valid {target_language.upper()}.",
    
    f"\n### STYLE CONTEXT ###",
    style_context,
    
    f"\n### INSTRUCTIONS ###",
    "1. Improve variable naming for clarity.",
    "2. Optimize logic loops and memory management.",
    "3. Ensure the output is clean and professional.",
    
    f"\n### RESPONSE FORMAT ###",
    "STRICTLY FOLLOW THIS FORMAT:",
    "[Refactored Code Only - NO Backticks]",
    "<<SPLIT>>",
    "[Bulleted Explanation with blank lines between points]",
    
    f"\n### INPUT CODE TO BE REFACTORED ({target_language.upper()}) ###",
    request.code 
    ]
    final_prompt = "\n".join(prompt_parts)
    
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash", 
            contents=final_prompt
        )
        
        full_text = response.text
        refactored_code, explanation = full_text, "Refactoring complete."

        if "<<SPLIT>>" in full_text:
            parts = full_text.split("<<SPLIT>>")
            refactored_code = parts[0].strip().replace("```" + target_language, "").replace("```", "").strip()
            explanation = parts[1].strip().replace("**", "").replace("\n*", "\n\n*").replace("\n-", "\n\n-")

        return {
            "refactored_code": refactored_code, 
            "explanation": explanation,
            "detected_language": target_language
        }
            
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI Generation Failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)