import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosConfig";
import "../../styles/allPages.css";
import "../../styles/forms.css";
import translate from "../../utils/languagesHandler";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    gender: "",
    age: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    if (isNaN(formData.age)) {
      toast.error("Age must be a number!");
      return;
    }
    if (formData.age < 1 || formData.age > 99) {
      toast.error("Age must be between 1 and 99!");
      return;
    }
    if (Object.values(formData).every((x) => x === null || x === "")) {
      toast.error("Please fill in all fields!");
      return;
    }
    //check if every field is at max 20 characters long and at least 3
    if (Object.values(formData).every((x) => x.length <= 20 && x.length >= 3)) {
      toast.error(
        "Please fill in all fields with at least 3 characters and at most 20!"
      );
      return;
    }
    e.preventDefault();
    axiosInstance
      .post("/register", formData)
      .then((response) => {
        console.log(response.data);
        localStorage.setItem("jwt", response.data.token);
        toast.success("Registration successful! Please verify your email.");
        navigate("/dashboard");
      })
      .catch((error) => {
        toast.error("Registration failed! " + error.message);
      });
  };

  return (
    <>
      <ToastContainer
        position="bottom-right"
        hideProgressBar={false}
        autoClose={3000}
        theme="colored"
        closeOnClick
      />{" "}
      <section className="centerWrapper" id="register">
        <h2>{translate("Register")}</h2>
        <form onSubmit={handleSubmit}>
          <input
            required
            type="text"
            placeholder={translate("Username")}
            name="username"
            value={formData.username}
            onChange={handleChange}
          />
          <input
            required
            type="password"
            placeholder={translate("Password")}
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
          <input
            required
            type="password"
            placeholder={translate("repeatPassword")}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
          <input
            required
            type="email"
            placeholder={translate("Email")}
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
          <select name="gender" id="gender" onChange={handleChange}>
            <option disabled="disabled" selected="selected">
              {translate("pleaseSelect")}
            </option>
            <option value="male">{translate("male")}</option>
            <option value="female">{translate("female")}</option>
          </select>
          <input
            required
            type="number"
            min="1"
            max="99"
            placeholder={translate("Age")}
            name="age"
            value={formData.age}
            onChange={handleChange}
          />
          <button type="submit">{translate("Register")}🪄</button>
        </form>
        <a href="/login">{translate("loginLabel")}</a>
      </section>
    </>
  );
};

export default Register;
