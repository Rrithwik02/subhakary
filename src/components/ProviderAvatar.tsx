import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type ProviderAvatarProps = {
  name?: string | null;
  logoUrl?: string | null;
  fallback?: string;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  sizeClassName?: string;
};

export const ProviderAvatar = ({
  name,
  logoUrl,
  fallback = "👤",
  className,
  imageClassName,
  fallbackClassName,
  sizeClassName = "h-14 w-14",
}: ProviderAvatarProps) => {
  const initial = name?.trim().charAt(0)?.toUpperCase() || fallback;

  return (
    <Avatar className={`${sizeClassName} ${className || ""}`.trim()}>
      <AvatarImage src={logoUrl || undefined} alt={name || "Service provider"} className={imageClassName} />
      <AvatarFallback className={fallbackClassName}>{initial}</AvatarFallback>
    </Avatar>
  );
};
