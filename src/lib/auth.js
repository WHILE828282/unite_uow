/* Live sign-in (emailed 6-digit codes) is for UOWD campus accounts only. The demo account stays open to everyone. */
export const CAMPUS_DOMAINS = ["uowdubai.ac.ae", "uniteuow.com"];
export const isCampusEmail = (email) => /^[^\s@]+@(uowdubai\.ac\.ae|uniteuow\.com)$/i.test(String(email || "").trim());
export const RESTRICTED_MSG = "🔒 Access Restricted: Unite is an exclusive secure ecosystem for verified UOWD campus members only.";
