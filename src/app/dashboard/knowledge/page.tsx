'use client';

import { useState, useEffect } from 'react';
import { useFiles, useFileContent, FileItem } from '@/hooks/use-workspace';
import { 
  Plus, 
  Folder, 
  FileText, 
  Search, 
  ChevronRight,
  ArrowLeft,
  Save,
  X,
  Eye,
  Edit3,
  Trash2,
  FolderPlus,
  Clock,
  File,
  Loader2,
  RefreshCw,
  AlertCircle,
  BookOpen,
  Sparkles
} from 'lucide-react';

// Knowledge Base root
const KNOWLEDGE_ROOT = '~/knowledge';

export default function KnowledgeBasePage() {
  const [currentPath, setCurrentPath] = useState(KNOWLEDGE_ROOT);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const { folders, files, isLoading, isError, error, refresh } = useFiles(currentPath);
  const { file: selectedFile, content: fileContent, isLoading: fileLoading, refresh: refreshFile } = useFileContent(selectedFilePath);
  
  useEffect(() => {
    if (fileContent && !isEditing) {
      setEditContent(fileContent);
    }
  }, [fileContent, isEditing]);

  const pathParts = currentPath.split('/').filter(Boolean);
  
  const navigateToFolder = (folder: string) => {
    const newPath = `${currentPath}/${folder}`;
    setCurrentPath(newPath);
    setSelectedFilePath(null);
  };

  const navigateUp = () => {
    if (currentPath === KNOWLEDGE_ROOT) return;
    const parts = currentPath.split('/');
    parts.pop();
    const newPath = parts.join('/');
    if (!newPath.startsWith(KNOWLEDGE_ROOT)) {
      setCurrentPath(KNOWLEDGE_ROOT);
    } else {
      setCurrentPath(newPath);
    }
    setSelectedFilePath(null);
  };

  const navigateToPath = (index: number) => {
    if (index <= 2) {
      setCurrentPath(KNOWLEDGE_ROOT);
    } else {
      const newPath = pathParts.slice(0, index + 1).join('/');
      setCurrentPath(newPath);
    }
    setSelectedFilePath(null);
  };

  const openFile = (file: FileItem) => {
    const filePath = `${currentPath}/${file.name}`;
    setSelectedFilePath(filePath);
    setIsEditing(false);
  };

  const startEditing = () => {
    setIsEditing(true);
    setEditContent(fileContent);
  };

  const saveFile = async () => {
    if (!selectedFilePath) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/vm/files/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedFilePath, content: editContent }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
      
      setIsEditing(false);
      refreshFile();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save file');
    } finally {
      setSaving(false);
    }
  };

  const discardChanges = () => {
    setEditContent(fileContent);
    setIsEditing(false);
  };

  const closeFile = () => {
    setSelectedFilePath(null);
    setIsEditing(false);
  };

  const deleteFile = async (filePath: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      const res = await fetch(`/api/vm/files?path=${encodeURIComponent(filePath)}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      
      if (selectedFilePath === filePath) {
        setSelectedFilePath(null);
      }
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const filteredFolders = folders.filter(f => 
    f.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderMarkdown = (text: string) => {
    return text
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-2xl font-bold mb-4">{line.slice(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-xl font-semibold mt-6 mb-3">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.slice(4)}</h3>;
        }
        if (line.startsWith('- ')) {
          return <li key={i} className="ml-4">{line.slice(2)}</li>;
        }
        if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
          return <p key={i} className="italic text-slate-600 mb-2">{line.slice(1, -1)}</p>;
        }
        if (line.trim() === '') {
          return <br key={i} />;
        }
        const boldText = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        return <p key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: boldText }} />;
      });
  };

  return (
    <div className="h-[calc(100vh-12rem)]">
      {selectedFilePath ? (
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={closeFile}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <h1 className="text-xl font-bold text-slate-900">
                    {selectedFilePath.split('/').pop()}
                  </h1>
                  {fileLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                </div>
                {selectedFile && (
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last edited {formatDate(selectedFile.modified)}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={discardChanges}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    onClick={saveFile}
                    disabled={saving}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className={`p-2 rounded-lg transition-colors ${showPreview ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:bg-slate-100'}`}
                    title="Toggle preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={startEditing}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" /> Edit
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
            <div className={`${!isEditing && showPreview ? 'hidden lg:block' : ''} ${!showPreview && !isEditing ? 'lg:col-span-2' : ''}`}>
              <div className="h-full bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-600">
                  {isEditing ? 'Editor' : 'Source'}
                </div>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  readOnly={!isEditing}
                  className={`flex-1 w-full p-4 font-mono text-sm resize-none focus:outline-none ${
                    isEditing ? 'bg-white' : 'bg-slate-50 cursor-default'
                  }`}
                  placeholder="Start writing..."
                />
              </div>
            </div>

            {(showPreview || !isEditing) && (
              <div className={`${isEditing ? '' : 'lg:col-span-2'} ${!showPreview && isEditing ? 'hidden' : ''}`}>
                <div className="h-full bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-600">
                    Preview
                  </div>
                  <div className="flex-1 p-6 overflow-auto prose prose-slate max-w-none">
                    {renderMarkdown(isEditing ? editContent : fileContent)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-purple-500" />
                Knowledge Base
              </h1>
              <p className="text-slate-500">Documents your assistant can search and reference</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => refresh()}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={() => setShowNewFolderModal(true)}
                className="inline-flex items-center gap-1 px-3 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setShowNewFileModal(true)}
                className="inline-flex items-center gap-1 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Document
              </button>
            </div>
          </div>

          {/* Info banner */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-purple-800">Semantic Search Enabled</p>
              <p className="text-purple-600">Documents here are automatically indexed. Your assistant can search and reference this content when answering questions.</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-1 text-sm">
            {pathParts.map((part, index) => {
              if (part === '~' || part === 'user') return null;
              const isKnowledgeRoot = part === 'knowledge' && index === 2;
              const displayName = isKnowledgeRoot ? 'Knowledge Base' : part;
              const isLast = index === pathParts.length - 1;
              
              return (
                <div key={index} className="flex items-center">
                  {index > 2 && <ChevronRight className="w-4 h-4 text-slate-300 mx-1" />}
                  <button
                    onClick={() => navigateToPath(index)}
                    className={`hover:text-purple-600 transition-colors ${
                      isLast ? 'text-slate-900 font-medium' : 'text-slate-500'
                    }`}
                  >
                    {displayName}
                  </button>
                </div>
              );
            })}
          </div>

          {isError && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-700">{error}</p>
            </div>
          )}

          {isLoading && folders.length === 0 && files.length === 0 && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          )}

          {!isLoading && (
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {currentPath !== KNOWLEDGE_ROOT && (
                <button
                  onClick={navigateUp}
                  className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-600">..</span>
                </button>
              )}

              {filteredFolders.map((folder) => (
                <button
                  key={folder}
                  onClick={() => navigateToFolder(folder)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Folder className="w-5 h-5 text-purple-500" />
                    <span className="font-medium text-slate-900">{folder}/</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                </button>
              ))}
              
              {filteredFiles.map((file) => {
                const filePath = `${currentPath}/${file.name}`;
                return (
                  <div
                    key={file.name}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
                  >
                    <button
                      onClick={() => openFile(file)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <FileText className="w-5 h-5 text-slate-400" />
                      <div>
                        <span className="font-medium text-slate-900">{file.name}</span>
                        <p className="text-xs text-slate-400">
                          {formatSize(file.size)} • {formatDate(file.modified)}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openFile(file)}
                        className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded transition-colors"
                      >
                        Open
                      </button>
                      <button 
                        onClick={() => deleteFile(filePath)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredFolders.length === 0 && filteredFiles.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  {searchQuery ? (
                    <p>No documents match "{searchQuery}"</p>
                  ) : (
                    <>
                      <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="font-medium text-slate-700 mb-1">Your Knowledge Base is empty</p>
                      <p className="text-sm mb-4">Add documents here that you want your assistant to know about.</p>
                      <button 
                        onClick={() => setShowNewFileModal(true)}
                        className="text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Add your first document
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showNewFileModal && (
        <NewFileModal 
          onClose={() => setShowNewFileModal(false)} 
          currentPath={currentPath}
          onCreated={() => refresh()}
        />
      )}

      {showNewFolderModal && (
        <NewFolderModal 
          onClose={() => setShowNewFolderModal(false)} 
          currentPath={currentPath}
          onCreated={() => refresh()}
        />
      )}
    </div>
  );
}

function NewFileModal({ onClose, currentPath, onCreated }: { onClose: () => void; currentPath: string; onCreated: () => void }) {
  const [fileName, setFileName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!fileName) return;
    
    const finalName = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
    
    setCreating(true);
    try {
      const filePath = `${currentPath}/${finalName}`;
      const res = await fetch('/api/vm/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content: `# ${fileName.replace('.md', '')}\n\n` }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create document');
      }
      
      onCreated();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create document');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">New Document</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Document Name</label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="my-notes"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <p className="text-xs text-slate-400 mt-1">.md extension will be added automatically</p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!fileName || creating}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewFolderModal({ onClose, currentPath, onCreated }: { onClose: () => void; currentPath: string; onCreated: () => void }) {
  const [folderName, setFolderName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!folderName) return;
    
    setCreating(true);
    try {
      const folderPath = `${currentPath}/${folderName}`;
      const res = await fetch('/api/vm/files/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: folderPath }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create folder');
      }
      
      onCreated();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">New Folder</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Folder Name</label>
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="my-folder"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!folderName || creating}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
