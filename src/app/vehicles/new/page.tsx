'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Shell from '@/components/Shell';

interface ParsedExtras {
  loan: {
    lender: string | null;
    originalAmount: number | null;
    currentBalance: number | null;
    apr: number | null;
    termMonths: number | null;
    monthlyPayment: number | null;
    startDate: string | null;
  } | null;
  warranties: Array<{
    type: string;
    provider: string | null;
    expirationDate: string | null;
    expirationMileage: number | null;
    cost: number | null;
  }>;
  insurance: {
    provider: string | null;
    policyNumber: string | null;
    coverageType: string;
    monthlyPremium: number | null;
    deductible: number | null;
    startDate: string | null;
    endDate: string | null;
  } | null;
}

export default function NewVehiclePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedExtras, setParsedExtras] = useState<ParsedExtras | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [vinInput, setVinInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    year: new Date().getFullYear(),
    make: '',
    model: '',
    trim: '',
    vin: '',
    mileage: 0,
    annualMiles: 12000,
    purchasePrice: 0,
    purchaseDate: new Date().toISOString().slice(0, 10),
    color: '',
    imageUrl: '',
  });

  function update(field: string, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleDocumentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    setParseError(null);
    setParsedExtras(null);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/parse-document', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setParseError(data.error || 'Failed to parse document.');
        return;
      }
      // Fill vehicle form fields from extracted data
      const v = data.vehicle ?? {};
      setForm((f) => ({
        ...f,
        vin: v.vin || f.vin,
        year: v.year || f.year,
        make: v.make || f.make,
        model: v.model || f.model,
        trim: v.trim || f.trim,
        color: v.color || f.color,
        mileage: v.mileage || f.mileage,
        purchasePrice: v.purchasePrice || f.purchasePrice,
        purchaseDate: v.purchaseDate || f.purchaseDate,
      }));
      // Store extras for after vehicle creation
      setParsedExtras({
        loan: data.loan ?? null,
        warranties: data.warranties ?? [],
        insurance: data.insurance ?? null,
      });
    } catch {
      setParseError('Could not connect to document parser.');
    } finally {
      setParsing(false);
      // Reset the file input
      e.target.value = '';
    }
  }

  async function decodeVin() {
    const vin = vinInput.trim();
    if (vin.length !== 17) {
      setDecodeError('VIN must be exactly 17 characters.');
      return;
    }
    setDecoding(true);
    setDecodeError(null);
    try {
      const res = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${encodeURIComponent(vin)}?format=json`
      );
      if (!res.ok) throw new Error('NHTSA lookup failed');
      const data = await res.json();
      const r = data.Results?.[0];
      if (!r || r.ErrorCode !== '0') {
        setDecodeError('Could not decode VIN. Please check and try again.');
        return;
      }
      setForm((f) => ({
        ...f,
        vin,
        year: parseInt(r.ModelYear) || f.year,
        make: r.Make ? r.Make.charAt(0).toUpperCase() + r.Make.slice(1).toLowerCase() : f.make,
        model: r.Model || f.model,
        trim: r.Trim || f.trim,
      }));
    } catch {
      setDecodeError('VIN lookup failed. Check your connection and try again.');
    } finally {
      setDecoding(false);
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (res.ok) {
      const data = await res.json();
      setImagePreview(data.url);
      update('imageUrl', data.url);
    }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      setLoading(false);
      return;
    }

    const vehicle = await res.json();

    // Auto-create loan, warranties, insurance from parsed document
    if (parsedExtras) {
      const base = `/api/vehicles/${vehicle.id}`;
      const extras: Promise<unknown>[] = [];

      if (parsedExtras.loan?.originalAmount) {
        extras.push(
          fetch(`${base}/loan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsedExtras.loan),
          })
        );
      }

      for (const w of parsedExtras.warranties) {
        extras.push(
          fetch(`${base}/warranty`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(w),
          })
        );
      }

      if (parsedExtras.insurance?.provider) {
        extras.push(
          fetch(`${base}/insurance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsedExtras.insurance),
          })
        );
      }

      await Promise.allSettled(extras);
    }

    router.push(`/vehicles/${vehicle.id}`);
  }

  const extrasCount = parsedExtras
    ? (parsedExtras.loan ? 1 : 0) + parsedExtras.warranties.length + (parsedExtras.insurance ? 1 : 0)
    : 0;

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-white mb-6">Add New Vehicle</h1>

      <form onSubmit={handleSubmit} className="card p-6 max-w-2xl space-y-4">
        {/* Document parse */}
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4">
          <p className="text-xs text-indigo-300 mb-1 font-medium uppercase tracking-wide">Auto-fill from purchase documents</p>
          <p className="text-xs text-gray-500 mb-3">Upload your title application, purchase contract, or loan paperwork — we&apos;ll extract everything automatically.</p>
          <label className={`btn-secondary cursor-pointer text-sm inline-flex items-center gap-2 ${parsing ? 'opacity-60 pointer-events-none' : ''}`}>
            {parsing ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                Parsing document…
              </>
            ) : (
              <>
                <span>📄</span> Upload PDF or Image
              </>
            )}
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleDocumentUpload}
              disabled={parsing}
            />
          </label>
          {parseError && <p className="text-xs text-red-400 mt-2">{parseError}</p>}
          {parsedExtras && !parseError && (
            <div className="mt-3 text-xs text-emerald-400 space-y-0.5">
              <p className="font-medium">✓ Document parsed — fields auto-filled</p>
              {parsedExtras.loan?.originalAmount && (
                <p className="text-gray-400">· Loan: {parsedExtras.loan.lender ?? 'Unknown lender'} · ${parsedExtras.loan.originalAmount?.toLocaleString()} @ {parsedExtras.loan.apr}% APR</p>
              )}
              {parsedExtras.warranties.length > 0 && (
                <p className="text-gray-400">· {parsedExtras.warranties.length} warranty/protection plan{parsedExtras.warranties.length > 1 ? 's' : ''}: {parsedExtras.warranties.map(w => w.type).join(', ')}</p>
              )}
              {parsedExtras.insurance?.provider && (
                <p className="text-gray-400">· Insurance: {parsedExtras.insurance.provider} · {parsedExtras.insurance.coverageType}</p>
              )}
              {extrasCount > 0 && (
                <p className="text-indigo-300 mt-1">{extrasCount} record{extrasCount > 1 ? 's' : ''} will be auto-created when you save.</p>
              )}
            </div>
          )}
        </div>

        {/* VIN decode */}
        <div className="bg-surface-800/60 border border-surface-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Quick fill from VIN</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={vinInput}
              onChange={(e) => { setVinInput(e.target.value.toUpperCase()); setDecodeError(null); }}
              placeholder="Enter 17-character VIN"
              maxLength={17}
              className="w-full font-mono text-sm"
            />
            <button
              type="button"
              onClick={decodeVin}
              disabled={decoding || vinInput.trim().length === 0}
              className="btn-secondary shrink-0 text-sm"
            >
              {decoding ? 'Looking up…' : 'Decode'}
            </button>
          </div>
          {decodeError && <p className="text-xs text-red-400 mt-1.5">{decodeError}</p>}
          {!decodeError && form.vin && (
            <p className="text-xs text-emerald-400 mt-1.5">✓ VIN decoded — fields auto-filled below</p>
          )}
          <p className="text-xs text-gray-600 mt-1.5">Powered by NHTSA · No account required</p>
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Photo</label>
          <div className="flex items-center gap-4">
            <div className="relative w-32 h-24 rounded-lg overflow-hidden bg-surface-700 flex items-center justify-center shrink-0">
              {imagePreview ? (
                <Image src={imagePreview} alt="Vehicle preview" fill className="object-cover" />
              ) : (
                <span className="text-3xl text-surface-500">🚗</span>
              )}
            </div>
            <div>
              <label className="btn-secondary cursor-pointer">
                {uploading ? 'Uploading...' : 'Choose Photo'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={handleImageChange}
                  disabled={uploading}
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">JPEG, PNG or WebP, max 5 MB</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Year</label>
            <input
              type="number"
              value={form.year}
              onChange={(e) => update('year', parseInt(e.target.value))}
              className="w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Make</label>
            <input
              type="text"
              value={form.make}
              onChange={(e) => update('make', e.target.value)}
              className="w-full"
              placeholder="e.g. BMW"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Model</label>
            <input
              type="text"
              value={form.model}
              onChange={(e) => update('model', e.target.value)}
              className="w-full"
              placeholder="e.g. M3 Competition"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Trim</label>
            <input
              type="text"
              value={form.trim}
              onChange={(e) => update('trim', e.target.value)}
              className="w-full"
              placeholder="e.g. xDrive"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">VIN</label>
            <input
              type="text"
              value={form.vin}
              onChange={(e) => update('vin', e.target.value.toUpperCase())}
              className={`w-full font-mono text-sm ${form.vin ? 'text-emerald-400' : ''}`}
              placeholder="Auto-filled above"
              maxLength={17}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Color</label>
            <input
              type="text"
              value={form.color}
              onChange={(e) => update('color', e.target.value)}
              className="w-full"
              placeholder="e.g. Alpine White"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Current Mileage</label>
            <input
              type="number"
              value={form.mileage}
              onChange={(e) => update('mileage', parseInt(e.target.value))}
              className="w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Annual Miles</label>
            <input
              type="number"
              value={form.annualMiles}
              onChange={(e) => update('annualMiles', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Purchase Price ($)</label>
            <input
              type="number"
              value={form.purchasePrice}
              onChange={(e) => update('purchasePrice', parseFloat(e.target.value))}
              className="w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Purchase Date</label>
            <input
              type="date"
              value={form.purchaseDate}
              onChange={(e) => update('purchaseDate', e.target.value)}
              className="w-full"
              required
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary" disabled={loading || uploading || parsing}>
            {loading ? 'Adding…' : extrasCount > 0 ? `Add Vehicle + ${extrasCount} record${extrasCount > 1 ? 's' : ''}` : 'Add Vehicle'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => router.back()}>
            Cancel
          </button>
        </div>
      </form>
    </Shell>
  );
}
