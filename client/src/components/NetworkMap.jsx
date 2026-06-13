// Fixed positions for each station (id -> [x, y])
const POSITIONS = {
  1:  [250, 300],  // Torino Porta Nuova
  2:  [380, 350],  // Lingotto
  3:  [360, 430],  // Mirafiori
  4:  [240, 470],  // Stupinigi
  5:  [140, 300],  // Porta Susa
  6:  [70,  230],  // Collegno
  7:  [30,  160],  // Rivoli
  8:  [280, 210],  // Repubblica
  9:  [400, 240],  // Aurora
  10: [510, 190],  // Barriera di Milano
  11: [340, 140],  // Rebaudengo
  12: [460, 90],   // Settimo
  13: [480, 340],  // Grugliasco
  14: [530, 430],  // Orbassano
};

const LINE_COLORS = {
  1: 'red',
  2: '#4488ff',
  3: 'green',
  4: '#ccaa00',
  5: 'orange',
};

function NetworkMap({ network, showLines, highlightRoute }) {
  const { lines, stations, segments } = network;

  return (
    <svg width="750" height="510" style={{ border: '1px solid #dee2e6', background: '#f8f9fa', borderRadius: 8 }}>

      {/* Draw line segments */}
      {showLines && segments.map((seg, i) => {
        const [x1, y1] = POSITIONS[seg.station_a] || [0, 0];
        const [x2, y2] = POSITIONS[seg.station_b] || [0, 0];
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={LINE_COLORS[seg.line_id]} strokeWidth={5} />
        );
      })}

      {/* Draw selected route highlight */}
      {highlightRoute && highlightRoute.length > 1 && highlightRoute.map((stId, i) => {
        if (i === 0) return null;
        const [x1, y1] = POSITIONS[highlightRoute[i - 1]] || [0, 0];
        const [x2, y2] = POSITIONS[stId] || [0, 0];
        return (
          <line key={`route-${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="purple" strokeWidth={7} strokeDasharray="8 4" opacity={0.7} />
        );
      })}

      {/* Draw stations */}
      {stations.map(st => {
        const [x, y] = POSITIONS[st.id] || [0, 0];
        const inRoute = highlightRoute && highlightRoute.includes(st.id);
        return (
          <g key={st.id}>
            <circle cx={x} cy={y} r={9} fill={inRoute ? 'purple' : 'white'} stroke="#333" strokeWidth={2} />
            <text x={x + 12} y={y + 4} fontSize={11} fill="#222">{st.name}</text>
          </g>
        );
      })}

      {/* Legend (only when showing lines) */}
      {showLines && lines.map((line, i) => (
        <g key={line.id}>
          <rect x={10} y={10 + i * 20} width={20} height={6} rx={3} fill={LINE_COLORS[line.id]} />
          <text x={36} y={20 + i * 20} fontSize={11} fill="#333">{line.name}</text>
        </g>
      ))}
    </svg>
  );
}

export default NetworkMap;
