import { useCallback, useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import ReactFlow, {
    useEdgesState,
    addEdge,
    Controls,
    Background,
    BackgroundVariant,
    MiniMap,
    MarkerType,
    type Connection,
    type Edge,
    type Node,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import { CORRELATIVES_NODES, CORRELATIVES_EDGES, type NodeDefinition } from '../../data/correlativas';
import { useAuth } from '../../context/AuthContext';
import { Info, CheckCircle2, List, LayoutGrid, BookOpen } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { ScrollArea } from '../../components/ui/scroll-area';
import { cn } from '../../lib/utils';
import { SubjectResourcesModal } from '../../components/subjects/SubjectResourcesModal';
import { correlativesGetMap } from '../../convex/functions';

// Layout Configuration
const nodeWidth = 200;
const nodeHeight = 80;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'LR' }); // Left to Right layout

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);

        // We are shifting the dagre node position (anchor=center center) to the top left
        // so it matches the React Flow node anchor point (top left).
        return {
            ...node,
            targetPosition: 'left' as any,
            sourcePosition: 'right' as any,
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

const mapEdges = (edgeDefs: any[]) => {
    return edgeDefs.map((e, idx) => ({
        id: `e${idx}`,
        source: e.source,
        target: e.target,
        type: 'smoothstep',
        animated: false,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
        style: { stroke: '#94a3b8', strokeWidth: 1.5 },
    }));
};

// Pure function to generate node style/data details based on user state
const getNodeDetails = (n: NodeDefinition, userEnrollments: any[], approvedSubjects: string[]) => {
    const isEnrolled = userEnrollments?.some(e => e.materiaId === n.materiaId);
    const isApproved = approvedSubjects?.includes(n.materiaId || '');

    let bg = '#fff';
    let color = '#333';
    let borderColor = '#94a3b8';
    let boxShadow = '0 2px 4px -2px rgb(0 0 0 / 0.1)';

    if (n.duration === 'Root') {
        bg = '#e2e8f0'; // slate-200
        borderColor = '#cbd5e1';
        color = '#64748b';
    } else if (isApproved) {
        bg = '#22c55e'; // green-500
        borderColor = '#166534'; // green-800
        color = '#fff';
        boxShadow = '0 4px 6px -1px rgba(34, 197, 94, 0.4)';
    } else if (isEnrolled) {
        bg = '#dcfce7'; // green-100
        borderColor = '#16a34a'; // green-600
        color = '#166534'; // green-800
    } else {
        // Duration Gradient (Black -> White)
        switch (n.duration) {
            case 'Semestral':
                bg = '#334155'; // slate-700
                color = '#fff';
                borderColor = '#334155';
                break;
            case 'Cuatrimestral':
                bg = '#64748b'; // slate-500
                color = '#fff';
                borderColor = '#64748b';
                break;
            case 'Trimestral':
                bg = '#cbd5e1'; // slate-300
                color = '#334155'; // slate-700
                borderColor = '#94a3b8';
                break;
            case 'Bimestral':
                bg = '#ffffff'; // White
                color = '#334155'; // slate-700
                borderColor = '#94a3b8'; // slate-400
                break;
            default:
                bg = '#f1f5f9';
        }
    }

    return {
        style: {
            width: 180,
            backgroundColor: bg,
            color: color,
            border: `2px solid ${borderColor}`,
            borderRadius: '8px',
            fontSize: '12px',
            boxShadow: boxShadow,
            cursor: 'pointer',
            transition: 'all 0.2s',
        },
        labelContent: (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="font-bold text-xs leading-tight">{n.label}</div>
                {isEnrolled && !isApproved && <div className="text-[10px] text-emerald-700 font-bold mt-1 flex items-center bg-white/60 px-1 rounded backdrop-blur-sm"><CheckCircle2 className="w-3 h-3 mr-1" /> Cursando</div>}
                {isApproved && <div className="text-[10px] text-white font-bold mt-1 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" /> Aprobada</div>}
            </div>
        )
    };
};

export function CorrelativesMapPage() {
    const { user, toggleApproved } = useAuth();
    const correlativesMap = useQuery(correlativesGetMap, {});
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
    const [selectedResourceSubject, setSelectedResourceSubject] = useState<{ id: string; nombre: string } | null>(null);
    const nodeTypes = useMemo(() => ({}), []);
    const edgeTypes = useMemo(() => ({}), []);
    const correlativesNodes = (correlativesMap?.nodes as NodeDefinition[] | undefined) || CORRELATIVES_NODES;
    const correlativesEdges = correlativesMap?.edges || CORRELATIVES_EDGES;

    // 1. Calculate Layout ONE time (memoized structure)
    const { nodes: staticBaseNodes, edges: staticEdges } = useMemo(() => {
        const baseNodes = correlativesNodes.map(n => ({ id: n.id, data: { label: n.label } })); // Minimal node def for layout
        // @ts-ignore
        return getLayoutedElements(baseNodes, mapEdges(correlativesEdges).map(e => ({ ...e, id: e.id }))); // Passed as Edge[]
    }, [correlativesNodes, correlativesEdges]);

    // 2. Merge User State into Nodes (memoized)
    const nodes = useMemo(() => {
        return staticBaseNodes.map((ln) => {
            const def = correlativesNodes.find(n => n.id === ln.id);
            if (!def) return ln;

            const details = getNodeDetails(def, user?.enrollments || [], user?.approvedSubjects || []);

            return {
                ...ln,
                type: 'default', // Explicitly set type to ensure it renders
                data: {
                    label: details.labelContent,
                    materiaId: def.materiaId
                },
                style: details.style,
            };
        });
    }, [staticBaseNodes, user?.enrollments, user?.approvedSubjects]);

    // 3. Edges are static
    const [edges, setEdges, onEdgesChange] = useEdgesState(staticEdges);

    // Sync managed nodes with calculated nodes when they change (e.g. style update)
    // Actually, if we control 'nodes' prop, we don't strictly need useNodesState unless we want drag.
    // But ReactFlow warns if we don't use onNodesChange.
    // Strategy: Pass 'nodes' directly to ReactFlow as a controlled prop.

    // IMPORTANT: If we want dragging to work, we need local state. 
    // If we update styles from user state, we merge with local state positions.
    // Let's rely on 'nodes' from useMemo being passed to value.

    // Better strategy for dragging + External Updates:
    // Use `useEffect` to sync external updates to local state.

    // Actually, simple Controlled flow:
    // <ReactFlow nodes={nodes} ... /> 
    // This disables internal position management unless we handle onNodesChange by updating our 'nodes' source.
    // Since 'nodes' comes from useMemo(user), it overrides position changes on every user change.
    // For this use case (Map), maybe dragging isn't permanent? 
    // Let's stick to simple "Generated Nodes" for now to fix the "Empty Graph" bug.

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const onNodeClick = useCallback(
        (_: any, node: Node) => {
            if (node.data.materiaId) {
                toggleApproved(node.data.materiaId);
            }
        },
        [toggleApproved]
    );

    // List View Logic: Group by Level/Year
    const subjectsByLevel = useMemo(() => {
        const grouped: Record<number, typeof correlativesNodes> = {};
        correlativesNodes.forEach(n => {
            if (!grouped[n.level]) grouped[n.level] = [];
            grouped[n.level].push(n);
        });
        return grouped;
    }, [correlativesNodes]);

    const renderListView = () => (
        <ScrollArea className="h-full w-full bg-slate-50 p-6">
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
                {Object.keys(subjectsByLevel).sort((a, b) => Number(a) - Number(b)).map((levelStr) => {
                    const level = Number(levelStr);
                    const subjects = subjectsByLevel[level];
                    const levelTitle = level === 0 ? "Ciclo Introductorio" : `Año ${level}`;

                    return (
                        <div key={level} className="space-y-4">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center">
                                <span className="bg-slate-200 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
                                    {level === 0 ? '0' : level}
                                </span>
                                {levelTitle}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {subjects.map((n) => {
                                    // Extract styles for plain CSS usage since inline styles from specific node util might be too specific (absolute width etc)
                                    // Let's reuse logic but apply to a Card-like div
                                    const isApproved = user?.approvedSubjects?.includes(n.id) || user?.approvedSubjects?.includes(n.materiaId || '');
                                    const isEnrolled = user?.enrollments?.some(e => e.materiaId === n.materiaId);

                                    return (
                                        <div
                                            key={n.id}
                                            className={cn(
                                                "relative p-4 rounded-xl border-2 transition-all shadow-sm select-none group",
                                                isApproved ? "bg-green-500 border-green-600 text-white shadow-green-500/20" :
                                                    isEnrolled ? "bg-emerald-100 border-emerald-500 text-emerald-900" :
                                                        "bg-white border-slate-200 hover:border-primary-300 text-slate-700"
                                            )}
                                        >
                                            <div
                                                className="cursor-pointer"
                                                onClick={() => n.materiaId && toggleApproved(n.materiaId)}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className="font-bold text-sm leading-snug pr-2">{n.label}</span>
                                                    {isApproved && <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-white" />}
                                                    {isEnrolled && !isApproved && <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1" />}
                                                </div>
                                                <div className={cn(
                                                    "mt-3 text-xs font-medium px-2 py-1 rounded-md w-fit",
                                                    isApproved ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                                                )}>
                                                    {n.duration}
                                                </div>
                                            </div>

                                            {/* Resources Button */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={cn(
                                                    "absolute bottom-2 right-2 h-8 w-8 p-0 rounded-full transition-all opacity-0 group-hover:opacity-100",
                                                    isApproved ? "text-white hover:bg-white/20" : "text-slate-400 hover:text-primary-600 hover:bg-primary-50"
                                                )}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedResourceSubject({ id: n.materiaId || n.id, nombre: n.label });
                                                }}
                                                title="Ver Material de Estudio"
                                            >
                                                <BookOpen className="w-4 h-4" />
                                            </Button>

                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
    );

    return (
        <div className="h-[calc(100vh-4rem)] w-full bg-slate-50 relative animate-in fade-in flex flex-col">
            {/* Control Bar */}
            <div className="absolute top-4 right-4 z-20 flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                <Button
                    variant={viewMode === 'map' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('map')}
                    className="gap-2"
                >
                    <LayoutGrid className="w-4 h-4" /> Mapa
                </Button>
                <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="gap-2"
                >
                    <List className="w-4 h-4" /> Lista
                </Button>
            </div>

            {viewMode === 'list' ? (
                renderListView()
            ) : (
                <>
                    <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg border border-slate-200 w-64 max-h-[calc(100vh-6rem)] overflow-y-auto hidden md:block">
                        <h1 className="text-xl font-bold text-slate-800 flex items-center mb-3">
                            <div className="bg-primary-600 p-1.5 rounded-lg mr-2">
                                <Info className="w-4 h-4 text-white" />
                            </div>
                            Mapa de Correlativas
                        </h1>
                        <p className="text-xs text-slate-500 mb-3">Haz click en una materia para marcarla como aprobada.</p>
                        <div className="mt-3 space-y-2 text-xs">
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-slate-700 border-2 border-slate-700 rounded mr-2 shadow-sm"></div>
                                <span className="text-slate-600">Semestral (Gris Oscuro)</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-slate-500 border-2 border-slate-500 rounded mr-2 shadow-sm"></div>
                                <span className="text-slate-600">Cuatrimestral (Gris Medio)</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-slate-300 border-2 border-slate-400 rounded mr-2 shadow-sm"></div>
                                <span className="text-slate-600">Trimestral (Gris Claro)</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-white border-2 border-slate-300 rounded mr-2 shadow-sm"></div>
                                <span className="text-slate-600">Bimestral (Blanco)</span>
                            </div>
                            <div className="h-px bg-slate-200 my-2"></div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-green-500 border-2 border-green-700 rounded mr-2 shadow-sm"></div>
                                <span className="text-slate-600 font-medium">Aprobada (Sobre escribe color)</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-emerald-100 border-2 border-emerald-500 rounded mr-2 shadow-sm"></div>
                                <span className="text-slate-600">En Cursada</span>
                            </div>
                        </div>
                    </div>

                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        fitView
                        className="bg-slate-50 flex-1"
                        minZoom={0.1}
                    >
                        <Controls className="bg-white border border-slate-200 shadow-md rounded-lg" />
                        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                        <MiniMap
                            nodeStrokeColor={(n) => {
                                if (n.style?.backgroundColor === '#0f172a') return '#0f172a';
                                if (n.style?.backgroundColor === '#dcfce7') return '#16a34a';
                                return '#cbd5e1';
                            }}
                            nodeColor={(n) => {
                                if (n.style?.backgroundColor === '#0f172a') return '#0f172a';
                                if (n.style?.backgroundColor === '#dcfce7') return '#dcfce7';
                                return '#fff';
                            }}
                            className="border border-slate-200 shadow-lg rounded-lg"
                        />
                    </ReactFlow>
                </>
            )}

            <SubjectResourcesModal
                isOpen={!!selectedResourceSubject}
                onClose={() => setSelectedResourceSubject(null)}
                materia={selectedResourceSubject as any}
            />
        </div>
    );
}
