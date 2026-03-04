"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  Camera,
  User,
  Briefcase,
  Phone,
  FileText,
  Mail,
  Building2,
  Save,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
} from "@/api/users/users";
import { compressImage } from "@/lib/utils/imageUtils";
import { useAuth } from "@/components/auth/AuthProvider";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export default function UserSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bio, setBio] = useState("");

  // Confirmation dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const triggerConfirm = (
    title: string,
    description: string,
    onConfirm: () => void
  ) => {
    setConfirmConfig({ title, description, onConfirm });
    setConfirmOpen(true);
  };

  useEffect(() => {
    loadUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await getUserProfile();
      const userData = response.user;
      setName(userData.name || "");
      setEmail(userData.email || "");
      setAvatarUrl(userData.avatar_url || "");
      setJobTitle(userData.job_title || "");
      setDepartment(userData.department || "");
      setPhoneNumber(userData.phone_number || "");
      setBio(userData.bio || "");
    } catch {
      if (user) {
        setName(user.name || "");
        setEmail(user.email || "");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    triggerConfirm(
      "Update Profile",
      "Are you sure you want to update your profile information?",
      async () => {
        try {
          setSaving(true);
          await updateUserProfile({
            name,
            avatar_url: avatarUrl,
            job_title: jobTitle,
            department,
            phone_number: phoneNumber,
            bio,
          });
          toast({
            title: "Profile Updated",
            description: "Your profile has been updated successfully.",
          });
        } catch (err) {
          const errorMessage =
            err && typeof err === "object" && "response" in err
              ? (err as { response?: { data?: { message?: string } } }).response
                  ?.data?.message
              : err && typeof err === "object" && "message" in err
                ? (err as { message?: string }).message
                : undefined;
          toast({
            title: "Update Failed",
            description:
              errorMessage || "Failed to update profile. Please try again.",
            variant: "destructive",
          });
        } finally {
          setSaving(false);
        }
      }
    );
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const compressedFile = await compressImage(file, 800, 800, 0.8);
      const response = await uploadAvatar(compressedFile);
      if (response.avatar_url) {
        setAvatarUrl(response.avatar_url);
        toast({
          title: "Avatar Updated",
          description: "Your profile picture has been updated successfully.",
        });
      }
    } catch {
      toast({
        title: "Update Failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8">
      {/* ── Avatar Block ── */}
      <div className="flex flex-col sm:flex-row items-center gap-5 px-2 py-4">
        {/* Avatar with camera overlay */}
        <div className="relative shrink-0">
          <Avatar className="h-24 w-24 ring-2 ring-[#374151]">
            <AvatarImage
              src={avatarUrl || "/abstract-geometric-shapes.png"}
              alt="User"
              className="object-cover"
            />
            <AvatarFallback className="bg-[#1e293b] text-white text-2xl font-bold">
              {getInitials(name || "User")}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
            className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center border-2 border-[#0B1121] transition-colors disabled:opacity-50"
            title="Change avatar"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5 text-white" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
            disabled={saving}
          />
        </div>

        {/* Name + Email + Role */}
        <div className="text-center sm:text-left min-w-0">
          <p className="text-white text-xl font-bold truncate">{name || "—"}</p>
          <p className="text-gray-400 text-sm truncate">{email}</p>
          {user?.role && (
            <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#4c1d95] text-[#ddd6fe] border border-[#5b21b6] capitalize">
              {user.role}
            </span>
          )}
        </div>
      </div>

      {/* ── Form Card ── */}
      <div className="bg-[#0B1121] border border-[#374151] rounded-2xl p-6 space-y-5">
        <p className="text-white font-semibold text-base border-b border-[#374151] pb-3">
          Profile Information
        </p>

        {/* Name + Job Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-sm flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Full Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
              className="bg-[#11171F] border-[#374151] text-white focus:border-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-sm flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Email
            </Label>
            <Input
              value={email}
              disabled
              className="bg-[#0B1121] border-[#374151] text-gray-500 cursor-not-allowed opacity-60"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-sm flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" /> Job Title
            </Label>
            <Input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              disabled={saving}
              className="bg-[#11171F] border-[#374151] text-white focus:border-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-sm flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Department
            </Label>
            <Input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={saving}
              className="bg-[#11171F] border-[#374151] text-white focus:border-blue-500"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label className="text-gray-400 text-sm flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" /> Phone Number
          </Label>
          <Input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={saving}
            className="bg-[#11171F] border-[#374151] text-white focus:border-blue-500"
          />
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <Label className="text-gray-400 text-sm flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Bio
          </Label>
          <Input
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={saving}
            placeholder="Tell us about yourself"
            className="bg-[#11171F] border-[#374151] text-white focus:border-blue-500"
          />
        </div>

        {/* Save */}
        <Button
          onClick={handleSaveProfile}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Profile
            </>
          )}
        </Button>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        description={confirmConfig.description}
      />
    </div>
  );
}
