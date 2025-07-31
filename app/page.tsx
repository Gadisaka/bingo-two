"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, Phone } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/components/AuthContext";

const roles = ["Admin", "Agent", "Cashier"] as const;

export default function LoginPage() {
  const [selectedRole, setSelectedRole] =
    useState<(typeof roles)[number]>("Cashier");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);
  const { user, loading, login } = useAuth();
  const router = useRouter();

  // Redirect authenticated user away from login page
  useEffect(() => {
    if (!loading && user) {
      // router.replace(`/${user.role.toLowerCase()}`); // e.g., /cashier
      router.replace(
        `/${user.role.toLowerCase()}${
          user.role.toLowerCase() === "cashier" ? "/game" : ""
        }`
      );
    }
  }, [user, loading, router]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 15) {
      setPhone(value);
    }
  };

  const handleLogin = async () => {
    if (!phone || phone.length < 8) {
      toast.error("Please enter a valid phone number");
      return;
    }

    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setLoadingLogin(true);
    try {
      const { success, message } = await login(
        phone,
        password,
        selectedRole.toLowerCase()
      );

      if (success) {
        toast.success(`Welcome, ${selectedRole}`);
        router.push(`/${selectedRole.toLowerCase()}`);
      } else {
        toast.error(message || "Login failed");
      }
    } catch (error) {
      toast.error("An error occurred during login");
    } finally {
      setLoadingLogin(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#1b2433]">
      {/* Left Branding Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-green-400">
        <div className="max-w-md text-center space-y-6">
          {/* <Image
            src="/EthioStar.png"
            className="object-cover"
            alt="logo"
            width={400}
            height={300}
          /> */}
          <h1 className="text-5xl font-bold text-yellow-300 font-acme">
            Bingo
          </h1>
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-md bg-[#1b2433] border-t-4 border-green-400">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto bg-white/10 flex items-center justify-center rounded-full mb-2">
                <Lock className="text-white w-5 h-5" />
              </div>
              <h2 className="text-white text-2xl font-bold">Secure Login</h2>
              <p className="text-gray-400 text-sm">
                Authenticate with your credentials
              </p>
            </div>

            <div className="space-y-5">
              {/* Role Dropdown */}
              <div>
                <label className="block mb-2 text-sm font-medium text-white">
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) =>
                    setSelectedRole(e.target.value as (typeof roles)[number])
                  }
                  className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phone Input */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <Phone className="text-gray-400 w-5 h-5" />
                </div>
                <Input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder="Phone number"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <Lock className="text-gray-400 w-5 h-5" />
                </div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500 "
                />
              </div>

              {/* Submit Button */}
              <Button
                className="w-full text-white font-medium bg-green-400"
                onClick={handleLogin}
                disabled={loadingLogin}
              >
                {loadingLogin ? "Signing In..." : `Sign In as ${selectedRole}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
