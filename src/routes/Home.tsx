import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Home page simply redirects to Dashboard
export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  return null;
}
