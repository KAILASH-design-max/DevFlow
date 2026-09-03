export const metadata = {
  title: "Privacy Policy | DevFlow",
  description: "DevFlow Privacy Policy and Data Handling.",
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <h2>1. What We Collect</h2>
      <p>
        We collect the following types of information to provide and improve DevFlow:
      </p>
      <ul>
        <li><strong>Authentication Data:</strong> OAuth tokens, email addresses, and login credentials via Firebase Authentication.</li>
        <li><strong>Profile Information:</strong> Name, avatar, and user preferences.</li>
        <li><strong>Workspace & Project Data:</strong> Issue descriptions, comments, agile board states, and project metadata.</li>
        <li><strong>Uploaded Files:</strong> Attachments and images uploaded to issues (stored in Firebase Storage).</li>
        <li><strong>GitHub Integration Data:</strong> Repository names, branch metadata, pull request titles, and commit hashes.</li>
        <li><strong>AI Prompts:</strong> Text submitted when using our AI-assisted features.</li>
        <li><strong>Technical Logs:</strong> Device information, IP addresses, and security logs for fraud prevention.</li>
      </ul>

      <h2>2. Why We Collect It</h2>
      <p>
        Your data is used to provide the core functionalities of DevFlow, such as rendering your Kanban boards, syncing GitHub PR statuses, facilitating team collaboration, and providing AI-generated insights. Logs are used to maintain security and monitor application performance.
      </p>

      <h2>3. How We Store It</h2>
      <p>
        Data is stored securely using industry-standard infrastructure. 
        User accounts, workspaces, and issue data are stored in Firebase Firestore. 
        Uploaded files are stored in Firebase Storage. 
        Authentication is handled securely by Firebase Auth.
      </p>

      <h2>4. Who Can Access It</h2>
      <p>
        Your workspace data is only accessible to authenticated users who have been explicitly invited to your workspace. 
        Our engineering team may access minimal logs strictly for debugging and security auditing purposes. 
        We do not sell your data to third parties.
      </p>

      <h2>5. Important Note on Payment Information</h2>
      <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg my-4 text-blue-100">
        <p className="m-0 font-medium">
          <strong>DevFlow does not store payment-card information.</strong>
        </p>
        <p className="m-0 text-sm mt-2 opacity-90">
          All sensitive payment data (credit card numbers, CVCs) is processed directly by our secure third-party payment provider (e.g., Stripe). DevFlow only retains the provider's subscription IDs, transaction references, and basic display information (like the last 4 digits of a card) necessary for billing management.
        </p>
      </div>

      <h2>6. Third-Party Providers</h2>
      <p>
        We share necessary data with authorized third-party service providers to operate DevFlow:
      </p>
      <ul>
        <li><strong>Google Cloud/Firebase:</strong> For hosting, database, and authentication.</li>
        <li><strong>AI Providers:</strong> To process AI features (prompts are sent securely and are not used to train global models).</li>
        <li><strong>GitHub:</strong> When you connect a repository, we communicate with GitHub's APIs on your behalf.</li>
      </ul>

      <h2>7. Data Retention</h2>
      <p>
        We retain your data for as long as your account is active or as needed to provide you the services. Logs are automatically rotated and deleted after 30 days.
      </p>

      <h2>8. Cookies and Local Storage</h2>
      <p>
        We use essential cookies and local storage (such as <code>accessToken</code>) strictly to maintain your session and save UI preferences (like collapsed sidebars). We do not use third-party tracking cookies. Please see our <a href="/legal/cookies">Cookies Policy</a> for more details.
      </p>

      <h2>9. Your Rights & How to Request Deletion</h2>
      <p>
        You have the right to access, correct, or delete your personal data. 
        You can request full account deletion by contacting us at <strong>privacy@devflow.com</strong>. Upon verification, we will permanently delete your user profile and all associated data within 30 days.
      </p>
    </>
  );
}
