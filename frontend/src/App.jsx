import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

import Layout from "./components/Layout";
import Button from "./components/Button";
import Input from "./components/Input";

// Temporary preview screen for the shared UI components.
function ComponentsPreview() {
  const [email, setEmail] = useState("");

  return (
    <Layout userName="Sargun" onLogout={() => alert("Logout clicked")}>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">
        Component Preview
      </h1>

      {/* Buttons */}
      <section className="mb-6 rounded-xl border border-slate-200/80 bg-white p-6 shadow-soft">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Buttons
        </h2>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      {/* Inputs */}
      <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-soft">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Inputs
        </h2>
        <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            helperText="At least 8 characters."
          />
          <Input
            label="Room name"
            name="room"
            placeholder="my-room"
            error="This room name is already taken."
          />
          <Input label="Disabled" name="disabled" value="Read only" disabled readOnly />
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="primary">Save</Button>
          <Button variant="secondary">Cancel</Button>
        </div>
      </section>
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/components-preview" element={<ComponentsPreview />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
