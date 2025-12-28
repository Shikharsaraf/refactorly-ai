import { useState, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

function App() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resultCode, setResultCode] = useState("");
  const [explanation, setExplanation] = useState("");
  const [inputCode, setInputCode] = useState(`# Paste your Python code here...`);
  const [usePersonalization, setUsePersonalization] = useState(false);
  const [statusMsg, setStatusMsg] = useState(""); 
  
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");

  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploading(true);
    setStatusMsg("Uploading...");
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/upload-knowledge", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setStatusMsg("Learned from ZIP!");
    } catch (error) {
      console.error(error);
      setStatusMsg("Upload Failed");
    } finally {
      setUploading(false);
      setTimeout(() => setStatusMsg(""), 3000);
    }
  };

  const handleGithubSync = async () => {
    if (!githubUrl) return;
    setUploading(true);
    setStatusMsg("Syncing GitHub...");
    setShowGithubModal(false);

    try {
      const response = await fetch("http://localhost:8000/ingest-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: githubUrl }), 
      });
      const data = await response.json();
      setStatusMsg(data.message || "Synced Repo!");
    } catch (error) {
      setStatusMsg("GitHub Sync Failed");
    } finally {
      setUploading(false);
      setTimeout(() => setStatusMsg(""), 3000);
    }
  };

  const handleRefactor = async () => {
    setLoading(true);
    setResultCode(""); 
    setExplanation("");
    
    try {
      const response = await fetch("http://localhost:8000/refactor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          code: inputCode,
          use_personalization: usePersonalization 
        }), 
      });
      const data = await response.json();
      setResultCode(data.refactored_code);
      setExplanation(data.explanation);
    } catch (error) {
      setExplanation("Error: Check Backend Connection");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <div className="sidebar">
        <div className="brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'#2563eb', marginRight: 10}}>
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
          Refactorly
        </div>
<div className="nav-item active" style={{ display: 'flex', alignItems: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          Dashboard
        </div>
        <div className="nav-item" onClick={() => fileInputRef.current.click()} style={{ display: 'flex', alignItems: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          Upload ZIP
        </div>
        <input type="file" ref={fileInputRef} style={{display:'none'}} onChange={handleFileUpload} accept=".zip"/>
        
        {statusMsg && <div style={{fontSize:'0.8rem', color:'#22c55e', padding:'10px'}}>{statusMsg}</div>}
      </div>

      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        <div className="top-bar" style={{ flexShrink: 0 }}>
          <div className="breadcrumbs">Workbench</div>
          <button className="github-btn" onClick={() => setShowGithubModal(true)} style={{ display: 'flex', alignItems: 'center' }}>
            <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: '16px', height: '16px', marginRight: '8px' }}>
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Sync GitHub
          </button>
        </div>

        {showGithubModal && (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99
          }}>
            <div style={{ background: '#09090b', padding: '2rem', borderRadius: '8px', border: '1px solid #27272a', width: '400px' }}>
              <h3 style={{ margin: '0 0 1rem 0' }}>Sync Public Repo</h3>
              <input 
                type="text" 
                placeholder="https://github.com/username/repo" 
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                style={{ width: '100%', padding: '10px', background: '#18181b', border: '1px solid #27272a', color: 'white', marginBottom: '1rem' }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-primary" onClick={handleGithubSync} style={{ marginTop: 0 }}>Sync Now</button>
                <button onClick={() => setShowGithubModal(false)} style={{ background: 'transparent', border: '1px solid #27272a', color: 'white', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: '1.5rem' }}>
          
          <div className="editor-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', 
            gap: '1.5rem', 
            flex: 1, 
            minHeight: 0, 
            marginBottom: '1.5rem' 
          }}>
            
            <div className="editor-window" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', minWidth: 0 }}>
              <div className="window-header" style={{ flexShrink: 0 }}>
                <span>Input</span>
                <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                   <span style={{fontSize:'0.7rem', color: usePersonalization ? '#2563eb':'#555'}}>PERSONALIZATION</span>
                   <input type="checkbox" checked={usePersonalization} onChange={e => setUsePersonalization(e.target.checked)}/>
                </div>
              </div>
              <textarea 
                value={inputCode} 
                onChange={e => setInputCode(e.target.value)} 
                spellCheck="false"
                style={{ 
                  flex: 1, 
                  resize: 'none', 
                  padding: '1rem', 
                  background: 'transparent', 
                  color: '#e4e4e7', 
                  border: 'none', 
                  outline: 'none',
                  whiteSpace: 'pre', 
                  overflowX: 'auto', 
                  overflowY: 'auto'
                }} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', minHeight: 0, minWidth: 0 }}>
              
              <div className="editor-window" style={{ flex: '6', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div className="window-header" style={{ flexShrink: 0 }}><span>Output</span></div>
                <div style={{ flex: 1, overflow: 'auto' }}> 
                  {resultCode ? (
                    <SyntaxHighlighter 
                      language="python" 
                      style={vscDarkPlus} 
                      customStyle={{ 
                        margin: 0, 
                        padding: '1rem', 
                        minHeight: '100%', 
                        fontSize: '14px',
                        width: 'fit-content', 
                        minWidth: '100%'      
                      }}
                    >
                      {resultCode}
                    </SyntaxHighlighter>
                  ) : <div style={{padding:'20px', color:'#555'}}>Ready...</div>}
                </div>
              </div>
              
              <div className="editor-window" style={{ flex: '4', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderTop: '1px solid #27272a' }}>
                <div className="window-header" style={{ background:'#0f172a', color:'#60a5fa', flexShrink: 0 }}><span>AI Notes</span></div>
                <div style={{ 
                  flex: 1, 
                  padding: '1rem', 
                  color: '#94a3b8', 
                  fontSize: '0.85rem', 
                  whiteSpace: 'pre-wrap', 
                  overflowY: 'auto', 
                  lineHeight: '1.6' 
                }}>
                  {explanation}
                </div>
              </div>

            </div>
          </div>
          
          <div style={{ flexShrink: 0 }}>
            <button className="btn-primary" onClick={handleRefactor} disabled={loading} style={{ marginTop: 0, width: '100%' }}>
              {loading ? 'Refactoring Code...' : 'Run Refactor Analysis'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;