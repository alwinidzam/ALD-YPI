const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace all setCurrentView(X) with navigate(X) if they are in the component body,
// But we can just create a wrapper function inside App component and replace calls.
// Actually, it's easier to rename the state setter to _setCurrentView, and define setCurrentView that pushes state.
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
    const handlePopState = (e: PopStateEvent) => {
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

// We need to also handle modals pushing state.
// e.g., when opening scanner:
code = code.replace(
  "setIsScannerModalOpen(true)",
  "window.history.pushState({ view: currentView, modal: 'scanner' }, '');\n    setIsScannerModalOpen(true)"
);

code = code.replace(
  "setSelectedDocForView(doc)",
  "window.history.pushState({ view: currentView, modal: 'pdf-viewer' }, '');\n    setSelectedDocForView(doc)"
);

code = code.replace(
  "setSelectedDocForDetails(doc)",
  "window.history.pushState({ view: currentView, modal: 'doc-details' }, '');\n    setSelectedDocForDetails(doc)"
);

// When closing modals via UI, if we pushed state, we should pop it using history.back() 
// But what if they opened it and didn't push state? (e.g. from a direct link)
// To keep it simple, instead of window.history.back(), we just set state to false.
// If the user presses the native back button, the popstate listener fires and sets state to false (which works).
// BUT if the user clicks the "X" button, the URL will still have the modal state. 
// A robust way is: when "X" is clicked, if the current history state has a modal, we call window.history.back(). 
// Otherwise we just set the state to false.

fs.writeFileSync('src/App.tsx', code);
