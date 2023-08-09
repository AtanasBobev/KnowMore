import axios from "axios";
import t from "./config.json"
// Create an instance of Axios with default configuration
const axiosInstance = axios.create({
  baseURL: t.baseURL+"/"+t.apiVersion,
});
// Add a request interceptor
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt");
  //Check if a token exists in local storage and add it to the header
  token && (config.headers.jwt = token);
  return config;
});
export default axiosInstance;
