import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function PrivacyPolicyPage() {
  return (
    <AppLayout>
      <AppHeader title="Privacy Policy" showBack />

      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-4">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Introduction</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our school management application. Please read this privacy policy carefully. By using the application, you agree to the collection and use of information in accordance with this policy.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium text-foreground text-sm mb-1">Personal Information</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We collect personal information such as student names, parent/guardian contact details, email addresses, and phone numbers necessary for school communication.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground text-sm mb-1">Academic Records</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We store academic records including grades, attendance data, report cards, and performance assessments to provide educational services.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground text-sm mb-1">Device Information</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We may collect device information such as device type, operating system, and unique device identifiers for security and optimization purposes.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>To facilitate communication between parents, students, and the school</li>
                <li>To provide academic progress updates and notifications</li>
                <li>To manage attendance records and reporting</li>
                <li>To send important school announcements and event reminders</li>
                <li>To improve our services and user experience</li>
                <li>To ensure the security of our platform</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Data Security</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All data is encrypted in transit and at rest using industry-standard encryption protocols.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Data Sharing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as required by law or as necessary to provide our services. We may share data with authorized school personnel and educational service providers under strict confidentiality agreements.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Your Rights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>Access and review your personal information</li>
                <li>Request corrections to inaccurate data</li>
                <li>Request deletion of your data (subject to legal requirements)</li>
                <li>Opt-out of non-essential communications</li>
                <li>Export your data in a portable format</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If you have questions about this Privacy Policy or our data practices, please contact us at privacy@school.edu or through the Support section in the app.
              </p>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center pb-4">
            Last updated: January 2026
          </p>
        </div>
      </ScrollArea>
    </AppLayout>
  );
}
