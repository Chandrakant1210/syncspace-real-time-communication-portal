import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Alert from "../components/Alert";
import AuthLayout from "../components/AuthLayout";
import Button from "../components/Button";
import Input from "../components/Input";
import PasswordInput from "../components/PasswordInput";
import { auth, getToken } from "../services/api";
import { describeAuthError, missingTokenError } from "../utils/authError";
import {
  isFormValid,
  PASSWORD_MIN,
  passwordStrength,
  validateConfirmPassword,
  validateEmail,
  validateName,
  validatePassword,
} from "../utils/validation";

const strengthStyles = {
  red: { bar: "bg-linear-to-r from-red-400 to-red-500", text: "text-red-600" },
  amber: {
    bar: "bg-linear-to-r from-amber-400 to-orange-500",
    text: "text-amber-600",
  },
  emerald: {
    bar: "bg-linear-to-r from-emerald-400 to-teal-500",
    text: "text-emerald-600",
  },
};

/** Three-segment meter under the password field. */
function StrengthMeter({ value }) {
  const { score, label, tone } = passwordStrength(value);
  const styles = strengthStyles[tone];

  return (
    <div className="mt-3" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {[1, 2, 3].map((step) => (
            <span
              key={step}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                score >= step && styles ? styles.bar : "bg-slate-200"
              }`}
            />
          ))}
        </div>
        <span
          className={`w-14 shrink-0 text-right text-[11px] font-semibold ${
            styles ? styles.text : "text-slate-400"
          }`}
        >
          {label || "—"}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-slate-500">
        {score === 3
          ? "Nice — that's a strong password."
          : `At least ${PASSWORD_MIN} characters. Mix upper and lower case, numbers and symbols to strengthen it.`}
      </p>
    </div>
  );
}

function Register() {
  const navigate = useNavigate();

  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const [status, setStatus] = useState("idle"); // idle | submitting | success
  const [banner, setBanner] = useState(null);

  const redirectTimer = useRef(null);
  useEffect(() => () => clearTimeout(redirectTimer.current), []);

  // Takes the whole value set so "confirm" can be checked against whatever
  // password is typed right now.
  function validateField(name, value, all) {
    switch (name) {
      case "name":
        return validateName(value);
      case "email":
        return validateEmail(value);
      case "password":
        return validatePassword(value);
      case "confirmPassword":
        return validateConfirmPassword(value, all.password);
      default:
        return "";
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    const next = { ...values, [name]: value };
    setValues(next);

    setErrors((prev) => {
      const updated = { ...prev };
      // Only correct errors the user has already seen — don't scold mid-typing.
      if (touched[name]) updated[name] = validateField(name, value, next);
      // Editing the password re-checks a confirm field they've already seen.
      if (name === "password" && touched.confirmPassword) {
        updated.confirmPassword = validateConfirmPassword(
          next.confirmPassword,
          value
        );
      }
      return updated;
    });
  }

  function handleBlur(event) {
    const { name, value } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value, values) }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (status !== "idle") return;

    const nextErrors = {
      name: validateName(values.name),
      email: validateEmail(values.email),
      password: validatePassword(values.password),
      confirmPassword: validateConfirmPassword(
        values.confirmPassword,
        values.password
      ),
    };
    setErrors(nextErrors);
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (!isFormValid(nextErrors)) {
      setBanner({
        tone: "error",
        title: "Please fix the highlighted fields",
        message: "A few details still need your attention.",
      });
      return;
    }

    setBanner(null);
    setStatus("submitting");

    try {
      await auth.register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });

      // The account may exist without a session if the endpoint is a stub.
      if (!getToken()) {
        setBanner(missingTokenError("register"));
        setStatus("idle");
        return;
      }

      setStatus("success");
      setBanner({
        tone: "success",
        title: "Account created",
        message: "Welcome to SyncSpace — setting up your dashboard…",
      });
      redirectTimer.current = setTimeout(
        () => navigate("/dashboard", { replace: true }),
        900
      );
    } catch (error) {
      setBanner(describeAuthError(error, "register"));
      setStatus("idle");
    }
  }

  const busy = status === "submitting";
  const done = status === "success";

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Set up a SyncSpace workspace in under a minute."
      panel={{
        eyebrow: "Free to start",
        heading: "Get your team talking in minutes.",
        blurb:
          "Create a workspace, invite your teammates and start a room — no setup, no configuration, nothing to install.",
      }}
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-indigo-600 underline-offset-4 transition-colors hover:text-indigo-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
          >
            Sign in
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
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Ada Lovelace"
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.name ? errors.name : ""}
          disabled={busy || done}
          required
        />

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

        <div>
          <PasswordInput
            label="Password"
            name="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.password ? errors.password : ""}
            disabled={busy || done}
            required
          />
          <StrengthMeter value={values.password} />
        </div>

        <PasswordInput
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="••••••••"
          value={values.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.confirmPassword ? errors.confirmPassword : ""}
          disabled={busy || done}
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={busy}
          disabled={done}
          className="mt-6"
        >
          {busy ? "Creating account…" : done ? "Account created" : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}

export default Register;
