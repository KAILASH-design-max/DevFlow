export const metadata = {
  title: "Cookies Policy | DevFlow",
  description: "DevFlow Cookies and Local Storage Policy.",
};

export default function CookiesPage() {
  return (
    <>
      <h1>Cookies & Local Storage Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <p>
        DevFlow uses strictly necessary cookies and local storage mechanisms to ensure our platform functions correctly, maintains your security, and remembers your preferences. 
      </p>

      <h2>1. What We Use</h2>
      <ul>
        <li><strong>Authentication Tokens:</strong> We store JWT (JSON Web Tokens) and Firebase Auth identifiers in your browser's local storage and/or secure cookies. These are strictly necessary to keep you logged in and securely verify your requests to our API.</li>
        <li><strong>UI Preferences:</strong> We store non-sensitive UI states in local storage, such as whether your sidebar is collapsed or your preferred theme (dark/light mode). This ensures a consistent experience across sessions.</li>
        <li><strong>CSRF Tokens:</strong> We may use temporary cookies to protect forms and API endpoints from Cross-Site Request Forgery attacks.</li>
      </ul>

      <h2>2. What We Don't Use</h2>
      <ul>
        <li><strong>No Third-Party Advertising Cookies:</strong> We do not use advertising or tracking cookies to follow you across the web.</li>
        <li><strong>No Invasive Analytics:</strong> We do not sell your browsing data. Any analytics used are strictly first-party and anonymized to improve platform performance.</li>
      </ul>

      <h2>3. Managing Local Storage</h2>
      <p>
        Because our use of local storage and cookies is strictly necessary for the core functionality of DevFlow (such as logging in), you cannot opt-out of them while using the service. If you wish to clear them, you can do so by logging out of DevFlow, which will automatically clear your session tokens, or by manually clearing your browser data.
      </p>
      
      <p>
        Note: Disabling cookies or local storage in your browser settings will prevent you from logging into and using DevFlow entirely.
      </p>
    </>
  );
}
