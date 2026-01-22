import { ReactNode } from "react";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileHeader } from "./MobileHeader";

export interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  showNotifications?: boolean;
  rightAction?: ReactNode;
  hideHeader?: boolean;
  hideNav?: boolean;
}

export const MobileLayout = ({
  children,
  title,
  showBackButton = false,
  showNotifications = true,
  rightAction,
  hideHeader = false,
  hideNav = false,
}: MobileLayoutProps) => {
  return (
    <div className="min-h-screen bg-background lg:hidden">
      {!hideHeader && (
        <MobileHeader
          title={title}
          showBackButton={showBackButton}
          showNotifications={showNotifications}
          rightAction={rightAction}
        />
      )}
      <main className={`${!hideNav ? 'pb-24' : ''} ${!hideHeader ? 'pt-16' : ''}`}>
        {children}
      </main>
      {!hideNav && <MobileBottomNav />}
    </div>
  );
};
