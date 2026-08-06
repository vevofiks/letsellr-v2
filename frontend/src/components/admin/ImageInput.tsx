import React, { useEffect, useMemo, useRef, useState } from "react";
import { Upload, Link2, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";

const MAX_FILE_MB = 5;

type Props = {
  label?: string;
  /** URL typed/pasted by the admin. */
  imageUrl: string;
  /** File chosen by the admin, uploaded after the record is saved. */
  imageFile: File | null;
  /** Image already stored on the record (edit mode). */
  existingUrl?: string | null;
  onUrlChange: (url: string) => void;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
};

/**
 * Image picker offering both ways to set an image: paste a URL, or upload a
 * file. The two are mutually exclusive — choosing one clears the other, so
 * there is never a question of which will win once saved.
 */
export const ImageInput: React.FC<Props> = ({
  label = "Image",
  imageUrl,
  imageFile,
  existingUrl,
  onUrlChange,
  onFileChange,
  disabled = false,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const filePreview = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile]);
  // Object URLs must be revoked or they leak for the life of the document.
  useEffect(() => () => { if (filePreview) URL.revokeObjectURL(filePreview); }, [filePreview]);

  // Remember which URL failed rather than resetting a flag on every change —
  // a new URL is then automatically "not broken" with no effect needed.
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);
  const urlBroken = brokenUrl !== null && brokenUrl === imageUrl.trim();

  const handleFile = (file: File | null) => {
    if (!file) { onFileChange(null); return; }
    if (!file.type.startsWith("image/")) {
      toast.error("That file isn't an image.");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_FILE_MB}MB.`);
      return;
    }
    onFileChange(file);
    onUrlChange(""); // a file replaces any pasted URL
  };

  const handleUrl = (value: string) => {
    onUrlChange(value);
    if (value.trim() && imageFile) clearFile(); // a URL replaces any chosen file
  };

  const clearFile = () => {
    onFileChange(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const clearAll = () => {
    clearFile();
    onUrlChange("");
  };

  const preview = filePreview || (imageUrl.trim() && !urlBroken ? imageUrl.trim() : null) || existingUrl || null;
  const hasSelection = Boolean(imageFile || imageUrl.trim());

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase text-slate-400 block">{label}</label>

      <div className="flex items-start gap-3">
        {/* Preview */}
        <div className="h-16 w-16 shrink-0 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="h-full w-full object-cover"
              onError={() => { if (!filePreview) setBrokenUrl(imageUrl.trim()); }}
            />
          ) : (
            <ImageIcon className="h-5 w-5 text-slate-300" />
          )}
        </div>

        <div className="flex-1 space-y-2 min-w-0">
          {/* Paste a URL */}
          <div className="relative">
            <Link2 className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="url"
              value={imageUrl}
              disabled={disabled}
              onChange={e => handleUrl(e.target.value)}
              placeholder="Paste image URL (https://...)"
              className="w-full bg-slate-50 border border-slate-200/80 rounded-lg pl-8 pr-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#014645] disabled:opacity-50"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-slate-300 shrink-0">or</span>

            {/* Upload a file */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors disabled:opacity-50 shrink-0"
            >
              <Upload className="h-3.5 w-3.5" />
              {imageFile ? "Change file" : "Upload file"}
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => handleFile(e.target.files?.[0] || null)}
            />

            {hasSelection && (
              <button
                type="button"
                onClick={clearAll}
                className="flex items-center gap-1 text-slate-400 hover:text-rose-600 text-[11px] font-bold cursor-pointer transition-colors shrink-0"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>

          {imageFile && (
            <p className="text-[10.5px] font-semibold text-[#014645] truncate my-0">
              {imageFile.name} — uploads on save
            </p>
          )}
          {urlBroken && !imageFile && (
            <p className="text-[10.5px] font-semibold text-amber-600 my-0">
              Couldn't load that URL — it will still be saved as entered.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
