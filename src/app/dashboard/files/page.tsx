'use client';

import { useState } from 'react';
import { 
  Plus, 
  Upload, 
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
  MoreVertical,
  Clock,
  File
} from 'lucide-react';

// Mock file system structure
const mockFileSystem: Record<string, { folders: string[], files: FileItem[] }> = {
  '~': {
    folders: ['00-inbox', '01-projects', '02-areas', '03-resources', '04-ideas', '05-archive', 'memory'],
    files: [
      { name: 'SOUL.md', size: '2.1 KB', modified: '3 days ago', content: `# SOUL.md - Who Your Assistant Is

*I'm not a chatbot. I'm your executive assistant — warm, brilliant, and just playful enough to keep things interesting.*

## Core Identity

**Warm and friendly** — I'm approachable, never cold or robotic. You should feel like you're working with someone who genuinely has your back.

**Brilliant** — I bring real insight, not just task completion. I think ahead, spot patterns, and surface things you might miss when you're deep in the weeds.

**Efficient but creative** — I get things done fast, but I also think outside the box. Sometimes the best answer isn't the obvious one.

## My Job

Help you win. At work. At home. In life.

That means:
- Keeping you organized and focused
- Surfacing what's important (and flagging what's not)
- Thinking ahead so you don't have to
- Being a thought partner, not just a task-taker
- Protecting your time and attention
` },
      { name: 'USER.md', size: '1.4 KB', modified: '1 week ago', content: `# USER.md - About You

- **Name:** [Your Name]
- **Timezone:** America/Los_Angeles

## Work

[Tell your assistant about your work, company, role, etc.]

## Interests

[What are you interested in? What matters to you?]

## Notes

[Any other context that would help your assistant serve you better]
` },
      { name: 'MEMORY.md', size: '3.2 KB', modified: '2 hours ago', content: `# MEMORY.md — Long-Term Memory

*Things worth remembering. Updated as I learn.*

---

## Key Dates

- Assistant activated: [Date]

## Important Context

[Your assistant will add important things to remember here]

## Preferences

[Communication preferences, work style, etc.]
` },
      { name: 'AGENTS.md', size: '4.8 KB', modified: '2 weeks ago', content: `# AGENTS.md - Your Workspace

This folder is home. Treat it that way.

## Memory

You wake up fresh each session. These files are your memory:
- **Daily notes:** \`memory/YYYY-MM-DD.md\` — raw logs of what happened
- **Long-term:** \`MEMORY.md\` — curated memories

Capture what matters. Decisions, context, things to remember.

## Safety

- Don't exfiltrate private data. Ever.
- Don't run destructive commands without asking.
- When in doubt, ask.
` },
    ],
  },
  '~/00-inbox': {
    folders: [],
    files: [],
  },
  '~/01-projects': {
    folders: ['website-redesign', 'q1-planning'],
    files: [],
  },
  '~/01-projects/website-redesign': {
    folders: [],
    files: [
      { name: 'README.md', size: '1.2 KB', modified: '5 days ago', content: '# Website Redesign\n\nProject to redesign the company website.\n\n## Goals\n\n- Modern, clean design\n- Improved mobile experience\n- Better conversion rates' },
      { name: 'notes.md', size: '0.8 KB', modified: '3 days ago', content: '# Notes\n\n- Check competitor sites\n- Get quotes from designers\n- Review current analytics' },
    ],
  },
  '~/01-projects/q1-planning': {
    folders: [],
    files: [
      { name: 'goals.md', size: '1.5 KB', modified: '1 week ago', content: '# Q1 Goals\n\n1. Launch new product feature\n2. Hire 2 new team members\n3. Increase MRR by 20%' },
    ],
  },
  '~/02-areas': {
    folders: ['health', 'finances', 'career'],
    files: [],
  },
  '~/03-resources': {
    folders: [],
    files: [
      { name: 'bookmarks.md', size: '2.3 KB', modified: '4 days ago', content: '# Bookmarks\n\nUseful links and resources.' },
    ],
  },
  '~/04-ideas': {
    folders: [],
    files: [
      { name: 'backlog.md', size: '1.1 KB', modified: '2 days ago', content: '# Ideas Backlog\n\nIdeas to explore later.' },
    ],
  },
  '~/05-archive': {
    folders: [],
    files: [],
  },
  '~/memory': {
    folders: [],
    files: [
      { name: '2026-01-31.md', size: '0.5 KB', modified: 'Today', content: '# 2026-01-31\n\n## Today\n\n- Started using Astrid\n- Set up workspace' },
      { name: '2026-01-30.md', size: '0.3 KB', modified: 'Yesterday', content: '# 2026-01-30\n\n## Today\n\n- Planning day' },
    ],
  },
  '~/02-areas/health': { folders: [], files: [] },
  '~/02-areas/finances': { folders: [], files: [] },
  '~/02-areas/career': { folders: [], files: [] },
};

interface FileItem {
  name: string;
  size: string;
  modified: string;
  content?: string;
}

export default function FilesPage() {
  const [currentPath, setCurrentPath] = useState('~');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);

  const currentDir = mockFileSystem[currentPath] || { folders: [], files: [] };
  
  const pathParts = currentPath.split('/').filter(Boolean);
  
  const navigateToFolder = (folder: string) => {
    const newPath = currentPath === '~' ? `~/${folder}` : `${currentPath}/${folder}`;
    setCurrentPath(newPath);
    setSelectedFile(null);
  };

  const navigateUp = () => {
    if (currentPath === '~') return;
    const parts = currentPath.split('/');
    parts.pop();
    setCurrentPath(parts.join('/') || '~');
    setSelectedFile(null);
  };

  const navigateToPath = (index: number) => {
    if (index === 0) {
      setCurrentPath('~');
    } else {
      const newPath = '~/' + pathParts.slice(1, index + 1).join('/');
      setCurrentPath(newPath);
    }
    setSelectedFile(null);
  };

  const openFile = (file: FileItem) => {
    setSelectedFile(file);
    setEditContent(file.content || '');
    setIsEditing(false);
  };

  const startEditing = () => {
    setIsEditing(true);
    setEditContent(selectedFile?.content || '');
  };

  const saveFile = () => {
    // In real app, save to backend
    if (selectedFile) {
      selectedFile.content = editContent;
    }
    setIsEditing(false);
  };

  const discardChanges = () => {
    setEditContent(selectedFile?.content || '');
    setIsEditing(false);
  };

  const closeFile = () => {
    setSelectedFile(null);
    setIsEditing(false);
  };

  // Filter files/folders based on search
  const filteredFolders = currentDir.folders.filter(f => 
    f.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredFiles = currentDir.files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        // Handle bold text
        const boldText = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        return <p key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: boldText }} />;
      });
  };

  return (
    <div className="h-[calc(100vh-12rem)]">
      {selectedFile ? (
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
                  <h1 className="text-xl font-bold text-slate-900">{selectedFile.name}</h1>
                </div>
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last edited {selectedFile.modified}
                </p>
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
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    <Save className="w-4 h-4" /> Save
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
                    {renderMarkdown(isEditing ? editContent : (selectedFile.content || ''))}
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
              <h1 className="text-2xl font-bold text-slate-900">Files</h1>
              <p className="text-slate-500">Browse your second brain</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowNewFolderModal(true)}
                className="inline-flex items-center gap-1 px-3 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setShowNewFileModal(true)}
                className="inline-flex items-center gap-1 px-3 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Plus className="w-4 h-4" /> New File
              </button>
              <button className="inline-flex items-center gap-1 px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">
                <Upload className="w-4 h-4" /> Upload
              </button>
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
            {pathParts.map((part, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <ChevronRight className="w-4 h-4 text-slate-300 mx-1" />}
                <button
                  onClick={() => navigateToPath(index)}
                  className={`hover:text-amber-600 transition-colors ${
                    index === pathParts.length - 1 ? 'text-slate-900 font-medium' : 'text-slate-500'
                  }`}
                >
                  {part === '~' ? 'Home' : part}
                </button>
              </div>
            ))}
          </div>

          {/* File List */}
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {/* Back button if not at root */}
            {currentPath !== '~' && (
              <button
                onClick={navigateUp}
                className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400" />
                <span className="text-slate-600">..</span>
              </button>
            )}

            {/* Folders */}
            {filteredFolders.map((folder) => (
              <button
                key={folder}
                onClick={() => navigateToFolder(folder)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <Folder className="w-5 h-5 text-amber-500" />
                  <span className="font-medium text-slate-900">{folder}/</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
              </button>
            ))}
            
            {/* Files */}
            {filteredFiles.map((file) => (
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
                    <p className="text-xs text-slate-400">{file.size} • {file.modified}</p>
                  </div>
                </button>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openFile(file)}
                    className="px-3 py-1 text-sm text-amber-600 hover:bg-amber-50 rounded transition-colors"
                  >
                    Open
                  </button>
                  <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Empty state */}
            {filteredFolders.length === 0 && filteredFiles.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                {searchQuery ? (
                  <p>No files or folders match "{searchQuery}"</p>
                ) : (
                  <>
                    <File className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p>This folder is empty</p>
                    <button 
                      onClick={() => setShowNewFileModal(true)}
                      className="mt-3 text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Create a file
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* New File Modal */}
      {showNewFileModal && (
        <NewFileModal 
          onClose={() => setShowNewFileModal(false)} 
          currentPath={currentPath}
        />
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <NewFolderModal 
          onClose={() => setShowNewFolderModal(false)} 
          currentPath={currentPath}
        />
      )}
    </div>
  );
}

function NewFileModal({ onClose, currentPath }: { onClose: () => void; currentPath: string }) {
  const [fileName, setFileName] = useState('');

  const handleCreate = () => {
    // In real app, create file via API
    console.log('Creating file:', fileName, 'in', currentPath);
    onClose();
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
            disabled={!fileName}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

function NewFolderModal({ onClose, currentPath }: { onClose: () => void; currentPath: string }) {
  const [folderName, setFolderName] = useState('');

  const handleCreate = () => {
    // In real app, create folder via API
    console.log('Creating folder:', folderName, 'in', currentPath);
    onClose();
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
            disabled={!folderName}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
