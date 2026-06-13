import { useState, useEffect } from 'react';
import { Button, Alert, ListGroup, Badge, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import NetworkMap from '../components/NetworkMap.jsx';
import API from '../API.js';

function GamePage() {
  const [phase, setPhase] = useState('setup');
  const [network, setNetwork] = useState(null);
  const [start, setStart] = useState(null);
  const [dest, setDest] = useState(null);
  const [route, setRoute] = useState([]);
  const [usedSegments, setUsedSegments] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(90);
  const [gameResult, setGameResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Load network on mount
  useEffect(() => {
    API.getNetwork().then(setNetwork).catch(console.error);
  }, []);

  // Timer countdown during planning phase
  useEffect(() => {
    if (phase !== 'planning') return;
    if (timeLeft === 0) {
      handleSubmit();
      return;
    }
    const t = setTimeout(() => setTimeLeft(tl => tl - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, phase]);

  async function startPlanning() {
    const { start, dest } = await API.getGameStart();
    setStart(start);
    setDest(dest);
    setRoute([]);
    setUsedSegments(new Set());
    setTimeLeft(90);
    setPhase('planning');
  }

  async function handleSubmit() {
    const result = await API.submitGame(route, start.id, dest.id);
    setGameResult(result);
    setCurrentStep(0);
    setPhase('execution');
  }

  function addSegment(stationA, stationB) {
    const key = [Math.min(stationA, stationB), Math.max(stationA, stationB)].join('-');
    if (usedSegments.has(key)) return;

    if (route.length === 0) {
      // First segment must start from the assigned start station
      if (stationA === start.id) setRoute([stationA, stationB]);
      else if (stationB === start.id) setRoute([stationB, stationA]);
      else return;
    } else {
      const last = route[route.length - 1];
      if (stationA === last) setRoute(r => [...r, stationB]);
      else if (stationB === last) setRoute(r => [...r, stationA]);
      else return;
    }
    setUsedSegments(s => new Set([...s, key]));
  }

  function undoLastSegment() {
    if (route.length === 0) return;
    if (route.length === 1) { setRoute([]); return; }
    const from = route[route.length - 2];
    const to = route[route.length - 1];
    const key = [Math.min(from, to), Math.max(from, to)].join('-');
    const newUsed = new Set(usedSegments);
    newUsed.delete(key);
    setRoute(r => r.slice(0, -1));
    setUsedSegments(newUsed);
  }

  function getStationName(id) {
    return network?.stations.find(s => s.id === id)?.name || id;
  }

  if (!network) return <p>Loading network...</p>;

  // --- SETUP PHASE ---
  if (phase === 'setup') {
    return (
      <div>
        <h2>Setup</h2>
        <p>Study the network map. When ready, start the game. You will have 90 seconds to plan your route.</p>
        <NetworkMap network={network} showLines={true} />
        <div className="mt-3">
          <Button onClick={startPlanning} size="lg">Ready to play</Button>
        </div>
      </div>
    );
  }

  // --- PLANNING PHASE ---
  if (phase === 'planning') {
    const timerColor = timeLeft <= 10 ? 'danger' : timeLeft <= 30 ? 'warning' : 'success';
    return (
      <div>
        <Row>
          <Col md={7}>
            <h2>Planning</h2>
            <Card className="mb-2" bg="info" text="white">
              <Card.Body className="py-2 d-flex align-items-center gap-3">
                <span><small>FROM</small><br /><strong style={{ fontSize: 18 }}>{start.name}</strong></span>
                <span style={{ fontSize: 24 }}>→</span>
                <span><small>TO</small><br /><strong style={{ fontSize: 18 }}>{dest.name}</strong></span>
                <span className="ms-auto">Time left: <Badge bg={timerColor} style={{ fontSize: 18 }}>{timeLeft}s</Badge></span>
              </Card.Body>
            </Card>
            <NetworkMap network={network} showLines={false} highlightRoute={route} />
          </Col>

          <Col md={5} style={{ marginTop: 56 }}>
            <h4>Your route</h4>
            <p style={{ minHeight: 40 }}>
              {route.length === 0
                ? <span className="text-muted">Select a segment starting from {start.name}</span>
                : route.map(getStationName).join(' → ')}
            </p>
            <div className="mb-3 d-flex gap-2">
              <Button variant="secondary" size="sm" onClick={undoLastSegment} disabled={route.length === 0}>
                Undo
              </Button>
              <Button variant="primary" size="sm" onClick={handleSubmit} disabled={route.length < 2}>
                Submit route
              </Button>
            </div>

            <h5>Segments</h5>
            <ListGroup style={{ maxHeight: 350, overflowY: 'auto' }}>
              {network.segments.map((seg, i) => {
                const key = [Math.min(seg.station_a, seg.station_b), Math.max(seg.station_a, seg.station_b)].join('-');
                const used = usedSegments.has(key);
                return (
                  <ListGroup.Item
                    key={i}
                    action={!used}
                    onClick={() => addSegment(seg.station_a, seg.station_b)}
                    style={{ cursor: used ? 'default' : 'pointer', opacity: used ? 0.5 : 1 }}
                  >
                    {getStationName(seg.station_a)} — {getStationName(seg.station_b)}
                    {used && <Badge bg="secondary" className="ms-2">used</Badge>}
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          </Col>
        </Row>
      </div>
    );
  }

  // --- EXECUTION PHASE ---
  if (phase === 'execution') {
    if (!gameResult.valid) {
      return (
        <div>
          <h2>Invalid Route</h2>
          <Alert variant="danger">
            Your route was invalid or incomplete. You lose all 20 coins.
          </Alert>
          <p><strong>Final score: 0 coins</strong></p>
          <Button onClick={() => setPhase('setup')}>Play Again</Button>
        </div>
      );
    }

    const step = gameResult.steps[currentStep];
    const isLast = currentStep === gameResult.steps.length - 1;

    return (
      <div style={{ maxWidth: 500 }}>
        <h2>Execution</h2>
        <p>Step {currentStep + 1} of {gameResult.steps.length}</p>
        <table className="table table-bordered">
          <tbody>
            <tr>
              <td><strong>Segment</strong></td>
              <td>{getStationName(step.from)} → {getStationName(step.to)}</td>
            </tr>
            <tr>
              <td><strong>Event</strong></td>
              <td>{step.event}</td>
            </tr>
            <tr>
              <td><strong>Effect</strong></td>
              <td style={{ color: step.effect >= 0 ? 'green' : 'red' }}>
                {step.effect >= 0 ? '+' : ''}{step.effect} coins
              </td>
            </tr>
            <tr>
              <td><strong>Total</strong></td>
              <td><strong>{step.coins} coins</strong></td>
            </tr>
          </tbody>
        </table>
        {isLast
          ? <Button onClick={() => setPhase('result')}>See Result</Button>
          : <Button onClick={() => setCurrentStep(s => s + 1)}>Next Step</Button>
        }
      </div>
    );
  }

  // --- RESULT PHASE ---
  if (phase === 'result') {
    return (
      <div style={{ maxWidth: 400 }}>
        <h2>Result</h2>
        <Alert variant={gameResult.score > 10 ? 'success' : gameResult.score > 0 ? 'warning' : 'danger'}>
          <h3>Final score: {gameResult.score} coins</h3>
        </Alert>
        <div className="d-flex gap-3">
          <Button onClick={() => setPhase('setup')} size="lg">Play Again</Button>
          <Button as={Link} to="/ranking" variant="outline-primary" size="lg">View Ranking</Button>
        </div>
      </div>
    );
  }
}

export default GamePage;
