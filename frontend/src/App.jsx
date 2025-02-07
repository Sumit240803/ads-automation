import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [formData, setFormData] = useState({
    customer_id: "9448741503",
    business_name: "",
    industry: "",
    services: "",
    budget: "500000", // Default to 0.50 USD
  });

  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const res = await fetch("http://127.0.0.1:5000/create-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setResponse(data);
      } else {
        setError(data.message || "Something went wrong!");
      }
    } catch (err) {
      setError("Failed to connect to server.");
    }

    setLoading(false);
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Google Ads Campaign Automation</h2>

      <form onSubmit={handleSubmit}>
        

        <div className="mb-3">
          <label className="form-label">Business Name</label>
          <input
            type="text"
            className="form-control"
            name="business_name"
            value={formData.business_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Industry</label>
          <input
            type="text"
            className="form-control"
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Services Offered</label>
          <input
            type="text"
            className="form-control"
            name="services"
            value={formData.services}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Budget (Micros)</label>
          <input
            type="number"
            className="form-control"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Processing..." : "Create Campaign"}
        </button>
      </form>

      {error && <p className="text-danger mt-3">{error}</p>}

      {response && (
        <div className="mt-4">
          <h4>Campaign Created Successfully!</h4>
          <p><strong>Campaign ID:</strong> {response.campaign_id}</p>
          <p><strong>Ad Group ID:</strong> {response.ad_group_id}</p>
          <h5>Added Keywords:</h5>
          <ul>
            {response.keywords_added.map((kw, index) => (
              <li key={index}>{kw}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
