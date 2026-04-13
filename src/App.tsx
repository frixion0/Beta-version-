import React, { useState, useEffect } from 'react';
import { 
  Wand2, 
  Download, 
  Image as ImageIcon, 
  Settings, 
  History, 
  Home, 
  Sparkles, 
  Loader2, 
  Maximize2,
  Trash2,
  ChevronRight,
  Info,
  Share2,
  Menu,
  SlidersHorizontal,
  Code,
  Terminal,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { GeneratedImage, AppView, PRESETS, MODELS } from './types';
import { enhancePrompt } from './lib/gemini';

export default function App() {
  const [view, setView] = useState<AppView>('home');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Studio Controls
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [selectedStyle, setSelectedStyle] = useState('None');
  const [dimensions, setDimensions] = useState('1:1');
  const [guidance, setGuidance] = useState(7.5);
  const [seed, setSeed] = useState<number | undefined>(undefined);

  const handleEnhance = async () => {
    if (!prompt) return;
    setIsEnhancing(true);
    const enhanced = await enhancePrompt(prompt);
    setPrompt(enhanced);
    setIsEnhancing(false);
  };

  const generateImage = async () => {
    if (!prompt || isGenerating) return;
    
    setIsGenerating(true);
    
    const styleKeywords = PRESETS.find(p => p.name === selectedStyle)?.keywords || '';
    const finalPrompt = `${prompt}${styleKeywords ? `, ${styleKeywords}` : ''}`;
    
    const data = {
      prompt: finalPrompt,
      model: selectedModel,
      guidance: guidance,
      seed: seed || Math.floor(Math.random() * 1000000),
    };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        
        const newImage: GeneratedImage = {
          id: crypto.randomUUID(),
          url,
          prompt: finalPrompt,
          timestamp: Date.now(),
          settings: {
            model: selectedModel,
            style: selectedStyle,
            dimensions,
            guidance,
            seed: data.seed
          }
        };
        
        setCurrentImage(newImage);
        setHistory(prev => [newImage, ...prev]);
      } else {
        console.error("Error generating image:", await res.text());
      }
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (image: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `lumina-${image.id.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const apiDocumentation = `
// Documentation for Lumina AI Image API

// Endpoint: POST /api/generate
// Content-Type: application/json

const data = {
  prompt: "A neon cyborg cat in a cyberpunk alleyway",
  model: "@cf/blackforestlabs/ux-1-schnell", // Optional
  guidance: 7.5, // Optional (1-20)
  seed: 123456 // Optional
};

const res = await fetch("/api/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

if (res.ok) {
  const blob = await res.blob();
  const imageUrl = URL.createObjectURL(blob);
  // Use imageUrl in an <img> tag
}
  `.trim();

  const StudioControls = ({ className }: { className?: string }) => (
    <div className={cn("space-y-8", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Settings size={18} className="text-primary" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-white/70">Studio Controls</h2>
      </div>

      <div className="space-y-8">
        {/* Model Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">AI Model</label>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-full bg-white/5 border-white/10 h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-dark border-white/10">
              {MODELS.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Choose the engine that powers your creation. Flux.1 offers superior detail.
          </p>
        </div>

        <Separator className="bg-white/5" />

        {/* Dimensions */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Aspect Ratio</label>
          <div className="grid grid-cols-3 gap-2">
            {['1:1', '4:3', '16:9', '9:16', '3:4'].map((ratio) => (
              <button
                key={ratio}
                onClick={() => setDimensions(ratio)}
                className={cn(
                  "h-10 rounded-lg border text-xs font-medium transition-all",
                  dimensions === ratio 
                    ? "bg-primary/20 border-primary text-primary" 
                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                )}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        <Separator className="bg-white/5" />

        {/* Guidance Scale */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Guidance Scale</label>
            <span className="text-xs font-mono text-primary">{guidance}</span>
          </div>
          <Slider 
            value={[guidance]} 
            onValueChange={(v) => setGuidance(v[0])} 
            max={20} 
            step={0.5} 
            min={1}
            className="py-2"
          />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Higher values make the AI follow your prompt more strictly.
          </p>
        </div>

        <Separator className="bg-white/5" />

        {/* Seed */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Seed (Optional)</label>
          <Input 
            type="number" 
            placeholder="Random" 
            value={seed || ''} 
            onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
            className="bg-white/5 border-white/10 h-11"
          />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Use a specific seed to reproduce exact results.
          </p>
        </div>

        <div className="pt-4">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <Info size={14} className="text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Pro Tip</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Combine "Cinematic" style with a high guidance scale for dramatic, high-contrast photography.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden font-sans selection:bg-primary/30 flex-col md:flex-row">
        {/* Desktop Navigation Rail */}
        <nav className="hidden md:flex w-16 flex-col items-center py-6 border-r border-white/5 glass-dark z-50">
          <div className="mb-10">
            <div className="w-10 h-10 rounded-xl mesh-gradient flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="text-white w-6 h-6" />
            </div>
          </div>
          
          <div className="flex flex-col gap-6 flex-1">
            <NavIcon 
              icon={<Home size={22} />} 
              active={view === 'home'} 
              onClick={() => setView('home')} 
              label="Studio"
            />
            <NavIcon 
              icon={<History size={22} />} 
              active={view === 'gallery'} 
              onClick={() => setView('gallery')} 
              label="Gallery"
            />
            <NavIcon 
              icon={<Code size={22} />} 
              active={view === 'api'} 
              onClick={() => setView('api')} 
              label="API Docs"
            />
          </div>

          <div className="mt-auto">
            <NavIcon 
              icon={<Settings size={22} />} 
              active={view === 'settings'} 
              onClick={() => setView('settings')} 
              label="Settings"
            />
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative overflow-hidden h-full">
          {/* Header */}
          <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-white/5 glass-dark z-40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="md:hidden w-8 h-8 rounded-lg mesh-gradient flex items-center justify-center">
                <Sparkles className="text-white w-4 h-4" />
              </div>
              <h1 className="text-lg md:text-xl font-heading font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                Lumina Studio
              </h1>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
              <Sheet>
                <SheetTrigger 
                  render={
                    <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground">
                      <SlidersHorizontal size={20} />
                    </Button>
                  }
                />
                <SheetContent side="right" className="glass-dark border-white/10 w-[300px] sm:w-[400px] overflow-y-auto custom-scrollbar">
                  <SheetHeader className="mb-6">
                    <SheetTitle className="text-white">Studio Controls</SheetTitle>
                  </SheetHeader>
                  <StudioControls />
                </SheetContent>
              </Sheet>
              
              <Button variant="ghost" size="sm" className="hidden sm:flex text-muted-foreground hover:text-white">
                <Info size={18} className="mr-2" />
                Guide
              </Button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/10" />
            </div>
          </header>

          {/* Workspace */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Central Stage */}
            <div className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto custom-scrollbar pb-24 md:pb-8">
              <AnimatePresence mode="wait">
                {view === 'home' ? (
                  <motion.div 
                    key="home"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="max-w-4xl mx-auto w-full flex flex-col gap-6 md:gap-8"
                  >
                    {/* Prompt Input Section */}
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-2xl blur opacity-25 group-focus-within:opacity-100 transition duration-500" />
                      <div className="relative glass rounded-2xl p-3 md:p-4 flex flex-col gap-3 md:gap-4 shadow-2xl">
                        <div className="flex gap-4">
                          <div className="flex-1 relative">
                            <textarea
                              value={prompt}
                              onChange={(e) => setPrompt(e.target.value)}
                              placeholder="Describe what you want to create..."
                              className="w-full bg-transparent border-none focus:ring-0 text-base md:text-lg resize-none min-h-[80px] md:min-h-[100px] placeholder:text-muted-foreground/50 custom-scrollbar"
                            />
                            <div className="absolute bottom-0 right-0 p-1 md:p-2 flex gap-2">
                              <Tooltip>
                                <TooltipTrigger 
                                  render={
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={handleEnhance}
                                      disabled={isEnhancing || !prompt}
                                      className="h-8 w-8 rounded-lg hover:bg-white/10 text-primary"
                                    >
                                      {isEnhancing ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                                    </Button>
                                  }
                                />
                                <TooltipContent>Enhance Prompt</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-2 border-t border-white/5 gap-3">
                          <div className="flex gap-2">
                            <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                              <SelectTrigger className="flex-1 sm:w-[140px] h-9 bg-white/5 border-white/10">
                                <SelectValue placeholder="Style" />
                              </SelectTrigger>
                              <SelectContent className="glass-dark border-white/10">
                                {PRESETS.map(preset => (
                                  <SelectItem key={preset.name} value={preset.name}>{preset.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <Button 
                            onClick={generateImage}
                            disabled={isGenerating || !prompt}
                            className="h-10 px-8 mesh-gradient text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="mr-2 animate-spin" size={18} />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-2" size={18} />
                                Generate
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Result Display */}
                    <div className="flex-1 min-h-[300px] md:min-h-[500px] flex items-center justify-center">
                      <AnimatePresence mode="wait">
                        {isGenerating ? (
                          <motion.div 
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full aspect-square max-w-[512px] rounded-2xl glass flex flex-col items-center justify-center gap-4 md:gap-6 relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 animate-pulse" />
                            <div className="relative">
                              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary w-6 h-6 md:w-8 md:h-8" />
                            </div>
                            <div className="text-center z-10 px-4">
                              <p className="text-lg md:text-xl font-heading font-medium text-white">Crafting your vision</p>
                              <p className="text-xs md:text-sm text-muted-foreground mt-2">Our AI is painting your masterpiece...</p>
                            </div>
                          </motion.div>
                        ) : currentImage ? (
                          <motion.div 
                            key="result"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="group relative w-full max-w-[512px] aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10"
                          >
                            <img 
                              src={currentImage.url} 
                              alt="Generated" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            
                            {/* Overlay Actions */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4 md:p-6">
                              <div className="flex justify-end gap-2">
                                <Button size="icon" variant="secondary" className="glass h-9 w-9 md:h-10 md:w-10 rounded-xl" onClick={() => downloadImage(currentImage)}>
                                  <Download size={18} md:size={20} />
                                </Button>
                                <Button size="icon" variant="secondary" className="glass h-9 w-9 md:h-10 md:w-10 rounded-xl">
                                  <Maximize2 size={18} md:size={20} />
                                </Button>
                              </div>
                              
                              <div className="glass p-3 md:p-4 rounded-xl">
                                <p className="text-[10px] md:text-xs text-white/70 line-clamp-2 font-medium leading-relaxed">
                                  {currentImage.prompt}
                                </p>
                              </div>
                            </div>
                            
                            {/* Mobile Actions (Visible on touch) */}
                            <div className="md:hidden absolute bottom-2 right-2 flex gap-2">
                               <Button size="icon" variant="secondary" className="glass h-8 w-8 rounded-lg" onClick={() => downloadImage(currentImage)}>
                                  <Download size={16} />
                                </Button>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div 
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center max-w-md px-4"
                          >
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                              <ImageIcon className="text-muted-foreground w-8 h-8 md:w-10 md:h-10" />
                            </div>
                            <h2 className="text-xl md:text-2xl font-heading font-bold mb-2">Ready to Create?</h2>
                            <p className="text-sm md:text-base text-muted-foreground">
                              Enter a prompt above to start generating unique AI artwork. 
                              Try using the enhance tool for better results.
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Recent Generations Bar */}
                    {history.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-auto pt-6 md:pt-8 border-t border-white/5"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-[10px] md:text-sm font-bold uppercase tracking-wider text-white/50">Recent Generations</h3>
                          <Button variant="link" size="sm" onClick={() => setView('gallery')} className="text-primary h-auto p-0 text-xs">
                            View All <ChevronRight size={12} className="ml-1" />
                          </Button>
                        </div>
                        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 custom-scrollbar">
                          {history.slice(0, 10).map((img) => (
                            <button 
                              key={img.id}
                              onClick={() => setCurrentImage(img)}
                              className={cn(
                                "flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border-2 transition-all",
                                currentImage?.id === img.id ? "border-primary scale-105" : "border-transparent hover:border-white/20"
                              )}
                            >
                              <img src={img.url} alt="Recent" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ) : view === 'gallery' ? (
                  <motion.div 
                    key="gallery"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                      <div>
                        <h2 className="text-2xl md:text-3xl font-heading font-bold">Your Gallery</h2>
                        <p className="text-sm text-muted-foreground">A collection of your recent masterpieces</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setHistory([])} className="border-white/10 hover:bg-destructive/10 hover:text-destructive w-full sm:w-auto">
                        <Trash2 size={16} className="mr-2" />
                        Clear All
                      </Button>
                    </div>

                    {history.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {history.map((img) => (
                          <motion.div 
                            key={img.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="group relative aspect-square rounded-xl overflow-hidden border border-white/5 bg-white/5"
                          >
                            <img 
                              src={img.url} 
                              alt="History" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 md:p-4">
                              <p className="text-[8px] md:text-[10px] text-white/60 mb-1 md:mb-2">{new Date(img.timestamp).toLocaleDateString()}</p>
                              <p className="text-[10px] md:text-xs text-white line-clamp-2 mb-2 md:mb-4">{img.prompt}</p>
                              <div className="flex gap-2">
                                <Button size="sm" variant="secondary" className="flex-1 h-7 md:h-8 text-[8px] md:text-[10px]" onClick={() => downloadImage(img)}>
                                  <Download size={12} md:size={14} className="mr-1" />
                                  Save
                                </Button>
                                <Button size="sm" variant="secondary" className="h-7 w-7 md:h-8 md:w-8 p-0" onClick={() => {setCurrentImage(img); setView('home');}}>
                                  <Maximize2 size={12} md:size={14} />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-[50vh] flex flex-col items-center justify-center text-center">
                        <History size={40} className="text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground">No generations yet. Start creating!</p>
                      </div>
                    )}
                  </motion.div>
                ) : view === 'api' ? (
                  <motion.div 
                    key="api"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="max-w-4xl mx-auto w-full"
                  >
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Terminal className="text-primary" size={24} />
                      </div>
                      <div>
                        <h2 className="text-2xl md:text-3xl font-heading font-bold">API Documentation</h2>
                        <p className="text-sm text-muted-foreground">Integrate Lumina's generation engine into your own apps</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <section className="glass p-6 rounded-2xl border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium">Quick Start</h3>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => copyToClipboard(apiDocumentation)}
                            className="text-muted-foreground hover:text-white"
                          >
                            {copied ? <Check size={16} className="text-green-500 mr-2" /> : <Copy size={16} className="mr-2" />}
                            {copied ? 'Copied' : 'Copy Code'}
                          </Button>
                        </div>
                        <div className="bg-black/40 rounded-xl p-4 overflow-x-auto custom-scrollbar">
                          <pre className="text-xs md:text-sm font-mono text-primary/80 leading-relaxed">
                            {apiDocumentation}
                          </pre>
                        </div>
                      </section>

                      <section className="grid md:grid-cols-2 gap-6">
                        <div className="glass p-6 rounded-2xl border-white/10">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-white/70 mb-4">Parameters</h4>
                          <ul className="space-y-4">
                            <li className="flex flex-col gap-1">
                              <span className="text-xs font-mono text-primary">prompt <span className="text-white/30">(required)</span></span>
                              <span className="text-xs text-muted-foreground">The text description of the image you want to generate.</span>
                            </li>
                            <li className="flex flex-col gap-1">
                              <span className="text-xs font-mono text-primary">model <span className="text-white/30">(optional)</span></span>
                              <span className="text-xs text-muted-foreground">The AI model to use. Defaults to Flux.1 Schnell.</span>
                            </li>
                            <li className="flex flex-col gap-1">
                              <span className="text-xs font-mono text-primary">guidance <span className="text-white/30">(optional)</span></span>
                              <span className="text-xs text-muted-foreground">Strictness of prompt following (1.0 - 20.0).</span>
                            </li>
                          </ul>
                        </div>
                        <div className="glass p-6 rounded-2xl border-white/10">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-white/70 mb-4">Response</h4>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs">Format</span>
                              <span className="text-xs font-mono text-primary">image/png</span>
                            </div>
                            <Separator className="bg-white/5" />
                            <div className="flex items-center justify-between">
                              <span className="text-xs">Status</span>
                              <span className="text-xs font-mono text-primary">200 OK</span>
                            </div>
                            <Separator className="bg-white/5" />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              The API returns a direct binary stream of the generated image. No complex JSON parsing required.
                            </p>
                          </div>
                        </div>
                      </section>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="settings"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="max-w-2xl mx-auto w-full"
                  >
                    <h2 className="text-2xl md:text-3xl font-heading font-bold mb-8">Settings</h2>
                    <div className="space-y-6 md:space-y-8">
                      <section className="glass p-5 md:p-6 rounded-2xl border-white/10">
                        <h3 className="text-base md:text-lg font-medium mb-4 flex items-center gap-2">
                          <Sparkles size={18} className="text-primary" />
                          API Configuration
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground mb-6">
                          Lumina uses high-performance Cloudflare Workers to interface with state-of-the-art models.
                        </p>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs md:text-sm">Default Model</span>
                            <span className="text-[10px] md:text-xs font-mono text-primary">Flux.1 Schnell</span>
                          </div>
                          <Separator className="bg-white/5" />
                          <div className="flex items-center justify-between">
                            <span className="text-xs md:text-sm">Enhancement Engine</span>
                            <span className="text-[10px] md:text-xs font-mono text-primary">Gemini 3 Flash</span>
                          </div>
                        </div>
                      </section>

                      <section className="glass p-5 md:p-6 rounded-2xl border-white/10">
                        <h3 className="text-base md:text-lg font-medium mb-4 flex items-center gap-2">
                          <Share2 size={18} className="text-primary" />
                          Storage & Privacy
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground mb-6">
                          Images are stored as local blobs and will be cleared when you close the session. 
                          Download your favorites to keep them permanently.
                        </p>
                        <Button variant="outline" className="w-full border-white/10 text-xs">
                          Export Session Data
                        </Button>
                      </section>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop Right Sidebar: Studio Controls */}
            <aside className="hidden lg:block w-80 border-l border-white/5 glass-dark p-6 overflow-y-auto custom-scrollbar">
              <StudioControls />
            </aside>
          </div>

          {/* Mobile Bottom Navigation */}
          <nav className="md:hidden h-16 glass-dark border-t border-white/5 flex items-center justify-around px-4 shrink-0 z-50">
            <button 
              onClick={() => setView('home')} 
              className={cn("flex flex-col items-center gap-1 transition-colors", view === 'home' ? "text-primary" : "text-muted-foreground")}
            >
              <Home size={20} />
              <span className="text-[10px] font-medium">Studio</span>
            </button>
            <button 
              onClick={() => setView('gallery')} 
              className={cn("flex flex-col items-center gap-1 transition-colors", view === 'gallery' ? "text-primary" : "text-muted-foreground")}
            >
              <History size={20} />
              <span className="text-[10px] font-medium">Gallery</span>
            </button>
            <button 
              onClick={() => setView('api')} 
              className={cn("flex flex-col items-center gap-1 transition-colors", view === 'api' ? "text-primary" : "text-muted-foreground")}
            >
              <Code size={20} />
              <span className="text-[10px] font-medium">API</span>
            </button>
            <button 
              onClick={() => setView('settings')} 
              className={cn("flex flex-col items-center gap-1 transition-colors", view === 'settings' ? "text-primary" : "text-muted-foreground")}
            >
              <Settings size={20} />
              <span className="text-[10px] font-medium">Settings</span>
            </button>
          </nav>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </TooltipProvider>
  );
}

function NavIcon({ icon, active, onClick, label }: { icon: React.ReactNode, active: boolean, onClick: () => void, label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        onClick={onClick}
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 relative group",
          active 
            ? "bg-primary text-white shadow-lg shadow-primary/40" 
            : "text-muted-foreground hover:text-white hover:bg-white/5"
        )}
      >
        {icon}
        {active && (
          <motion.div 
            layoutId="nav-active"
            className="absolute -left-3 w-1 h-6 bg-primary rounded-r-full"
          />
        )}
      </TooltipTrigger>
      <TooltipContent side="right" className="glass-dark border-white/10">
        <p className="text-xs font-medium">{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}
