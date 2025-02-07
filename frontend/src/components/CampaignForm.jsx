import { useState } from "react";
import axios from "axios";

const CampaignForm = () => {
  const [formData, setFormData] = useState({
    businessName: "",
    industry: "",
    services: "",
    budget: "",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await axios.post("http://localhost:5000/chatbot", formData);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
      <h2 className="text-2xl font-bold text-center text-gray-800">Google Ads Campaign</h2>
      
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          type="text"
          name="businessName"
          placeholder="Business Name"
          value={formData.businessName}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
          required
        />
        <input
          type="text"
          name="industry"
          placeholder="Industry"
          value={formData.industry}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
          required
        />
        <input
          type="text"
          name="services"
          placeholder="Services Offered"
          value={formData.services}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
          required
        />
        <input
          type="number"
          name="budget"
          placeholder="Budget (in USD)"
          value={formData.budget}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "Generating..." : "Create Campaign"}
        </button>
      </form>

      {error && <p className="mt-4 text-red-600 text-center">{error}</p>}

      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="text-lg font-semibold">Campaign Created</h3>
          <p><strong>Strategy:</strong> {result.campaignStrategy}</p>
          <p><strong>Campaign ID:</strong> {result.campaignId}</p>
          <p><strong>Ad Group ID:</strong> {result.adGroupId}</p>
          <h4 className="font-semibold mt-2">Keywords:</h4>
          <ul className="list-disc pl-6">
            {result.addedKeywords.map((kw, index) => (
              <li key={index}>{kw.text} ({kw.match_type})</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CampaignForm;
