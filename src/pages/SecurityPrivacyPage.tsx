import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Shield, Lock, Eye, Smartphone, Bell, Key, Fingerprint, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
export default function SecurityPrivacyPage() {
  const navigate = useNavigate();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);
  const [activityVisible, setActivityVisible] = useState(true);
  return <AppLayout>
      <AppHeader title="Security & Privacy" showBack />

      <div className="px-4 py-4 space-y-4">
        {/* Security Section */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-0">
            {/* Two-Factor Authentication */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground text-sm">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                </div>
              </div>
              <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
            </div>
            <Separator />

            {/* Biometric Login */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Fingerprint className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground text-sm">Biometric Login</p>
                  <p className="text-xs text-muted-foreground">Use fingerprint or face ID</p>
                </div>
              </div>
              <Switch checked={biometricEnabled} onCheckedChange={setBiometricEnabled} />
            </div>
            <Separator />

            {/* Login Alerts */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground text-sm">Login Alerts</p>
                  <p className="text-xs text-muted-foreground">Get notified of new logins</p>
                </div>
              </div>
              <Switch checked={loginAlerts} onCheckedChange={setLoginAlerts} />
            </div>
            <Separator />

            {/* Change Password */}
            <button className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium text-foreground text-sm">Change Password</p>
                  <p className="text-xs text-muted-foreground">Last changed 30 days ago</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
            <Separator />

            {/* Active Sessions */}
            <button className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium text-foreground text-sm">Active Sessions</p>
                  <p className="text-xs text-muted-foreground">2 devices logged in</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>

        {/* Privacy Section */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-0">
            {/* Data Sharing */}
            
            <Separator />

            {/* Activity Visibility */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium text-foreground text-sm">Activity Visibility</p>
                  <p className="text-xs text-muted-foreground">Let teachers see your activity status</p>
                </div>
              </div>
              <Switch checked={activityVisible} onCheckedChange={setActivityVisible} />
            </div>
            <Separator />

            {/* Privacy Policy */}
            <button onClick={() => navigate('/privacy-policy')} className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors">
              <p className="font-medium text-foreground text-sm">Privacy Policy</p>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
            <Separator />

            {/* Terms of Service */}
            
          </CardContent>
        </Card>

      </div>
    </AppLayout>;
}