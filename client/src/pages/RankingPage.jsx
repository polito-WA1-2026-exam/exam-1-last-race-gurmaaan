import { useState, useEffect } from 'react';
import { Table, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import API from '../API.js';

function RankingPage() {
  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    API.getRanking().then(setRanking).catch(console.error);
  }, []);

  return (
    <div style={{ maxWidth: 500 }}>
      <h2>Ranking</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Best Score (coins)</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((row, i) => (
            <tr key={row.username}>
              <td>{i + 1}</td>
              <td>{row.username}</td>
              <td>{row.best_score}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Button as={Link} to="/" variant="secondary">Back to Home</Button>
    </div>
  );
}

export default RankingPage;
