import { CssBaseline } from '@mui/material';
import { BillerStatusProvider } from './BillerStatusContext';
import { ThemeModeProvider, useThemeMode } from './ThemeContext';
import { BrowserRouter as Router } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import './App.css';


function App() {
  return (
    <ThemeModeProvider>
      <BillerStatusProvider>
        <Router>
          <Dashboard />
        </Router>
      </BillerStatusProvider>
    </ThemeModeProvider>
  );
}

export default App;
