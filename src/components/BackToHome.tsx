import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export const BackToHome = () => (
  <Link
    to="/"
    className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-brown hover:text-gold"
  >
    <ArrowLeft className="h-4 w-4" />
    Back to Home
  </Link>
);
