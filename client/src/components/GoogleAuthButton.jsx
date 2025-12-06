import React, { useEffect, useRef, useState } from "react";
import api from "../lib/api";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const TOKEN_KEY = "docollab_token";

function GoogleAuthButton({ mode = "login", onSuccess, onError }) {
  const buttonRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.error("Missing REACT_APP_GOOGLE_CLIENT_ID");
      return;
    }

    let cancelled = false;

    const waitForGoogle = (attempts = 0) => {
      if (cancelled) return;
      if (window.google && window.google.accounts && window.google.accounts.id) {
        setReady(true);

        // Initialize only once globally
        if (!window._docollabGoogleInit) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response) => {
              try {
                const idToken = response.credential;
                const res = await api.post("/auth/google", { idToken });
                const { token, user } = res.data || {};
                if (token) {
                  localStorage.setItem(TOKEN_KEY, token);
                }
                if (onSuccess) onSuccess(user);
              } catch (err) {
                console.error("Google backend login error:", err);
                if (onError) {
                  onError(
                    err.response?.data?.message ||
                      err.message ||
                      "Failed to login with Google."
                  );
                }
              }
            },
          });
          window._docollabGoogleInit = true;
        }

        // Render Google button inside our styled wrapper
        if (buttonRef.current) {
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: "outline",
            size: "large",
            type: "standard",
            shape: "pill",
            text: mode === "login" ? "continue_with" : "signup_with",
            width: "280",
          });
        }

        return;
      }

      if (attempts > 20) {
        console.error("Google SDK not loaded after multiple attempts");
        if (onError) {
          onError("Google SDK not loaded. Please refresh and try again.");
        }
        return;
      }

      setTimeout(() => waitForGoogle(attempts + 1), 250);
    };

    waitForGoogle();

    return () => {
      cancelled = true;
    };
  }, [onSuccess, onError, mode]);

  return (
    <div className="w-full flex justify-center mt-1">
      <div
        ref={buttonRef}
        className={`flex justify-center ${
          !ready ? "opacity-60 pointer-events-none" : ""
        }`}
      />
    </div>
  );
}

export default GoogleAuthButton;
