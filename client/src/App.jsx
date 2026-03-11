import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import ContactDetail from './pages/ContactDetail';
import Companies from './pages/Companies';

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/contacts/:id" element={<ContactDetail />} />
        <Route path="/companies" element={<Companies />} />
      </Routes>
    </div>
  );
}
