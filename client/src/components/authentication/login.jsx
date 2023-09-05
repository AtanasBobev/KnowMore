import { useState } from "preact/hooks";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import axiosInstance from "../../utils/axiosConfig";
import "../../styles/allPages.css";
import "../../styles/forms.css";
import translate from "../../utils/languagesHandler";

const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");
    const password = formData.get("password");

    axiosInstance
      .post("/login", {
        username,
        password,
        language: localStorage.getItem("language") || "en-US",
      })
      .then((response) => {
        localStorage.setItem("jwt", response.data.token);
        navigate("/explore");
      })
      .catch((error) => {
        setError(error.response.data.error);
      });
  };

  return (
    <>
      <section id="login" className="centerWrapper">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder={translate("placeholder.Username")}
            name="username"
          />
          <input
            type="password"
            placeholder={translate("placeholder.Password")}
            name="password"
          />
          <button type="submit">{translate("label.Login")}🔥</button>
        </form>
        <p className="error">{error}</p>
        <a href="/register">{translate("label.registerLabel")}</a>
      </section>
    </>
  );
};

export default Login;
