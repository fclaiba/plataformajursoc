export interface NodeDefinition {
    id: string; // N0..NX
    materiaId?: string; // Links to MATERIAS mock
    label: string;
    level: number;
    duration: 'Cuatrimestral' | 'Semestral' | 'Trimestral' | 'Bimestral' | 'Root'; // Durations inferred or default to Cuatrimestral for now
}

export interface EdgeDefinition {
    source: string;
    target: string;
}

export const CORRELATIVES_NODES: NodeDefinition[] = [
    // NIVEL 0 (Ingreso)
    { id: 'N0', materiaId: 'intro-cs-soc-1', label: 'Intro. Cs. Soc.', level: 0, duration: 'Root' },

    // PRIMER AÑO (Level 1)
    { id: 'N1', materiaId: 'intro-pens-cient', label: 'Pensamiento Científico', level: 1, duration: 'Bimestral' },
    { id: 'N2', materiaId: 'intro-soc', label: 'Intro. Sociología', level: 1, duration: 'Cuatrimestral' },
    { id: 'N3', materiaId: 'hist-const', label: 'Historia Const.', level: 1, duration: 'Cuatrimestral' },
    { id: 'N4', materiaId: 'intro-der', label: 'Intro. al Derecho', level: 1, duration: 'Cuatrimestral' },
    { id: 'N5', materiaId: 'der-rom', label: 'Derecho Romano', level: 1, duration: 'Cuatrimestral' },
    { id: 'N7', materiaId: 'der-pol', label: 'Derecho Político', level: 1, duration: 'Cuatrimestral' }, // Moved to Level 1

    // SEGUNDO AÑO (Level 2)
    { id: 'N6', materiaId: 'teoria-conf', label: 'Teoría del Conflicto', level: 2, duration: 'Bimestral' }, // Usually Year 2
    { id: 'N8', materiaId: 'der-priv-1', label: 'Derecho Privado I', level: 2, duration: 'Cuatrimestral' },
    { id: 'N11', materiaId: 'der-priv-2', label: 'Derecho Privado II', level: 2, duration: 'Semestral' }, // Year 2
    { id: 'N10', materiaId: 'der-pen-1', label: 'Derecho Penal I', level: 2, duration: 'Cuatrimestral' }, // Year 2
    { id: 'N9', materiaId: 'der-const', label: 'Derecho Constitucional', level: 2, duration: 'Cuatrimestral' }, // Year 2
    { id: 'N14', materiaId: 'ddhh', label: 'Derechos Humanos', level: 2, duration: 'Trimestral' }, // Year 2

    // TERCER AÑO (Level 3)
    { id: 'N16', materiaId: 'der-priv-4', label: 'Derecho Privado IV', level: 3, duration: 'Cuatrimestral' }, // Year 3
    { id: 'N19', materiaId: 'der-priv-3', label: 'Derecho Privado III', level: 3, duration: 'Cuatrimestral' }, // Added to Level 3 (assuming ID N19 was reused or needs new ID? Wait, N19 was Proc I. Let's make a new ID or find correct mapping. Using N19 for Priv III might break Edge N19->N25. Careful.
    // Wait, N19 was 'der-proc-1' in previous file. User list says Proc I is Year 3.
    // User list: Privado III is Year 3.
    // I will map N19 back to 'der-proc-1' (Procesal I) and keep it.
    // I need a NEW node for Privado III if it exists.
    // Let's stick to the graph nodes for now to avoid breaking edges.
    // Graph Nodes in Level 3 list:
    { id: 'N19', materiaId: 'der-proc-1', label: 'Derecho Procesal I', level: 3, duration: 'Cuatrimestral' },
    { id: 'N17', materiaId: 'econ-pol', label: 'Economía Política', level: 3, duration: 'Trimestral' },
    { id: 'N15', materiaId: 'der-pen-2', label: 'Derecho Penal II', level: 3, duration: 'Cuatrimestral' },
    { id: 'N13', materiaId: 'der-pub-prov', label: 'Der. Púb. Prov. y Mun.', level: 3, duration: 'Cuatrimestral' },
    { id: 'N18', materiaId: 'adapt-proc-pen', label: 'Prácticas Penales', level: 3, duration: 'Semestral' },
    { id: 'N12', materiaId: 'der-int-pub', label: 'Der. Int. Público', level: 3, duration: 'Cuatrimestral' },

    // CUARTO AÑO (Level 4)
    { id: 'N22', materiaId: 'der-admin-1', label: 'Derecho Admin. I', level: 4, duration: 'Cuatrimestral' },
    { id: 'N20', materiaId: 'der-priv-5', label: 'Derecho Privado V', level: 4, duration: 'Cuatrimestral' },
    { id: 'N25', materiaId: 'der-proc-2', label: 'Derecho Procesal II', level: 4, duration: 'Semestral' },
    { id: 'N21', materiaId: 'der-soc-trab-6', label: 'Derecho Social', level: 4, duration: 'Cuatrimestral' },
    { id: 'N34', materiaId: 'mediacion', label: 'Mediación', level: 4, duration: 'Bimestral' },
    { id: 'N29', materiaId: 'der-agr', label: 'Derecho Agrario', level: 4, duration: 'Trimestral' },
    { id: 'N23', materiaId: 'filosofia', label: 'Filosofía del Derecho', level: 4, duration: 'Cuatrimestral' },
    { id: 'N33', materiaId: 'adapt-proc-civ', label: 'Prácticas Civiles', level: 4, duration: 'Semestral' },
    { id: 'N26', materiaId: 'der-com-2', label: 'Derecho Privado VI', level: 4, duration: 'Cuatrimestral' },

    // QUINTO AÑO (Level 5)
    { id: 'N30', materiaId: 'der-admin-2', label: 'Derecho Admin. II', level: 5, duration: 'Cuatrimestral' },
    { id: 'N24', materiaId: 'der-fam', label: 'Derecho de Familia', level: 5, duration: 'Cuatrimestral' },
    { id: 'N35', materiaId: 'der-nav', label: 'Der. de la Navegación', level: 5, duration: 'Trimestral' },
    { id: 'N27', materiaId: 'der-col-trab', label: 'Derecho Colectivo', level: 5, duration: 'Trimestral' },
    { id: 'N28', materiaId: 'der-min', label: 'Minería y Energía', level: 5, duration: 'Trimestral' },
    { id: 'N31', materiaId: 'soc-jur', label: 'Sociología Jurídica', level: 5, duration: 'Trimestral' },
    { id: 'N37', materiaId: 'der-int-priv', label: 'Der. Int. Privado', level: 5, duration: 'Cuatrimestral' }, // Corrected ID N37
    { id: 'N32', materiaId: 'der-suc', label: 'Der. de las Sucesiones', level: 5, duration: 'Trimestral' },
    { id: 'N36', materiaId: 'der-not', label: 'Der. Notarial y Reg.', level: 5, duration: 'Cuatrimestral' },
    { id: 'N38', materiaId: 'finanzas', label: 'Finanzas y Der. Fin.', level: 5, duration: 'Trimestral' },
];

export const CORRELATIVES_EDGES: EdgeDefinition[] = [
    // Root -> L1
    { source: 'N0', target: 'N1' }, // Intro -> Pensamiento
    { source: 'N0', target: 'N2' }, // Intro -> Sociologia
    { source: 'N0', target: 'N3' }, // Intro -> Hist Const
    { source: 'N0', target: 'N4' }, // Intro -> Intro Der
    { source: 'N0', target: 'N5' }, // Intro -> Der Romano

    // L1 -> L2
    { source: 'N1', target: 'N6' }, // Pensamiento -> Teoria Conflicto
    { source: 'N2', target: 'N7' }, // Intro Soc -> Der Politico
    { source: 'N3', target: 'N7' }, // Hist Const -> Der Politico
    { source: 'N4', target: 'N7' }, // Intro Der -> Der Politico
    { source: 'N4', target: 'N8' }, // Intro Der -> Privado I
    { source: 'N5', target: 'N8' }, // Der Romano -> Privado I

    // L2 -> L3 (and branches)
    { source: 'N6', target: 'N9' }, // Teoria Conflicto -> Constitucional
    { source: 'N7', target: 'N9' }, // Der Politico -> Constitucional
    { source: 'N7', target: 'N10' }, // Der Politico -> Penal I
    { source: 'N8', target: 'N10' }, // Privado I -> Penal I
    { source: 'N8', target: 'N11' }, // Privado I -> Privado II

    // L3 -> L4 & Mix
    { source: 'N9', target: 'N12' }, // Constitucional -> Int Publico
    { source: 'N9', target: 'N13' }, // Constitucional -> Pub Prov
    { source: 'N9', target: 'N14' }, // Constitucional -> DDHH
    { source: 'N10', target: 'N14' }, // Penal I -> DDHH
    { source: 'N10', target: 'N15' }, // Penal I -> Penal II
    { source: 'N11', target: 'N15' }, // Privado II -> Penal II
    { source: 'N11', target: 'N16' }, // Privado II -> Privado IV
    { source: 'N11', target: 'N17' }, // Privado II -> Econ Politica

    // Further connections
    { source: 'N15', target: 'N18' }, // Penal II -> Practicas Penales
    { source: 'N14', target: 'N19' }, // DDHH -> Procesal I
    { source: 'N15', target: 'N19' }, // Penal II -> Procesal I
    { source: 'N16', target: 'N20' }, // Privado IV -> Privado V
    { source: 'N16', target: 'N21' }, // Privado IV -> Derecho Social

    // To L4/L5
    { source: 'N13', target: 'N22' }, // Pub Prov -> Admin I
    { source: 'N19', target: 'N22' }, // Procesal I -> Admin I
    { source: 'N14', target: 'N23' }, // DDHH -> Filosofia
    { source: 'N20', target: 'N24' }, // Privado V -> Familia
    { source: 'N19', target: 'N25' }, // Procesal I -> Procesal II
    { source: 'N20', target: 'N25' }, // Privado V -> Procesal II
    { source: 'N20', target: 'N26' }, // Privado V -> Privado VI
    { source: 'N21', target: 'N27' }, // Derecho Social -> Derecho Colectivo

    // To L5/L6
    { source: 'N22', target: 'N28' }, // Admin I -> Mineria
    { source: 'N22', target: 'N29' }, // Admin I -> Agrario
    { source: 'N22', target: 'N30' }, // Admin I -> Admin II
    { source: 'N23', target: 'N31' }, // Filosofia -> Soc Juridica
    { source: 'N24', target: 'N32' }, // Familia -> Sucesiones
    { source: 'N25', target: 'N33' }, // Procesal II -> Practicas Civiles
    { source: 'N25', target: 'N34' }, // Procesal II -> Mediacion
    { source: 'N26', target: 'N35' }, // Privado VI -> Navegacion
    { source: 'N26', target: 'N36' }, // Privado VI -> Notarial
    { source: 'N26', target: 'N37' }, // Privado VI -> Int Privado
    { source: 'N17', target: 'N38' }, // Econ Pol -> Finanzas
    { source: 'N22', target: 'N38' }, // Admin I -> Finanzas
];
