import React from "react";
import type { User } from "@/types/user";

export interface QuotaBannerProps {
  user: Pick<User, "name" | "monthlyQuota" | "processedThisMonth" | "isWhopSubscriber" | "id">;
  onUpgradeClick?: () => void;
}

const LOW_QUOTA_THRESHOLD = 5;

const QuotaBanner: React.FC<QuotaBannerProps> = ({ user, onUpgradeClick }) => {
  const isSubscriber = user.isWhopSubscriber;
  const remaining = isSubscriber ? Number.POSITIVE_INFINITY : Math.max(0, user.monthlyQuota - user.processedThisMonth);

  if (isSubscriber) {
    return (
      <div className="quota-banner quota-banner--subscriber" role="status">
        <strong>Pro unlocked.</strong> Enjoy unlimited processing{user.name ? `, ${user.name}` : ""}.
      </div>
    );
  }

  const isDepleted = remaining === 0;
  const isLow = !isDepleted && remaining <= LOW_QUOTA_THRESHOLD;

  return (
    <div
      className={`quota-banner ${isDepleted ? "quota-banner--depleted" : isLow ? "quota-banner--low" : ""}`.trim()}
      role="status"
    >
      <div>
        {isDepleted ? (
          <strong>You're out of free quota this month.</strong>
        ) : (
          <strong>
            {remaining} of {user.monthlyQuota} items remaining this month.
          </strong>
        )}
        <span className="quota-banner__subtext">
          {isDepleted
            ? "Upgrade to continue processing without interruptions."
            : isLow
            ? "You're almost at your limit. Upgrade for unlimited processing."
            : "Stay on track by upgrading whenever you're ready."}
        </span>
      </div>
      <button type="button" className="quota-banner__button" onClick={onUpgradeClick} disabled={!onUpgradeClick}>
        Upgrade
      </button>
    </div>
  );
};

export default QuotaBanner;
