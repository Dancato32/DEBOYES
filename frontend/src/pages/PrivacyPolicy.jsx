import React from 'react';
import BottomNav from '../components/BottomNav';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen pb-32 bg-slate-50 text-slate-800">
      <div className="mx-auto max-w-3xl px-6 pt-16">
        <header className="mb-12">
          <h1 className="text-4xl font-bold font-poppins text-slate-900 tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-slate-500 font-inter">Effective Date: April 23, 2026</p>
        </header>

        <article className="space-y-8 font-inter text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">1. Information We Collect</h2>
            <p>
              At De Boye's, we collect information to provide better services to all our users. This includes:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li><strong>Account Information:</strong> Your name, email address, phone number, and password when you register.</li>
              <li><strong>Location Data:</strong> For riders, we collect real-time location data to manage deliveries. For customers, we collect delivery addresses.</li>
              <li><strong>Usage Information:</strong> Data about how you interact with our app, including order history and preferences.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">2. How We Use Information</h2>
            <p>
              We use the collected data to process orders, manage delivery logistics, and provide customer support. We do not sell your personal data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">3. Data Deletion</h2>
            <p>
              You have the right to delete your account and all associated personal data at any time. You can find the "Delete Account" option in your Profile settings. Once initiated, this action is permanent and cannot be undone.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">4. Security</h2>
            <p>
              We implement industry-standard security measures, including HTTPS encryption and secure token storage, to protect your personal information.
            </p>
          </section>

          <section className="pt-8 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              If you have any questions about this Privacy Policy, please contact our support team at support@deboyes.com.
            </p>
          </section>
        </article>
      </div>
      <BottomNav />
    </div>
  );
}
