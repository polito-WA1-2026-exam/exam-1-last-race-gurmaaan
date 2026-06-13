import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import GamePage from './pages/GamePage.jsx';
import RankingPage from './pages/RankingPage.jsx';
import API from './API.js';

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    API.getCurrentUser()
      .then(u => setUser(u))
      .catch(() => setUser(null));
  }, []);

  function handleLogout() {
    API.logout().then(() => {
      setUser(null);
      navigate('/');
    });
  }

  return (
    <>
      <Navbar bg="dark" variant="dark">
        <Container>
          <Navbar.Brand as={Link} to="/">Last Race</Navbar.Brand>
          <Nav className="ms-auto align-items-center gap-3">
            {user ? (
              <>
                <span className="text-light">Hello, {user.username}</span>
                <Nav.Link as={Link} to="/ranking">Ranking</Nav.Link>
                <Button variant="outline-light" size="sm" onClick={handleLogout}>Logout</Button>
              </>
            ) : (
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
            )}
          </Nav>
        </Container>
      </Navbar>

      <Container className="mt-4">
        <Routes>
          <Route path="/" element={<HomePage user={user} />} />
          <Route path="/login" element={<LoginPage setUser={setUser} />} />
          <Route path="/game" element={user ? <GamePage /> : <Navigate to="/login" />} />
          <Route path="/ranking" element={user ? <RankingPage /> : <Navigate to="/login" />} />
        </Routes>
      </Container>
    </>
  );
}

export default App;
