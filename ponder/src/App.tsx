
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Workspace from './pages/Workspace';

function App() {
  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="workspace/:sessionId" element={<Workspace />} />
            <Route path="chat" element={<div className="p-8">Chat View (Coming Soon)</div>} />
            <Route path="space" element={<div className="p-8">Space View (Coming Soon)</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
