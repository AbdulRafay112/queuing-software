import { Routes, Route } from "react-router-dom";
import QueueCalculator from "./pages/QueueCalculator";
import QueueSimulator from "./pages/QueueSimulator";
import Main from "./pages/main";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Main />} />
      <Route path="/calculator" element={<QueueCalculator />} />
      <Route path="/simulator" element={<QueueSimulator />} />
    </Routes>
  );
}

export default App