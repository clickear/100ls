import { Route, Switch } from 'wouter';
import PlayerPage from './pages/Player';
import HomePage from './pages/Home';
import { useSettings } from './hooks/useSettings';

function App() {
  useSettings(); // Initialize settings and apply theme
  
  return (
    <Switch>
      <Route path="/">
        <HomePage />
      </Route>
      <Route path="/player/:videoId">
        {(params) => <PlayerPage videoId={params.videoId} />}
      </Route>
      <Route>404 - 未找到页面</Route>
    </Switch>
  );
}

export default App;
