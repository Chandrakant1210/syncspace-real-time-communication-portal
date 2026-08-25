import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import Alert from "../components/Alert";
import AuthLayout from "../components/AuthLayout";
import Button from "../components/Button";
import Input from "../components/Input";
import PasswordInput from "../components/PasswordInput";
import { auth, getToken } from "../services/api";
import { describeAuthError, missingTokenError } from "../utils/authError";
import { isFormValid, validateEmail, validatePassword } from "../utils/validation";

const REMEMBER_KEY = "syncspace_remember_email";

// "Remember me" keeps the email address on this device so it's pre-filled next
// visit. It never stores the password.
function readRememberedEmail() {
  try {
    return localStorage.getItem(REMEMBER_KEY) || "";
  } catch {
    return "";
  }
}

function writeRememberedEmail(email) {
  try {
    if (email) localStorage.setItem(REMEMBER_KEY, email);
    else localStorage.removeItem(REMEMBER_KEY);
  } catch {
    /* storage disabled — not worth failing a sign-in over */
  }
}

const validators = {
  email: validateEmail,
  password: validatePassword,
};

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // Lazy initialisers: localStorage is read once, on mount.
  const [values, setValues] = useState(() => ({
    email: readRememberedEmail(),
    password: "",
  }));
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [remember, setRemember] = useState(() => Boolean(readRememberedEmail()));

  const [status, setStatus] = useState("idle"); // idle | submitting | success
  const [banner, setBanner] = useState(null);

  // Where to land after signing in: back to the page that bounced them here.
  const from = location.state?.from;
  const redirectTo = from && from !== "/login" && from !== "/register" ? from : "/dashboard";

  const redirectTimer = useRef(null);
  useEffect(() => () => clearTimeout(redirectTimer.current), []);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));

    // Only correct errors the user has already seen — don't scold mid-typing.
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validators[name](value) }));
    }
  }

  function handleBlur(event) {
    const { name, value } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validators[name](value) }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (status !== "idle") return;

    const nextErrors = {
      email: validateEmail(values.email),
      password: validatePassword(values.password),
    };
    setErrors(nextErrors);
    setTouched({ email: true, password: true });

    if (!isFormValid(nextErrors)) {
      setBanner({
        tone: "error",
        title: "Please fix the highlighted fields",
        message: "A couple of details still need your attention.",
      });
      return;
    }

    setBanner(null);
    setStatus("submitting");

    try {
      await auth.login({
        email: values.email.trim(),
        password: values.password,
      });

      // A stubbed endpoint can answer 200 with no token — don't fake a session.
      if (!getToken()) {
        setBanner(missingTokenError("login"));
        setStatus("idle");
        return;
      }

      writeRememberedEmail(remember ? values.email.trim() : "");

      setStatus("success");
      setBanner({
        tone: "success",
        title: "Signed in",
        message: "Taking you to your dashboard…",
      });
      redirectTimer.current = setTimeout(
        () => navigate(redirectTo, { replace: true }),
        800
      );
    } catch (error) {
      setBanner(describeAuthError(error, "login"));
      setStatus("idle");
    }
  }

  const busy = status === "submitting";
  const done = status === "success";

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your SyncSpace workspace."
      panel={{
        eyebrow: "Live right now",
        heading: "Pick up exactly where you left off.",
        blurb:
          "Your rooms, conversations and teammates are waiting — signed in, everything syncs the moment it changes.",
      }}
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-indigo-600 underline-offset-4 transition-colors hover:text-indigo-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
          >
            Create one
          </Link>
        </>
      }
    >
      {banner && (
        <Alert tone={banner.tone} title={banner.title} className="mb-5">
          {banner.message}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Input
          label="Email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.email ? errors.email : ""}
          disabled={busy || done}
          required
        />

        <PasswordInput
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.password ? errors.password : ""}
          disabled={busy || done}
          required
        />

        {/* Remember + forgot — stacks on the narrowest phones. */}
        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
            <input
              type="checkbox"
              name="remember"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              disabled={busy || done}
              className="h-4.5 w-4.5 shrink-0 rounded-md border-slate-300 accent-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            />
            Remember me
          </label>

          <button
            type="button"
            onClick={() =>
              setBanner({
                tone: "info",
                title: "Password reset isn't available yet",
                message:
                  "It's on the roadmap — ask a workspace admin to reset it for you in the meantime.",
              })
            }
            className="self-start text-sm font-medium text-indigo-600 underline-offset-4 transition-colors hover:text-indigo-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:self-auto"
          >
            Forgot password?
          </button>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={busy}
          disabled={done}
          className="mt-6"
        >
          {busy ? "Signing in…" : done ? "Signed in" : "Sign in"}
        </Button>
      </form>
    </AuthLayout>
  );
}

export default Login;
