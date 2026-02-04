'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Upload,
  Download,
  FolderOpen,
  Archive,
  FileUp,
  FileDown
} from 'lucide-react';

// Folder descriptions for the root level
const FOLDER_INFO: Record<string, { icon: React.ReactNode; description: string; color: string }> = {
  'downloads': { 
    icon: <FileDown className="w-5 h-5" />, 
    description: 'Files your assistant downloads for you',
    color: 'text-blue-500'
  },
  'uploads': { 
    icon: <FileUp className="w-5 h-5" />, 
    description: 'Files you share with your assistant',
    color: 'text-green-500'
  },
  'projects': { 
    icon: <FolderOpen className="w-5 h-5" />, 
    description: 'Project documentation maintained by your assistant',
    color: 'text-amber-500'
  },
};

export default function FilesPage() {
  const [currentPath, setCurrentPath] = useState('~');
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Use userView=true at root level to filter to user folders
  const isRoot = currentPath === '~';
  const { folders, files, isLoading, isError, error, refresh } = useFiles(currentPath, isRoot);
  const { file: selectedFile, content: fileContent, isLoading: fileLoading, refresh: refreshFile } = useFileContent(selectedFilePath);
  
  // Update edit content when file loads
  useEffect(() => {
    if (fileContent && !isEditing) {
      setEditContent(fileContent);
    }
  }, [fileContent, isEditing]);

  const pathParts = currentPath.split('/').filter(Boolean);
  
  const navigateToFolder = (folder: string) => {
    const newPath = currentPath === '~' ? `~/${folder}` : `${currentPath}/${folder}`;
    setCurrentPath(newPath);
    setSelectedFilePath(null);
  };

  const navigateUp = () => {
    if (currentPath === '~') return;
    const parts = currentPath.split('/');
    parts.pop();
    const newPath = parts.join('/') || '~';
    setCurrentPath(newPath);
    setSelectedFilePath(null);
  };

  const navigateToPath = (index: number) => {
    if (index === 0) {
      setCurrentPath('~');
    } else {
      const newPath = pathParts.slice(0, index + 1).join('/');
      setCurrentPath(newPath);
    }
    setSelectedFilePath(null);
  };

  const openFile = (file: FileItem) => {
    const filePath = currentPath === '~' ? `~/${file.name}` : `${currentPath}/${file.name}`;
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
    if (!confirm('Are you sure you want to delete this file?')) return;
    
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
      alert(err instanceof Error ? err.message : 'Failed to delete file');
    }
  };

  const downloadFile = async (file: FileItem) => {
    const filePath = currentPath === '~' ? `~/${file.name}` : `${currentPath}/${file.name}`;
    const url = `/api/vm/files/download?path=${encodeURIComponent(filePath)}`;
    
    // Open in new tab to trigger download
    window.open(url, '_blank');
  };

  // Upload handling
  const handleUpload = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    
    // Determine upload path (use uploads/ if at root, otherwise current path)
    const uploadPath = isRoot ? '~/uploads' : currentPath;
    
    setUploading(true);
    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch(`/api/vm/files/upload?path=${encodeURIComponent(uploadPath)}`, {
          method: 'POST',
          body: formData,
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `Failed to upload ${file.name}`);
        }
      }
      
      // Refresh the appropriate directory
      if (isRoot) {
        // If we uploaded to uploads/ from root, navigate there
        setCurrentPath('~/uploads');
      }
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  }, [currentPath, isRoot, refresh]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  }, [handleUpload]);

  // Filter files/folders based on search, sort archive to bottom
  const filteredFolders = folders
    .filter(f => f.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      // Archive always goes last
      if (a === 'archive') return 1;
      if (b === 'archive') return -1;
      return a.localeCompare(b);
    });
  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format date
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

  // Simple markdown to HTML (basic)
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

  // Check if we're in the uploads folder (to show upload UI prominently)
  const isInUploads = currentPath.startsWith('~/uploads');

  return (
    <div 
      className="h-[calc(100vh-12rem)]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 bg-amber-500/20 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-amber-500 border-dashed">
            <Upload className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <p className="text-lg font-medium text-slate-900">Drop files to upload</p>
            <p className="text-sm text-slate-500">Files will be saved to {isRoot ? 'uploads/' : currentPath.replace('~/', '')}</p>
          </div>
        </div>
      )}

      {selectedFilePath ? (
        // File Editor View
        <div className="h-full flex flex-col">
          {/* Editor Header */}
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

          {/* Editor Content */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
            {/* Editor Pane */}
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

            {/* Preview Pane */}
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
        // File Browser View
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Folder className="w-6 h-6 text-amber-500" />
                Files
              </h1>
              <p className="text-slate-500">Shared files between you and your assistant</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => refresh()}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              {/* Upload button */}
              <label className="inline-flex items-center gap-1 px-3 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Upload</span>
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleUpload(e.target.files)}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              {!isRoot && (
                <>
                  <button 
                    onClick={() => setShowNewFolderModal(true)}
                    className="inline-flex items-center gap-1 px-3 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <FolderPlus className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowNewFileModal(true)}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> New File
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files and folders..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm">
            {pathParts.map((part, index) => {
              const displayName = part === '~' ? 'Files' : part;
              const isLast = index === pathParts.length - 1;
              
              return (
                <div key={index} className="flex items-center">
                  {index > 0 && <ChevronRight className="w-4 h-4 text-slate-300 mx-1" />}
                  <button
                    onClick={() => navigateToPath(index)}
                    className={`hover:text-amber-600 transition-colors ${
                      isLast ? 'text-slate-900 font-medium' : 'text-slate-500'
                    }`}
                  >
                    {displayName}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Upload indicator */}
          {uploading && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-amber-500 animate-spin shrink-0" />
              <p className="text-sm text-amber-700">Uploading files...</p>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-700">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && folders.length === 0 && files.length === 0 && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          )}

          {/* File List */}
          {!isLoading && (
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {/* Back button if not at root */}
              {!isRoot && (
                <button
                  onClick={navigateUp}
                  className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-600">..</span>
                </button>
              )}

              {/* Folders */}
              {filteredFolders.map((folder) => {
                const info = isRoot ? FOLDER_INFO[folder] : null;
                
                return (
                  <button
                    key={folder}
                    onClick={() => navigateToFolder(folder)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      {info ? (
                        <span className={info.color}>{info.icon}</span>
                      ) : folder === 'archive' ? (
                        <Archive className="w-5 h-5 text-slate-400" />
                      ) : (
                        <Folder className="w-5 h-5 text-amber-500" />
                      )}
                      <div>
                        <span className="font-medium text-slate-900">{folder}</span>
                        {info && (
                          <p className="text-xs text-slate-500">{info.description}</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                  </button>
                );
              })}
              
              {/* Files */}
              {filteredFiles.map((file) => {
                const filePath = currentPath === '~' ? `~/${file.name}` : `${currentPath}/${file.name}`;
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
                        onClick={() => downloadFile(file)}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openFile(file)}
                        className="px-3 py-1 text-sm text-amber-600 hover:bg-amber-50 rounded transition-colors"
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

              {/* Empty state */}
              {filteredFolders.length === 0 && filteredFiles.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  {searchQuery ? (
                    <p>No files or folders match &ldquo;{searchQuery}&rdquo;</p>
                  ) : isInUploads ? (
                    <>
                      <Upload className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="font-medium text-slate-700 mb-1">No uploads yet</p>
                      <p className="text-sm mb-4">Drag files here or click Upload to share files with your assistant.</p>
                      <label className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium cursor-pointer">
                        <Upload className="w-4 h-4" />
                        Upload files
                        <input
                          type="file"
                          multiple
                          onChange={(e) => handleUpload(e.target.files)}
                          className="hidden"
                        />
                      </label>
                    </>
                  ) : (
                    <>
                      <File className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="font-medium text-slate-700 mb-1">No files here yet</p>
                      <p className="text-sm mb-4">Your assistant can create files here, or you can add your own.</p>
                      <button 
                        onClick={() => setShowNewFileModal(true)}
                        className="text-amber-600 hover:text-amber-700 font-medium"
                      >
                        Create a file
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* New File Modal */}
      {showNewFileModal && (
        <NewFileModal 
          onClose={() => setShowNewFileModal(false)} 
          currentPath={currentPath}
          onCreated={() => refresh()}
        />
      )}

      {/* New Folder Modal */}
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
    
    setCreating(true);
    try {
      const filePath = currentPath === '~' ? `~/${fileName}` : `${currentPath}/${fileName}`;
      const res = await fetch('/api/vm/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content: '' }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create file');
      }
      
      onCreated();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create file');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">New File</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">File Name</label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="notes.md"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <p className="text-xs text-slate-400 mt-1">Creating in: {currentPath}/</p>
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
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
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
      const folderPath = currentPath === '~' ? `~/${folderName}` : `${currentPath}/${folderName}`;
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
            placeholder="new-folder"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <p className="text-xs text-slate-400 mt-1">Creating in: {currentPath}/</p>
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
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
