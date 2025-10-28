import React, { useMemo, useState } from "react";
import { WHOP_CHECKOUT_URL, WHOP_VERIFY_ENDPOINT } from "@/config/billing";

export interface UpgradeModalProps {
  open: boolean;
  userId: string;
  userEmail?: string;
  remainingQuota: number;
  totalQuota: number;
  onClose: () => void;
  onVerified?: (payload: { userId: string }) => void;
  verifyEndpoint?: string;
  checkoutUrl?: string;
}

const DEFAULT_IFRAME_HEIGHT = 520;

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  open,
  userId,
  userEmail,
  remainingQuota,
  totalQuota,
  onClose,
  onVerified,
  verifyEndpoint = WHOP_VERIFY_ENDPOINT,
  checkoutUrl = WHOP_CHECKOUT_URL
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationComplete, setVerificationComplete] = useState(false);

  const quotaMessage = useMemo(() => {
    if (remainingQuota <= 0) {
      return "You've reached your monthly quota. Upgrade to continue processing unlimited items.";
    }
    return `Only ${remainingQuota} of ${totalQuota} free items remain this month.`;
  }, [remainingQuota, totalQuota]);

  if (!open) {
    return null;
  }

  const handleVerifyClick = async () => {
    setVerificationError(null);
    setIsVerifying(true);
    try {
      const response = await fetch(verifyEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId, email: userEmail })
      });

      if (!response.ok) {
        const errorJson = await safeJson(response);
        throw new Error(errorJson?.error || "Verification failed");
      }

      setVerificationComplete(true);
      onVerified?.({ userId });
    } catch (error) {
      setVerificationError(error instanceof Error ? error.message : "Unknown error verifying subscription");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="upgrade-modal-title" className="upgrade-modal">
      <div className="upgrade-modal__content">
        <header className="upgrade-modal__header">
          <h2 id="upgrade-modal-title">Upgrade for Unlimited Processing</h2>
          <button type="button" onClick={onClose} aria-label="Close upgrade modal">
            ×
          </button>
        </header>
        <p className="upgrade-modal__message">{quotaMessage}</p>
        <section className="upgrade-modal__checkout">
          <iframe
            title="Whop checkout"
            src={checkoutUrl}
            loading="lazy"
            width="100%"
            height={DEFAULT_IFRAME_HEIGHT}
            style={{ border: "0", borderRadius: "12px" }}
            allow="payment"
          />
        </section>
        <footer className="upgrade-modal__footer">
          <button type="button" className="upgrade-modal__verify" onClick={handleVerifyClick} disabled={isVerifying}>
            {isVerifying ? "Verifying..." : "I've upgraded"}
          </button>
          {verificationComplete && <span className="upgrade-modal__success">Subscription verified!</span>}
          {verificationError && <span className="upgrade-modal__error">{verificationError}</span>}
        </footer>
      </div>
    </div>
  );
};

async function safeJson(response: Response): Promise<Record<string, any> | null> {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

export default UpgradeModal;
