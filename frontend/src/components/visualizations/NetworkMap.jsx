import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Handle,
    Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { MdDomain, MdDns, MdLan, MdBugReport, MdRouter, MdClose } from 'react-icons/md';
import { transformDataToGraph } from '../../utils/graphParser';

// --- CUSTOM NODES ---

const TargetNode = ({ data }) => (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-black/80 border-2 border-primary shadow-[0_0_15px_rgba(6,249,67,0.3)] min-w-[180px]">
        <Handle type="target" position={Position.Top} className="!bg-primary" />
        <div className="p-2 rounded bg-primary/20 text-primary">
            <MdDomain className="text-xl" />
        </div>
        <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">TARGET</div>
            <div className="text-sm font-bold text-white font-mono truncate max-w-[140px]" title={data.label}>{data.label}</div>
        </div>
        <Handle type="source" position={Position.Bottom} className="!bg-primary" />
    </div>
);

const SubdomainNode = ({ data }) => (
    <div className="flex items-center gap-2 px-3 py-2 rounded bg-slate-900/90 border border-blue-500/30 hover:border-blue-500 transition-colors min-w-[150px]">
        <Handle type="target" position={Position.Top} className="!bg-blue-500" />
        <MdDns className="text-blue-400 flex-shrink-0" />
        <span className="text-xs text-slate-200 font-mono truncate" title={data.full}>{data.label}</span>
        <Handle type="source" position={Position.Bottom} className="!bg-blue-500" />
    </div>
);

const PortNode = ({ data }) => (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-900/90 border border-emerald-500/30 min-w-[100px]">
        <Handle type="target" position={Position.Top} className="!bg-emerald-500" />
        <MdLan className="text-emerald-400 text-xs flex-shrink-0" />
        <span className="text-xs text-emerald-300 font-mono font-bold">{data.label}</span>
    </div>
);

const VulnNode = ({ data }) => (
    <div className={`flex items-center gap-2 px-3 py-2 rounded bg-red-950/80 border ${data.severity === 'critical' ? 'border-red-500 animate-pulse' : 'border-red-500/50'} min-w-[160px]`}>
        <Handle type="target" position={Position.Top} className="!bg-red-500" />
        <MdBugReport className="text-red-500 flex-shrink-0" />
        <div className="flex flex-col overflow-hidden">
            <span className="text-[10px] font-bold text-red-500 uppercase">{data.severity}</span>
            <span className="text-xs text-red-200 truncate" title={data.label}>{data.label}</span>
        </div>
    </div>
);

const nodeTypes = {
    targetNode: TargetNode,
    subdomainNode: SubdomainNode,
    portNode: PortNode,
    vulnNode: VulnNode
};

const NetworkMap = ({ data }) => {
    // Generate graph data once
    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => transformDataToGraph(data), [data]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const [selectedNode, setSelectedNode] = React.useState(null);

    const onNodeClick = useCallback((event, node) => {
        setSelectedNode(node);
    }, []);

    const closeDetails = () => setSelectedNode(null);

    // Close on escape
    React.useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') closeDetails(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    return (
        <div className="h-[400px] md:h-[600px] lg:h-[700px] w-full bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative group">
            {/* Grid overlay for 'blueprint' look */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onPaneClick={closeDetails}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-right"
                className="bg-transparent"
                minZoom={0.5}
                maxZoom={2}
            >
                <Background color="#1e293b" gap={20} size={1} />
                <Controls className="!bg-black/50 !border-slate-700 !fill-slate-400" />
            </ReactFlow>

            {/* HEADER LABELS */}
            <div className="absolute top-4 right-4 bg-black/80 backdrop-blur px-3 py-1.5 rounded border border-slate-700 text-xs font-mono text-slate-400 flex items-center gap-2 pointer-events-none">
                <MdRouter className="text-primary" />
                NEURAL MAP V1.0
            </div>

            {/* LEGEND overlay */}
            <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur p-3 rounded-lg border border-slate-700 text-[10px] font-mono text-slate-400 flex flex-col gap-2 pointer-events-none lg:pointer-events-auto">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_5px_theme(colors.green.500)]"></span> TARGET SYSTEM</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_5px_theme(colors.blue.500)]"></span> SUBDOMAIN ASSSET</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_theme(colors.emerald.500)]"></span> OPEN PORT</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_theme(colors.red.500)] animate-pulse"></span> VULNERABILITY</div>
            </div>

            {/* SLIDE-OVER DETAILS PANEL */}
            {selectedNode && (
                <div className="absolute inset-y-0 right-0 w-full md:w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 shadow-2xl transform transition-transform duration-300 ease-out z-50 flex flex-col animate-in slide-in-from-right-full">
                    <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-black/20">
                        <div className="flex items-center gap-2">
                            {selectedNode.type === 'targetNode' && <MdDomain className="text-primary" />}
                            {selectedNode.type === 'subdomainNode' && <MdDns className="text-blue-400" />}
                            {selectedNode.type === 'portNode' && <MdLan className="text-emerald-400" />}
                            {selectedNode.type === 'vulnNode' && <MdBugReport className="text-red-500" />}
                            <span className="font-bold text-slate-100 font-mono text-sm uppercase">Node Intelligence</span>
                        </div>
                        <button onClick={closeDetails} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors">
                            <MdClose className="text-lg" />
                        </button>
                    </div>

                    <div className="p-5 flex-1 overflow-y-auto scrollbar-custom">
                        <div className="mb-6">
                            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 block">Designation</label>
                            <div className="text-lg font-mono text-white break-words border-l-2 border-slate-700 pl-3">
                                {selectedNode.data.label}
                            </div>
                        </div>

                        {/* TYPE SPECIFIC DATA */}
                        {selectedNode.type === 'subdomainNode' && selectedNode.data.full && (
                            <div className="mb-4">
                                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 block">Full Hostname</label>
                                <div className="text-xs font-mono text-blue-300 bg-blue-950/30 p-2 rounded border border-blue-500/20 break-all">
                                    {selectedNode.data.full}
                                </div>
                            </div>
                        )}

                        {selectedNode.type === 'portNode' && (
                            <div className="mb-4">
                                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 block">Service Status</label>
                                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/30 p-2 rounded border border-emerald-500/20">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                    OPEN / LISTENING
                                </div>
                            </div>
                        )}

                        {selectedNode.type === 'vulnNode' && (
                            <div className="mb-4 space-y-4">
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 block">Severity Level</label>
                                    <div className={`text-xs font-bold uppercase inline-block px-2 py-1 rounded border ${selectedNode.data.severity === 'critical' ? 'bg-red-950 text-red-500 border-red-500' :
                                        selectedNode.data.severity === 'high' ? 'bg-orange-950 text-orange-500 border-orange-500' : 'bg-slate-800 text-slate-400 border-slate-600'
                                        }`}>
                                        {selectedNode.data.severity}
                                    </div>
                                </div>
                                <div className="p-3 bg-red-950/10 border border-red-500/20 rounded">
                                    <div className="flex items-start gap-2 text-red-400 text-xs">
                                        <MdBugReport className="text-lg flex-shrink-0" />
                                        <span>Potential security breach vector detected. Immediate manual verification recommended.</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 pt-4 border-t border-slate-800">
                            <div className="text-[10px] text-slate-600 font-mono">
                                NODE_ID: {selectedNode.id}<br />
                                COORDS: [{Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)}]
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NetworkMap;
