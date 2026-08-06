import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    organization: "",
    email: "",
    password: "",
    phone: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = "Full Name is required";
    }

    if (!form.organization.trim()) {
      newErrors.organization = "Organization is required";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Enter a valid email";
    }

    if (!form.password.trim()) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      alert("Registration Successful!");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
      <h2 className="text-3xl font-bold mb-6">
        Register
      </h2>

      <form onSubmit={handleSubmit}>

        {/* Full Name */}
        <div className="mb-5">
          <label className="block mb-2 font-medium">
            Full Name
          </label>

          <input
            type="text"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
            placeholder="John Doe"
          />

          {errors.fullName && (
            <p className="text-red-500 text-sm mt-1">
              {errors.fullName}
            </p>
          )}
        </div>

        {/* Organization */}
        <div className="mb-5">
          <label className="block mb-2 font-medium">
            Organization
          </label>

          <input
            type="text"
            name="organization"
            value={form.organization}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
            placeholder="Company Name"
          />

          {errors.organization && (
            <p className="text-red-500 text-sm mt-1">
              {errors.organization}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="mb-5">
          <label className="block mb-2 font-medium">
            Email
          </label>

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
            placeholder="Enter your email"
          />

          {errors.email && (
            <p className="text-red-500 text-sm mt-1">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="mb-5">
          <label className="block mb-2 font-medium">
            Password
          </label>

          <div className="relative">

            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 pr-12"
              placeholder="Create Password"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>

          </div>

          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password}
            </p>
          )}
        </div>

        {/* Phone */}
        <div className="mb-6">
          <label className="block mb-2 font-medium">
            Phone
          </label>

          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
            placeholder="+92 300 1234567"
          />

          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">
              {errors.phone}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-violet-600 text-white py-3 rounded-lg hover:bg-violet-700"
        >
          Create Account
        </button>

      </form>
    </div>
  );
}