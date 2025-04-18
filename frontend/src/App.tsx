import { CssBaseline } from '@mui/material';
import { ThemeModeProvider, useThemeMode } from './ThemeContext';
import { BrowserRouter as Router } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import './App.css';


function App() {
  return (
    <ThemeModeProvider>
      <Router>
        <Dashboard />
      </Router>
    </ThemeModeProvider>
  );
}

export default App;
