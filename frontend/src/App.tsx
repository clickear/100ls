import { Route, Switch, Router } from 'wouter';
import PlayerPage from './pages/Player';
import HomePage from './pages/Home';
import { useSettings } from './hooks/useSettings';

function App() {
  useSettings(); // Initialize settings and apply theme
  
  // Use the Vite BASE_URL for routing compatibility in sub-directories
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <Router base={baseUrl}>
      <Switch>
        <Route path="/">
          <HomePage />
        </Route>
        <Route path="/player/:videoId">
          {(params) => <PlayerPage videoId={params.videoId} />}
        </Route>
        <Route>404 - 未找到页面</Route>
      </Switch>
    </Router>
  );
}

export default App;
