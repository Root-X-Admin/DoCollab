import api from "./api";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const TOKEN_KEY = "docollab_token";

console.log("GOOGLE_CLIENT_ID (frontend):", GOOGLE_CLIENT_ID);

function waitForGoogleSdk(maxAttempts = 10, delayMs = 300) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const check = () => {
      attempts += 1;
      if (window.google && window.google.accounts) {
        return resolve();
      }
      if (attempts >= maxAttempts) {
        return reject(new Error("Google SDK not loaded yet"));
      }
      setTimeout(check, delayMs);
    };

    check();
  });
}

export async function triggerGoogleLogin() {
  return new Promise(async (resolve, reject) => {
    try {
      if (!GOOGLE_CLIENT_ID) {
        return reject(new Error("Missing REACT_APP_GOOGLE_CLIENT_ID"));
      }

      // Wait until Google SDK is actually ready
      await waitForGoogleSdk();

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

            resolve(user);
          } catch (err) {
            reject(err);
          }
        },
      });

      // Show one-tap / popup
      window.google.accounts.id.prompt();

    } catch (err) {
      console.error("triggerGoogleLogin error:", err);
      reject(err);
    }
  });
}
