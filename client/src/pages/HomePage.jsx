import { Link } from 'react-router-dom';
import { Button, Card } from 'react-bootstrap';

function HomePage({ user }) {
  return (
    <div>
      <h1>Last Race</h1>
      <Card className="mb-8">
        <Card.Body>
          <Card.Title>How to play</Card.Title>
          <Card.Text>
            In the game, the player is assigned a starting station and a destination station, which vary in each game,
            within a fictional underground network.
            </Card.Text>
          <Card.Text>
            The player must plan and execute a valid route before time runs out,
            gaining or losing coins along the way due to one of 10<strong>random events</strong>. The goal is to reach the destination with the
            highest possible score.
          </Card.Text>
          <Card.Text>
            You start with <strong>20 coins</strong>. You will be assigned a starting station and a destination
            station in a fictional underground network of Turin.
          </Card.Text>
          <Card.Text>
            In the <strong>Planning</strong> phase, you have <strong>90 seconds</strong> to build your route
            by selecting segments from the list. You cannot see the lines on the map - only the station names.
            Line changes are only allowed at interchange stations.
          </Card.Text>
          <Card.Text>
            In the <strong>Execution</strong> phase, each segment brings a <strong>random event that adds or removes coins.</strong>
            Reach the destination with as many coins as possible!
          </Card.Text>
          <Card.Text>
            If your route is invalid or incomplete, you lose all 20 coins
          </Card.Text>
          <Card.Text>
            Please <strong>login</strong> to start play
          </Card.Text>
        </Card.Body>
      </Card>

      <p></p>

      {user ? (
        <Button as={Link} to="/game" size="lg" variant="primary">Play</Button>
      ) : (
        <Button as={Link} to="/login" size="lg" variant="primary">Login</Button>
        // <p>Please <Link to="/login">login</Link> to play.</p>
      )}
    </div>
  );
}

export default HomePage;
