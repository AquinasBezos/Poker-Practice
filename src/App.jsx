import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import TutorialHub from './pages/TutorialHub.jsx';
import OutsTrainer from './pages/tutorials/OutsTrainer.jsx';
import PotOddsTrainer from './pages/tutorials/PotOddsTrainer.jsx';
import SpeedRecognition from './pages/tutorials/SpeedRecognition.jsx';
import PushFold from './pages/tutorials/PushFold.jsx';
import Arena from './pages/Arena.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="tutorials" element={<TutorialHub />} />
        <Route path="tutorials/outs" element={<OutsTrainer />} />
        <Route path="tutorials/pot-odds" element={<PotOddsTrainer />} />
        <Route path="tutorials/speed" element={<SpeedRecognition />} />
        <Route path="tutorials/push-fold" element={<PushFold />} />
        <Route path="arena" element={<Arena />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
