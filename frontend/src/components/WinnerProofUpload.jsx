import { useState } from 'react';
import { winnerAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Upload, CheckCircle } from 'lucide-react';

export default function WinnerProofUpload({ winnerId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(f.type)) {
      toast.error('Only JPEG, PNG, WebP images and PDFs are allowed.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB.');
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await winnerAPI.uploadProof(winnerId, file);
      setUploaded(true);
      toast.success('Proof uploaded! Awaiting admin review.');
      onUploaded?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (uploaded) {
    return (
      <div className="flex items-center gap-2 text-green-400 text-sm">
        <CheckCircle className="w-4 h-4" />
        Proof submitted — awaiting verification
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm text-gray-400 mb-1">
        Upload proof of eligibility (subscription screenshot, etc.)
      </label>
      <div className="flex gap-2">
        <label className="flex-1 flex items-center gap-2 bg-gray-800 border border-gray-700 border-dashed rounded-lg px-3 py-2 cursor-pointer hover:border-green-600 transition-colors">
          <Upload className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400 truncate">
            {file ? file.name : 'Choose file…'}
          </span>
          <input
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
          />
        </label>
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="btn-primary py-2 px-4 text-sm"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      <p className="text-xs text-gray-500">Max 5MB · JPEG, PNG, WebP, PDF</p>
    </div>
  );
}
