import { useEffect, useState } from "react";
import { checkBackend } from "../services/api";

function Home() {
  const [message, setMessage] = useState("Checking backend...");

  useEffect(() => {
    checkBackend()
      .then((data) => setMessage(`Backend ${data.status} · database ${data.db}`))
      .catch(() => setMessage("Backend connection failed"));
  }, []);

  return (
    <div>
      <h1>Welcome to SyncSpace</h1>
      <p>Real-Time Communication Portal</p>

      <h2>{message}</h2>
    </div>
  );
}

export default Home;
