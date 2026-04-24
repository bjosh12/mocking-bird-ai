import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Trash2, Upload, ArrowLeft } from 'lucide-react';

export function KnowledgeBase() {
  const { setCurrentView, documents, setDocuments } = useStore();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    if ((window as any).electronAPI) {
      const docs = await (window as any).electronAPI.db.getDocuments();
      setDocuments(docs);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const filePath = (file as any).path;
      if (!filePath) {
        alert("File path not available.");
        return;
      }

      if ((window as any).electronAPI) {
        const text = await (window as any).electronAPI.file.parsePdf(filePath);
        
        const newDoc = {
          id: Date.now().toString(),
          title: file.name,
          content: text,
          created_at: new Date().toISOString()
        };

        await (window as any).electronAPI.db.saveDocument(newDoc);

        // Sync to cloud if user is logged in
        const cloudUser = await (window as any).electronAPI.cloud.getUser();
        if (cloudUser) {
          await (window as any).electronAPI.cloud.syncDocument(
            { id: newDoc.id, title: newDoc.title, content: text },
            cloudUser.id
          );
        }

        await fetchDocuments();
      }
    } catch (err: any) {
      alert(`Failed to upload document: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if ((window as any).electronAPI) {
      await (window as any).electronAPI.db.deleteDocument(id);
      // Sync deletion to cloud
      await (window as any).electronAPI.cloud.deleteDocument(id);
      await fetchDocuments();
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto h-screen overflow-y-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setCurrentView('home')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground">Upload supporting documents (cover letters, cheat sheets, portfolios) for the AI to reference during your interviews.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>My Documents</CardTitle>
              <CardDescription>These documents will be automatically injected into the AI's context for every live session.</CardDescription>
            </div>
            <div>
              <input 
                type="file" 
                accept="application/pdf" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? "Uploading..." : "Upload PDF"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No documents uploaded</h3>
              <p className="text-sm text-muted-foreground mt-1">Upload a PDF to build your knowledge base.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <Card key={doc.id} className="bg-muted/30">
                  <CardContent className="p-4 flex flex-col h-full justify-between">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-md text-primary">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-medium leading-none truncate max-w-[180px]" title={doc.title}>{doc.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t flex justify-end">
                      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1" onClick={() => handleDelete(doc.id)}>
                        <Trash2 className="w-4 h-4" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
