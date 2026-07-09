import React, { useState, useEffect } from "react";
import { 
  Type, Layout, Maximize2, Smartphone, Monitor, Play, 
  Trash2, Copy, Plus, Settings, Sparkles, Folder, CheckCircle, RefreshCw 
} from "lucide-react";

interface UIElement {
  id: string;
  type: "container" | "card" | "button" | "input" | "text" | "heading" | "image" | "badge" | "grid";
  props: {
    text?: string;
    placeholder?: string;
    bgColor?: string;
    textColor?: string;
    borderColor?: string;
    padding?: string;
    margin?: string;
    rounded?: string;
    fontSize?: string;
    fontWeight?: string;
    src?: string;
    gridCols?: string;
    width?: string;
    height?: string;
    shadow?: string;
    alignment?: string;
  };
  children?: UIElement[];
}

interface VisualBuilderProps {
  projectId: string | null;
  apiFetch: <T = any>(url: string, options?: RequestInit) => Promise<T>;
  showToast: (msg: string, type?: "success" | "info" | "warn" | "error") => void;
  onRefreshFiles: () => void;
}

export const VisualBuilder: React.FC<VisualBuilderProps> = ({
  projectId,
  apiFetch,
  showToast,
  onRefreshFiles
}) => {
  const [elements, setElements] = useState<UIElement[]>([
    {
      id: "el-h-1",
      type: "heading",
      props: { text: "SHAF Nexus Visually Engineered Hero Card", fontSize: "text-2xl", fontWeight: "font-bold", textColor: "text-white", margin: "mb-2" }
    },
    {
      id: "el-t-1",
      type: "text",
      props: { text: "This layout card was drafted visually using the Canvas Drag-and-Drop system. Modify text headers, padding weights, and alignment properties in the sidebar panel to see real-time updates.", textColor: "text-slate-400", fontSize: "text-xs", margin: "mb-6" }
    },
    {
      id: "el-g-1",
      type: "grid",
      props: { gridCols: "grid-cols-2", margin: "mb-4" },
      children: [
        {
          id: "el-b-1",
          type: "button",
          props: { text: "Engineering Handshake", bgColor: "bg-teal-500", textColor: "text-white", rounded: "rounded-lg" }
        },
        {
          id: "el-i-1",
          type: "input",
          props: { placeholder: "Secure deployment credential...", margin: "" }
        }
      ]
    }
  ]);

  const [selectedId, setSelectedId] = useState<string | null>("el-h-1");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [filePath, setFilePath] = useState<string>("src/components/VisualPage.tsx");
  const [isCompiling, setIsCompiling] = useState<boolean>(false);

  const getSelectedElement = (nodes: UIElement[]): UIElement | null => {
    for (const node of nodes) {
      if (node.id === selectedId) return node;
      if (node.children) {
        const found = getSelectedElement(node.children);
        if (found) return found;
      }
    }
    return null;
  };

  const updateSelectedProps = (newProps: Partial<UIElement["props"]>) => {
    if (!selectedId) return;
    const updateNode = (nodes: UIElement[]): UIElement[] => {
      return nodes.map(node => {
        if (node.id === selectedId) {
          return { ...node, props: { ...node.props, ...newProps } };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };
    setElements(prev => updateNode(prev));
  };

  const selectedElement = getSelectedElement(elements);

  const handleDuplicate = (id: string) => {
    const duplicateNode = (nodes: UIElement[]): UIElement[] => {
      const results: UIElement[] = [];
      nodes.forEach(node => {
        results.push(node);
        if (node.id === id) {
          results.push({
            ...node,
            id: `el-dup-${Math.floor(Math.random() * 10000)}`,
            props: { ...node.props },
            children: node.children ? JSON.parse(JSON.stringify(node.children)) : undefined
          });
        } else if (node.children) {
          node.children = duplicateNode(node.children);
        }
      });
      return results;
    };
    setElements(prev => duplicateNode(prev));
    showToast("Component duplicated", "info");
  };

  const handleDelete = (id: string) => {
    const deleteNode = (nodes: UIElement[]): UIElement[] => {
      return nodes.filter(node => {
        if (node.id === id) return false;
        if (node.children) {
          node.children = deleteNode(node.children);
        }
        return true;
      });
    };
    setElements(prev => deleteNode(prev));
    if (selectedId === id) setSelectedId(null);
    showToast("Component removed from canvas", "warn");
  };

  const handleAddComponent = (type: UIElement["type"]) => {
    const newEl: UIElement = {
      id: `el-new-${Math.floor(Math.random() * 10000)}`,
      type,
      props: {
        text: type === "button" ? "Action Button" : type === "heading" ? "New Section Title" : type === "badge" ? "Live Module" : undefined,
        placeholder: type === "input" ? "Enter details..." : undefined,
        margin: "mb-3",
        bgColor: type === "button" ? "bg-indigo-600" : undefined,
        textColor: "text-slate-200"
      }
    };
    setElements(prev => [...prev, newEl]);
    setSelectedId(newEl.id);
    showToast(`Added visual ${type} block`, "success");
  };

  const handleReplicateToProject = async () => {
    if (!projectId) {
      showToast("Create or select an active project first.", "warn");
      return;
    }
    setIsCompiling(true);
    try {
      const res = await apiFetch("/api/toolkit/visual-builder/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          filePath,
          elements
        })
      });

      if (res.success) {
        showToast("Hot-reload complete. VisualPage.tsx successfully compiled!", "success");
        onRefreshFiles();
      } else {
        showToast(res.error || "Compiler failed", "error");
      }
    } catch (err: any) {
      showToast("Visual generation error", "error");
    } finally {
      setIsCompiling(false);
    }
  };

  const renderVisualElement = (el: UIElement) => {
    const classes = `relative group cursor-pointer border p-2 rounded-lg transition-all ${
      selectedId === el.id 
      ? "border-teal-500 bg-teal-500/5 ring-1 ring-teal-500/20" 
      : "border-dashed border-slate-800 hover:border-slate-700 hover:bg-slate-900/10"
    } ${el.props.margin || ""}`;

    const labelStyle = "absolute -top-2.5 left-2 bg-slate-950 px-1.5 py-0.2 text-[8px] font-mono tracking-wider text-slate-500 border border-slate-900 rounded group-hover:text-teal-400 font-bold uppercase";

    const controlToolbar = (
      <div className="absolute top-1 right-1 hidden group-hover:flex items-center gap-1 z-20 bg-slate-950/90 p-0.5 rounded border border-slate-800 shadow">
        <button 
          onClick={(e) => { e.stopPropagation(); handleDuplicate(el.id); }}
          className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-white"
          title="Duplicate Component"
        >
          <Copy size={10} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleDelete(el.id); }}
          className="p-1 hover:bg-slate-900 rounded text-red-400 hover:text-red-300"
          title="Delete Component"
        >
          <Trash2 size={10} />
        </button>
      </div>
    );

    const selectThis = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedId(el.id);
    };

    switch (el.type) {
      case "grid":
        return (
          <div key={el.id} onClick={selectThis} className={classes}>
            <span className={labelStyle}>Grid Wrapper</span>
            {controlToolbar}
            <div className={`grid ${el.props.gridCols || "grid-cols-2"} gap-3 mt-2`}>
              {(el.children || []).map(renderVisualElement)}
            </div>
          </div>
        );
      case "heading":
        return (
          <div key={el.id} onClick={selectThis} className={classes}>
            <span className={labelStyle}>Heading</span>
            {controlToolbar}
            <h3 className={`${el.props.fontSize || "text-lg"} ${el.props.fontWeight || "font-bold"} ${el.props.textColor || "text-white"} mt-1.5`}>
              {el.props.text}
            </h3>
          </div>
        );
      case "text":
        return (
          <div key={el.id} onClick={selectThis} className={classes}>
            <span className={labelStyle}>Paragraph</span>
            {controlToolbar}
            <p className={`text-xs mt-1.5 leading-normal ${el.props.textColor || "text-slate-400"}`}>
              {el.props.text}
            </p>
          </div>
        );
      case "button":
        return (
          <div key={el.id} onClick={selectThis} className={classes}>
            <span className={labelStyle}>Button Component</span>
            {controlToolbar}
            <button className={`w-full py-1.5 text-xs text-center font-medium transition-all ${el.props.bgColor || "bg-indigo-600"} ${el.props.textColor || "text-white"} ${el.props.rounded || "rounded-lg"} mt-1.5`}>
              {el.props.text}
            </button>
          </div>
        );
      case "input":
        return (
          <div key={el.id} onClick={selectThis} className={classes}>
            <span className={labelStyle}>Text Field</span>
            {controlToolbar}
            <input 
              disabled
              type="text" 
              placeholder={el.props.placeholder} 
              className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs mt-1.5 focus:outline-none text-slate-300"
            />
          </div>
        );
      case "badge":
        return (
          <div key={el.id} onClick={selectThis} className={classes}>
            <span className={labelStyle}>Status Badge</span>
            {controlToolbar}
            <div className="mt-1.5">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                {el.props.text}
              </span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden bg-[#0A0B10]">
      {/* Visual Workspace Stage Area */}
      <div className="flex-1 flex flex-col min-h-0 border-r border-[#2D3039]">
        {/* Visual Header bar controls */}
        <div className="h-12 border-b border-[#2D3039] bg-[#0E1015] px-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Layout size={14} className="text-teal-400" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Visual Workspace Canvas</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-[#16181D] p-1.5 rounded-lg border border-[#2D3039] flex items-center gap-1">
              <button 
                onClick={() => setPreviewMode("desktop")}
                className={`p-1 rounded text-xs transition-colors cursor-pointer ${previewMode === "desktop" ? "bg-teal-500/10 text-teal-400" : "text-slate-400 hover:text-white"}`}
                title="Desktop View Mode"
              >
                <Monitor size={12} />
              </button>
              <button 
                onClick={() => setPreviewMode("mobile")}
                className={`p-1 rounded text-xs transition-colors cursor-pointer ${previewMode === "mobile" ? "bg-teal-500/10 text-teal-400" : "text-slate-400 hover:text-white"}`}
                title="Mobile View Mode"
              >
                <Smartphone size={12} />
              </button>
            </div>

            <button
              onClick={handleReplicateToProject}
              disabled={isCompiling}
              className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-black text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow active:scale-95 transition-all"
            >
              {isCompiling ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
              <span>Sync Workspace File</span>
            </button>
          </div>
        </div>

        {/* Canvas Render Panel Container */}
        <div className="flex-1 overflow-auto bg-[#14151B] p-6 flex justify-center items-start">
          <div 
            style={{
              width: previewMode === "desktop" ? "100%" : "350px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
            className="bg-slate-950 border border-[#2D3039] p-6 rounded-xl shadow-2xl space-y-4 min-h-[480px]"
          >
            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <span className="text-[10px] font-mono text-slate-500">CANVAS STAGING STAGE</span>
              <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
            </div>

            {elements.length === 0 ? (
              <div className="h-60 flex flex-col items-center justify-center p-8 text-center text-slate-600 border-2 border-dashed border-slate-900 rounded-lg">
                <Plus size={32} className="mb-2" />
                <p className="text-xs font-semibold">Staging canvas is empty</p>
                <p className="text-[10px] mt-1 max-w-xs">Use the sidebar components panel to insert grid structures, paragraph headings, status indicators, and buttons.</p>
              </div>
            ) : (
              elements.map(renderVisualElement)
            )}
          </div>
        </div>
      </div>

      {/* Visual properties toolbox right panel */}
      <div className="w-full md:w-80 flex flex-col shrink-0 bg-[#0E1015] overflow-y-auto">
        <div className="p-4 border-b border-[#2D3039] space-y-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider">Canvas Toolbox</span>
          <h4 className="text-xs font-sans text-slate-200 font-bold">Element Library & Parameters</h4>
        </div>

        {/* Quick Component Insertion Palette */}
        <div className="p-4 border-b border-[#2D3039] space-y-2.5">
          <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider block">1. Insert New Element</span>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { type: "heading", label: "Heading", icon: <Type size={11} /> },
              { type: "text", label: "Text", icon: <Type size={11} /> },
              { type: "button", label: "Button", icon: <Plus size={11} /> },
              { type: "input", label: "Input", icon: <Plus size={11} /> },
              { type: "grid", label: "Grid Block", icon: <Layout size={11} /> },
              { type: "badge", label: "Status Badge", icon: <Sparkles size={11} /> }
            ].map((nodeDef, idx) => (
              <button
                key={idx}
                onClick={() => handleAddComponent(nodeDef.type as any)}
                className="px-2.5 py-1.5 bg-slate-900 border border-[#2D3039] hover:border-teal-500 text-slate-300 hover:text-teal-400 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                {nodeDef.icon}
                <span>{nodeDef.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Component Properties Editor */}
        <div className="p-4 flex-1 space-y-4">
          <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider block">2. Property Configurations</span>

          {selectedElement ? (
            <div className="space-y-4.5 bg-slate-950/40 border border-slate-900 p-3 rounded-xl font-mono text-[11px]">
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <span className="text-teal-400 font-bold uppercase text-[9px]">{selectedElement.type} Settings</span>
                <span className="text-[9px] text-slate-500">{selectedElement.id}</span>
              </div>

              {/* Text Prop Editor */}
              {(selectedElement.type === "heading" || selectedElement.type === "text" || selectedElement.type === "button" || selectedElement.type === "badge") && (
                <div className="space-y-1">
                  <label className="text-slate-500 text-[8px] uppercase font-bold tracking-wider">Display text content</label>
                  <input 
                    type="text" 
                    value={selectedElement.props.text || ""} 
                    onChange={(e) => updateSelectedProps({ text: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              )}

              {/* Placeholder Prop Editor */}
              {selectedElement.type === "input" && (
                <div className="space-y-1">
                  <label className="text-slate-500 text-[8px] uppercase font-bold tracking-wider">Placeholder label</label>
                  <input 
                    type="text" 
                    value={selectedElement.props.placeholder || ""} 
                    onChange={(e) => updateSelectedProps({ placeholder: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              )}

              {/* Color Classes Property Editor */}
              {selectedElement.type === "button" && (
                <div className="space-y-1">
                  <label className="text-slate-500 text-[8px] uppercase font-bold tracking-wider">Button Background Class</label>
                  <select
                    value={selectedElement.props.bgColor || "bg-indigo-600"}
                    onChange={(e) => updateSelectedProps({ bgColor: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="bg-indigo-600">bg-indigo-600 (Indigo)</option>
                    <option value="bg-teal-500">bg-teal-500 (Teal)</option>
                    <option value="bg-emerald-500">bg-emerald-500 (Emerald)</option>
                    <option value="bg-rose-600">bg-rose-600 (Rose)</option>
                    <option value="bg-slate-800">bg-slate-800 (Slate)</option>
                  </select>
                </div>
              )}

              {/* Size property classes */}
              {selectedElement.type === "heading" && (
                <div className="space-y-1">
                  <label className="text-slate-500 text-[8px] uppercase font-bold tracking-wider">Heading size mapping</label>
                  <select
                    value={selectedElement.props.fontSize || "text-lg"}
                    onChange={(e) => updateSelectedProps({ fontSize: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="text-sm">text-sm (Sub-header)</option>
                    <option value="text-lg">text-lg (Section title)</option>
                    <option value="text-2xl">text-2xl (Hero Heading)</option>
                    <option value="text-4xl">text-4xl (Splash Title)</option>
                  </select>
                </div>
              )}

              {/* Margin control */}
              <div className="space-y-1">
                <label className="text-slate-500 text-[8px] uppercase font-bold tracking-wider">Bottom Spacing Weight</label>
                <select
                  value={selectedElement.props.margin || "mb-3"}
                  onChange={(e) => updateSelectedProps({ margin: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="">No Margins</option>
                  <option value="mb-2">mb-2 (Thin)</option>
                  <option value="mb-4">mb-4 (Balanced)</option>
                  <option value="mb-6">mb-6 (Wide)</option>
                </select>
              </div>

              {/* Replica Path target */}
              <div className="pt-2 border-t border-slate-900 space-y-1">
                <label className="text-slate-500 text-[8px] uppercase font-bold tracking-wider">Target React File Path</label>
                <div className="flex gap-1.5 items-center">
                  <Folder size={11} className="text-teal-400" />
                  <input 
                    type="text" 
                    value={filePath} 
                    onChange={(e) => setFilePath(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[10px] text-slate-300 focus:outline-none"
                  />
                </div>
              </div>

            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 border border-slate-900 rounded-lg text-xs">
              Click any element on the stage to modify its layout typography, spacing boundaries, and properties.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
