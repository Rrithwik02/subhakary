import { useLocation, useNavigate } from "react-router-dom";

export function useSmartBack() {
  const navigate = useNavigate();
  const location = useLocation();

  return (fallbackPath = "/") => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallbackPath, {
      replace: location.pathname === fallbackPath,
    });
  };
}
