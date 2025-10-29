import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import CampaignList from './pages/CampaignList';
import CampaignDetail from './pages/CampaignDetail';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/campaigns" replace />} />
        <Route path="campaigns" element={<CampaignList />} />
        <Route path="campaigns/:id" element={<CampaignDetail />} />
      </Route>
    </Routes>
  );
}

export default App;
