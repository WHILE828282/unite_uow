/* Live sign-in (emailed 6-digit codes) is for UOWD campus accounts only. The demo account stays open to everyone. */
export const isCampusEmail = (email) => /^[^\s@]+@(uowdubai\.ac\.ae|uowmail\.edu\.au|uow\.edu\.au|uniteuow\.com)$/i.test(String(email || "").trim());
export const RESTRICTED_MSG = "Unite is for UOWD students. Use your @uowmail.edu.au or @uowdubai.ac.ae email.";
