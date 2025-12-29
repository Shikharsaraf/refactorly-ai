import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; 
import Login from './Login';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const Icons = {
  Zap: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
  Book: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
  Settings: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  Upload: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>,
  Github: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>,
  File: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>,
  Folder: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
};

const SUPPORTED_LANGUAGES = [
  { label: 'Auto Detect', value: 'auto' },
  { label: 'Python', value: 'python' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Java', value: 'java' },
  { label: 'C++', value: 'cpp' },
  { label: 'Go', value: 'go' }
];

function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('workbench');
  const [loading, setLoading] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [resultCode, setResultCode] = useState("");
  const [explanation, setExplanation] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [filesUrl, setFilesUrl] = useState(""); 
  const [uploadStatus, setUploadStatus] = useState("");
  const [projectFiles, setProjectFiles] = useState([]); 
  const [customStyle, setCustomStyle] = useState("");
  const [isStyleSaved, setIsStyleSaved] = useState(true);
  const [useRAG, setUseRAG] = useState(true);
  const [detectedLang, setDetectedLang] = useState("");
  const [selectedLang, setSelectedLang] = useState('auto');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserStyle(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserStyle(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchUserStyle = async (userId) => {
    const { data } = await supabase.from('user_styles').select('style_rules').eq('user_id', userId).single();
    if (data) setCustomStyle(data.style_rules || "");
  };

  const handleStyleChange = async (e) => {
    const newStyle = e.target.value;
    setCustomStyle(newStyle);
    setIsStyleSaved(false);
    clearTimeout(window.saveTimeout);
    window.saveTimeout = setTimeout(async () => {
      if (session) {
        await supabase.from('user_styles').upsert({ user_id: session.user.id, style_rules: newStyle });
        setIsStyleSaved(true);
      }
    }, 1500);
  };

  const loadFileToWorkbench = (code) => {
      setInputCode(code);
      setActiveTab('workbench');
      setResultCode(""); 
      setExplanation("");
      setDetectedLang("");
  };

  const handleTrainGithub = async () => {
    if (!githubUrl) return;
    setUploadStatus("Training AI on repo...");
    try {
        const res = await fetch("http://localhost:8000/ingest-github", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ repo_url: githubUrl })
        });
        const data = await res.json();
        setUploadStatus(data.message || data.error);
    } catch (err) { setUploadStatus("Training failed."); }
  };

  const handleTrainZip = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadStatus("Training AI on ZIP...");
    const formData = new FormData();
    formData.append("file", file);
    try {
        const res = await fetch("http://localhost:8000/upload-knowledge", { method: "POST", body: formData });
        const data = await res.json();
        setUploadStatus(data.message || "Training success!");
    } catch (err) { setUploadStatus("Training failed."); }
  };

  const handleFetchGithubFiles = async () => {
    if (!filesUrl) return;
    setUploadStatus("Fetching files...");
    try {
        const res = await fetch("http://localhost:8000/fetch-github-files", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ repo_url: filesUrl })
        });
        const data = await res.json();
        if (data.files) {
            setProjectFiles(data.files);
            setUploadStatus(`Found ${data.files.length} files!`);
        } else {
            setUploadStatus("No code files found.");
        }
    } catch (err) { setUploadStatus("Fetch failed."); }
  };

  const handleFetchZipFiles = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadStatus("Unzipping for view...");
    const formData = new FormData();
    formData.append("file", file);
    try {
        const res = await fetch("http://localhost:8000/fetch-zip-files", { method: "POST", body: formData });
        const data = await res.json();
        if (data.files) {
            setProjectFiles(data.files);
            setUploadStatus(`Unzipped ${data.files.length} files!`);
        } else {
            setUploadStatus("Error reading zip.");
        }
    } catch (err) { setUploadStatus("Upload failed."); }
  };

  const handleRefactor = async () => {
    setLoading(true);
    setResultCode(""); 
    setExplanation("");
    setDetectedLang("");
    try {
      const response = await fetch("http://localhost:8000/refactor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            code: inputCode, 
            custom_style: customStyle, 
            use_personalization: useRAG, 
            user_id: session?.user?.id,
            language: selectedLang
        }), 
      });
      const data = await response.json();
      setResultCode(data.refactored_code);
      setExplanation(data.explanation);
      if (data.detected_language) {
          setDetectedLang(data.detected_language);
      }
    } catch (error) { setExplanation("Error: Check Backend Connection"); } finally { setLoading(false); }
  };

  if (!session) return <Login />;

  return (
    <div className="app-layout">
      <div className="sidebar">
        <div className="brand">Refactorly<span>.ai</span></div>
        <div className={`nav-item ${activeTab === 'workbench' ? 'active' : ''}`} onClick={() => setActiveTab('workbench')}>
            <Icons.Zap /> Workbench
        </div>
        <div className={`nav-item ${activeTab === 'knowledge' ? 'active' : ''}`} onClick={() => setActiveTab('knowledge')}>
            <Icons.Book /> Knowledge Base
        </div>
        <div className={`nav-item ${activeTab === 'files' ? 'active' : ''}`} onClick={() => setActiveTab('files')}>
            <Icons.Folder /> Project Files
        </div>
        <div className={`nav-item ${activeTab === 'personalization' ? 'active' : ''}`} onClick={() => setActiveTab('personalization')}>
            <Icons.Settings /> Settings
        </div>
        <button onClick={() => supabase.auth.signOut()} style={{ marginTop: 'auto', background: 'transparent', border:'1px solid #333', color:'#666', padding:'10px', width:'100%', borderRadius:'8px', cursor:'pointer', fontSize: '0.8rem', transition: 'all 0.2s' }} onMouseEnter={(e) => {e.target.style.borderColor = '#ef4444'; e.target.style.color = '#ef4444'}} onMouseLeave={(e) => {e.target.style.borderColor = '#333'; e.target.style.color = '#666'}}>
            Sign Out
        </button>
      </div>

      <div className="main-content">
        {activeTab === 'workbench' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div className="top-bar">
                    <div style={{color: '#737373', fontSize: '0.9rem'}}>project / <span style={{color:'white'}}>workbench</span></div>
                    <button className="btn-primary" onClick={handleRefactor} disabled={loading}>
                        {loading ? 'Processing...' : 'Refactor Code'}
                    </button>
                </div>
                <div className="editor-grid" style={{ padding: '1.5rem', flex: 1, minHeight: 0 }}>
                    <div className="editor-window">
                        <div className="window-header">
                            <div className="window-dots"><div className="dot red"></div><div className="dot yellow"></div><div className="dot green"></div></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', justifyContent: 'space-between' }}>
                              <div className="window-title">
                                SOURCE.{selectedLang === 'auto' ? (detectedLang || 'CODE').toUpperCase() : selectedLang.toUpperCase()}
                              </div>
                              <select 
                                value={selectedLang} 
                                onChange={(e) => setSelectedLang(e.target.value)}
                                style={{
                                  background: '#18181b',
                                  color: '#a1a1aa',
                                  border: '1px solid #27272a',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  padding: '2px 4px',
                                  outline: 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                {SUPPORTED_LANGUAGES.map(lang => (
                                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                                ))}
                              </select>
                            </div>
                        </div>
                        <textarea 
                          value={inputCode} 
                          onChange={e => setInputCode(e.target.value)} 
                          placeholder={`Paste your ${selectedLang !== 'auto' ? selectedLang : 'code'} here...`} 
                        />
                    </div>
                    <div className="editor-window">
                         <div className="window-header">
                            <div className="window-dots"><div className="dot red"></div><div className="dot yellow"></div><div className="dot green"></div></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="window-title">
                                  REFACTORED.{detectedLang ? detectedLang.toUpperCase() : 'CODE'}
                                </div>
                                {detectedLang && (
                                    <span style={{ fontSize: '10px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.3)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                        {detectedLang}
                                    </span>
                                )}
                            </div>
                         </div>
                         {resultCode ? (
                            <SyntaxHighlighter language={detectedLang || "python"} style={vscDarkPlus} customStyle={{margin:0, height:'100%', background: 'transparent', fontSize:'13px'}}>
                              {resultCode}
                            </SyntaxHighlighter>
                         ) : <div style={{padding:'24px', color:'#333', fontStyle:'italic', fontFamily:'Inter'}}>Waiting for input...</div>}
                    </div>
                </div>
                <div style={{ height: '180px', background: '#050505', borderTop: '1px solid var(--glass-border)', padding: '1.5rem', overflowY: 'auto' }}>
                    <div style={{color: '#3b82f6', fontSize: '0.8rem', fontWeight: '600', marginBottom:'8px', textTransform:'uppercase'}}>AI Explanation</div>
                    <div style={{ color: '#a1a1aa', fontSize:'0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {explanation || "Refactor details will appear here after processing."}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'knowledge' && (
            <div className="fade-in" style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                <h2 style={{ marginBottom: '0.5rem', fontSize:'1.8rem', letterSpacing:'-0.02em' }}>Knowledge Base</h2>
                <p style={{ color: '#737373', marginBottom: '2.5rem' }}>Train the AI on your specific coding patterns (RAG).</p>
                <div className="glass-card">
                    <h3 style={{ marginTop: '0px', marginBottom: '1rem', display:'flex', alignItems:'center', gap:'10px' }}>
                        <Icons.Upload /> Upload Training Data (ZIP)
                    </h3>
                    <input type="file" onChange={handleTrainZip} accept=".zip" style={{ color: '#a1a1aa', fontSize: '0.9rem' }} />
                </div>
                <div className="glass-card">
                    <h3 style={{ marginTop: '0px', marginBottom: '1rem', display:'flex', alignItems:'center', gap:'10px' }}>
                        <Icons.Github /> Train on GitHub Repo
                    </h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input type="text" placeholder="username/repo" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} style={{ flex: 1, padding: '10px 16px', borderRadius: '6px', border: '1px solid #333', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none' }} />
                        <button className="btn-primary" style={{height:'40px'}} onClick={handleTrainGithub}>Train AI</button>
                    </div>
                </div>
                {uploadStatus && (
                    <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '6px', color: '#4ade80', fontSize: '0.9rem' }}>
                        {uploadStatus}
                    </div>
                )}
            </div>
        )}

        {activeTab === 'files' && (
            <div className="fade-in" style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto', width: '96.5%', overflowY: 'auto', height: '100vh' }}>
                <h2 style={{ marginBottom: '0.5rem', fontSize:'1.8rem', letterSpacing:'-0.02em' }}>Project Files</h2>
                <p style={{ color: '#737373', marginBottom: '2.5rem' }}>Browse files and load them into the workbench.</p>
                <div className="glass-card">
                    <h3 style={{ marginTop: '0px', marginBottom: '1rem', display:'flex', alignItems:'center', gap:'10px' }}>
                        <Icons.Upload /> Open Project (ZIP)
                    </h3>
                    <input type="file" onChange={handleFetchZipFiles} accept=".zip" style={{ color: '#a1a1aa', fontSize: '0.9rem' }} />
                </div>
                <div className="glass-card">
                    <h3 style={{ marginTop: '0px', marginBottom: '1rem', display:'flex', alignItems:'center', gap:'10px' }}>
                        <Icons.Github /> Open GitHub Repo
                    </h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input type="text" placeholder="username/repo" value={filesUrl} onChange={(e) => setFilesUrl(e.target.value)} style={{ flex: 1, padding: '10px 16px', borderRadius: '6px', border: '1px solid #333', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none' }} />
                        <button className="btn-primary" style={{height:'40px'}} onClick={handleFetchGithubFiles}>Fetch Files</button>
                    </div>
                </div>
                {uploadStatus && (
                     <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '6px', color: '#60a5fa', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        {uploadStatus}
                    </div>
                )}
                {projectFiles.length > 0 && (
                    <div style={{ marginTop: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize:'1.2rem' }}>📂 Explorer</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                            {projectFiles.map((file, idx) => (
                                <div key={idx} onClick={() => loadFileToWorkbench(file.content)}
                                    className="glass-card"
                                    style={{ padding: '1rem', cursor: 'pointer', display:'flex', alignItems:'center', gap:'10px', border: '1px solid #333', transition: 'all 0.2s', marginBottom: 0 }}
                                    onMouseOver={e => {e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.transform = 'translateY(-2px)'}}
                                    onMouseOut={e => {e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.transform = 'translateY(0)'}}
                                >
                                    <div style={{color:'#3b82f6'}}><Icons.File /></div>
                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem', color:'#e4e4e7' }}>
                                        {file.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'personalization' && (
            <div className="fade-in" style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                <h2 style={{ marginBottom: '0.5rem', fontSize:'1.8rem', letterSpacing:'-0.02em' }}>Settings</h2>
                <p style={{ color: '#737373', marginBottom: '2.5rem' }}>Customize how the AI interprets your code.</p>
                <div className="glass-card" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div>
                        <h3 style={{fontSize:'1rem', marginBottom:'4px', marginTop:'0px'}}>RAG (Context Awareness)</h3>
                        <p style={{ color: '#737373', fontSize:'0.85rem', margin:0 }}>Use trained knowledge base for refactoring.</p>
                    </div>
                    <label className="switch" style={{position:'relative', display:'inline-block', width:'46px', height:'24px'}}>
                        <input type="checkbox" checked={useRAG} onChange={(e) => setUseRAG(e.target.checked)} style={{opacity:0, width:0, height:0}} />
                        <span style={{position:'absolute', cursor:'pointer', top:0, left:0, right:0, bottom:0, background: useRAG ? '#3b82f6' : '#333', borderRadius:'34px', transition:'.4s'}}></span>
                        <span style={{position:'absolute', height:'18px', width:'18px', left:'3px', bottom:'3px', background:'white', borderRadius:'50%', transition:'.4s', transform: useRAG ? 'translateX(22px)' : 'translateX(0)'}}></span>
                    </label>
                </div>
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Manual Style Rules</h3>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: isStyleSaved ? '#4ade80' : '#facc15', background: isStyleSaved ? 'rgba(74, 222, 128, 0.1)' : 'rgba(250, 204, 21, 0.1)', padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.05em' }}>
                            {isStyleSaved ? 'SYNCED' : 'SAVING...'}
                        </span>
                    </div>
                    <textarea value={customStyle} onChange={handleStyleChange} placeholder="Ex: Always use snake_case. Add comments for every function..." spellCheck="false" style={{ width: '96.5%', height: '140px', background: 'rgba(0,0,0,0.4)', border: '1px solid #333', color: '#e4e4e7', borderRadius: '8px', padding: '12px', fontSize: '0.85rem', resize: 'none', outline: 'none', transition: 'border-color 0.2s' }} onFocus={(e) => e.target.style.borderColor = '#3b82f6'} onBlur={(e) => e.target.style.borderColor = '#333'} />
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

export default App;