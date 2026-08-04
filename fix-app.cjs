const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const [currentView, setCurrentView] = useState('home');",
  `const [currentView, _setCurrentView] = useState('home');
  
  // UX Hardening: Navigation state management
  const setCurrentView = (view: string) => {
    window.history.pushState({ view }, '', \`#\${view}\`);
    _setCurrentView(view);
  };
  
  // Popstate listener for mobile back button
  useEffect(() => {
    const handlePopState = (e) => {
      const state = e.state;
      // Close all modals first when back is pressed
      setIsScannerModalOpen(false);
      setSelectedDocForView(null);
      setSelectedDocForDetails(null);
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      
      // If there's a view state, navigate to it, otherwise home
      if (state && state.view) {
        _setCurrentView(state.view);
      } else {
        _setCurrentView('home');
      }
    };
    
    // Initial state setup
    if (!window.history.state || !window.history.state.view) {
      window.history.replaceState({ view: 'home' }, '', '#home');
    }
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
`
);

fs.writeFileSync('src/App.tsx', code);
