import { Navigate, Route, Routes } from "react-router-dom";
import { ConfigScreen } from "./screens/ConfigScreen";
import { GameScreen } from "./screens/GameScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { JoinScreen } from "./screens/JoinScreen";
import { LobbyScreen } from "./screens/LobbyScreen";
import { ResultsScreen } from "./screens/ResultsScreen";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/config" element={<ConfigScreen />} />
      <Route path="/join" element={<JoinScreen />} />
      <Route path="/room/:code" element={<LobbyScreen />} />
      <Route path="/game/:code" element={<GameScreen />} />
      <Route path="/results/:code" element={<ResultsScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
