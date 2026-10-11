
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  X,
  User,
  Mail,
  Upload,
  LoaderCircle,
} from "lucide-react";
import api from "../services/api";

function EditProfileModal({
  isOpen,
  onClose,
  user,
  onProfileUpdated,
}) {
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    profile_photo: null,
  });

  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !user) return;

    setFormData({
      full_name: user.full_name || user.name || "",
      email: user.email || "",
      profile_photo: user.profile_photo || null,
    });

    setPreview(user.profile_photo || "");
    setError("");
  }, [isOpen, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Please select an image smaller than 2 MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const image = reader.result;

      setPreview(image);

      setFormData((previous) => ({
        ...previous,
        profile_photo: image,
      }));

      setError("");
    };

    reader.onerror = () => {
      setError("Could not read the selected image.");
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?.id) {
      setError("User information is missing. Please log in again.");
      return;
    }

    if (!formData.full_name.trim() || !formData.email.trim()) {
      setError("Please enter your full name and email.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await api.put(`/users/${user.id}`, {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        profile_photo: formData.profile_photo,
      });

      const updatedUser = response.data.user;

      // Keep compatibility with pages that use either property.
      const normalizedUser = {
        ...user,
        ...updatedUser,
        name: updatedUser.full_name,
        full_name: updatedUser.full_name,
      };

      localStorage.setItem(
        "user",
        JSON.stringify(normalizedUser)
      );

      onProfileUpdated(normalizedUser);
      onClose();
    } catch (err) {
      console.error("Profile update failed:", err);

      setError(
        err.response?.data?.message ||
        "Could not save your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Edit your profile
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Update your personal information.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close edit profile"
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6 flex flex-col items-center">
            <div className="relative">
              {preview ? (
                <img
                  src={preview}
                  alt="Profile preview"
                  className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-lg"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                  <User size={42} />
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 rounded-full bg-violet-600 p-3 text-white shadow-lg transition hover:bg-violet-700"
                aria-label="Choose profile photo"
              >
                <Camera size={17} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900"
            >
              <Upload size={15} />
              Upload profile photo
            </button>

            <p className="mt-1 text-xs text-slate-400">
              JPG, PNG or other image formats · Max 2 MB
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="profile-full-name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Full name
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100">
                <User size={18} className="text-slate-400" />

                <input
                  id="profile-full-name"
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  maxLength={100}
                  required
                  placeholder="Enter your full name"
                  className="w-full py-3 outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="profile-email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email address
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100">
                <Mail size={18} className="text-slate-400" />

                <input
                  id="profile-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  maxLength={100}
                  required
                  placeholder="Enter your email"
                  className="w-full py-3 outline-none"
                />
              </div>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <div className="mt-7 flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && (
                <LoaderCircle size={18} className="animate-spin" />
              )}

              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;
