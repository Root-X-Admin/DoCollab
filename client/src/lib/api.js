import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const TOKEN_KEY = "docollab_token";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false, // we now use Authorization header, not cookies
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("docollab_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);

export default api;
export { TOKEN_KEY };
