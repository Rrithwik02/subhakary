import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const PlanWedding = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/plan-event", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

export default PlanWedding;
