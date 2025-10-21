import { FiMail } from "react-icons/fi";

const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <div className="prose prose-lg">
        <h2 className="text-2xl font-semibold mb-4">Privacy Policy for Fekra Educational App</h2>
        <p className="text-sm opacity-75 mb-8"><strong>Effective Date:</strong> 01/5/2025</p>

        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4">1. Information We Collect</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Personal Information:</strong> Name, email address, phone number, 
              and profile data when you register or update your account.
            </li>
            <li>
              <strong>Educational Data:</strong> Your activity in the app, such as lessons viewed, 
              quizzes taken, and progress tracking.
            </li>
            <li>
              <strong>Device Information:</strong> Information such as device type, 
              operating system, and crash logs.
            </li>
            <li className="italic">
              <strong>Camera Access:</strong> Only used for QR code scanning to authenticate 
              or log in at live events.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4">2. How We Use Your Information</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Create and manage user accounts</li>
            <li>Deliver personalized educational content and track user progress</li>
            <li>Facilitate secure logins and event attendance via QR scanning</li>
            <li>Provide customer support and send important notifications</li>
            <li>Improve the platform's features and content based on user engagement</li>
          </ul>
        </section>

        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4">3. Data Sharing</h3>
          <p className="mb-4">
            We do <strong>not</strong> sell or rent your personal data. Your information may 
            be shared only in these circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>With program facilitators or mentors for educational coordination</li>
            <li>With service providers that support our app infrastructure (under strict data protection agreements)</li>
            <li>As required by law, such as to comply with legal obligations or protect user rights</li>
          </ul>
        </section>

        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4">4. Data Security</h3>
          <p>
            We use standard encryption and access controls to safeguard your personal data. 
            While we strive to protect your data, no method of transmission or storage is 100% secure.
          </p>
        </section>

        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4">5. Your Rights and Choices</h3>
          <p className="mb-2">You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access or correct your personal information</li>
            <li>Request deletion of your data, subject to any legal obligations we must follow</li>
            <li>Opt out of non-essential notifications or communications</li>
          </ul>
          <p className="mt-4">
            You can exercise these rights by contacting us using the information below.
          </p>
        </section>

        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4">6. Children's Privacy</h3>
          <p>
            Fekra is intended for users aged 13 and above. If you believe a child has provided 
            us with personal information, please contact us and we will take appropriate steps 
            to delete the data.
          </p>
        </section>

        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4">7. Updates to This Policy</h3>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of changes 
            by posting the revised policy with an updated "Effective Date" on this page.
          </p>
        </section>

        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4">8. Contact Us</h3>
          <div className="flex items-center gap-2 text-primary">
            <FiMail className="w-5 h-5" />
            <a 
              href="mailto:info@Fekra-edu.com" 
              className="hover:underline"
            >
              info@mavoid.com
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;