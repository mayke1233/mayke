import { Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home";
import { Office } from "./pages/Office";
import { Privacy } from "./pages/Privacy";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/escritorio" element={<Office />} />
      <Route path="/privacidade" element={<Privacy />} />
    </Routes>
  );
}
