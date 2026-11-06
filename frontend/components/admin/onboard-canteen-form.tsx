'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/api-client';
import { Field } from '@/components/auth/field';
import { ImageUploadField } from '@/components/ui/image-upload-field';
import { InviteLinkCard } from '@/components/admin/invite-link-card';
import type { AdminCanteen } from '../../../shared/src/types/canteen.types';
import type { ProvisionResult } from '../../../shared/src/types/user.types';

const INITIAL = {
  // Canteen
  name: '',
  description: '',
  location: '',
  image: '',
  open: '08:00',
  close: '22:00',
  // Owner
  ownerName: '',
  ownerEmail: '',
  ownerPhone: '',
};

type FormErrors = Partial<Record<keyof typeof INITIAL, string>>;
const TIME = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

interface OnboardSuccessData {
  canteen: AdminCanteen;
  ownerResult: ProvisionResult;
}

export function OnboardCanteenForm({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successData, setSuccessData] = useState<OnboardSuccessData | null>(null);
  const [createdCanteen, setCreatedCanteen] = useState<AdminCanteen | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      // 1. Create the Canteen (or reuse if already created on a prior attempt)
      const canteen =
        createdCanteen ||
        (await adminApi.createCanteen({
          name: form.name.trim(),
          description: form.description.trim(),
          location: form.location.trim(),
          image: form.image.trim(),
          openingHours: { open: form.open, close: form.close },
        }));
      setCreatedCanteen(canteen);

      // 2. Provision and link the Owner to this new canteen
      const ownerResult = await adminApi.provisionUser({
        name: form.ownerName.trim(),
        email: form.ownerEmail.trim(),
        phone: form.ownerPhone.trim(),
        role: 'owner',
        canteenId: canteen._id,
        staffDuties: [],
        permissions: [],
      });

      return { canteen, ownerResult };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-canteens'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`“${data.canteen.name}” onboarded successfully!`);
      setSuccessData(data);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to complete onboarding.'));
    },
  });

  function update(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const next: FormErrors = {};

    // Canteen validations
    if (!form.name.trim()) next.name = 'Canteen name is required.';
    if (!form.description.trim()) next.description = 'Add a short description or tagline.';
    if (!form.location.trim()) next.location = 'Specify the campus location / block.';
    if (!TIME.test(form.open)) next.open = 'Use HH:MM format (e.g. 08:00).';
    if (!TIME.test(form.close)) next.close = 'Use HH:MM format (e.g. 22:00).';

    // Owner validations
    if (!form.ownerName.trim()) next.ownerName = 'Owner full name is required.';
    if (!form.ownerEmail.trim()) next.ownerEmail = 'Owner email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.ownerEmail)) next.ownerEmail = 'Enter a valid email address.';
    if (!/^\d{10}$/.test(form.ownerPhone.trim())) next.ownerPhone = 'Enter a 10-digit mobile number.';

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate();
  }

  // Once successfully onboarded, display confirmation with copyable link
  if (successData) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900">
          <p className="font-bold text-sm">🎉 Canteen & Partner Successfully Onboarded</p>
          <p className="mt-1 text-emerald-800">
            <strong>{successData.canteen.name}</strong> has been created, and an invitation has been
            dispatched to owner <strong>{successData.ownerResult.user.name}</strong> ({successData.ownerResult.user.email}).
          </p>
        </div>

        <div className="rounded-xl border border-line bg-surface/50 p-4 space-y-2 text-xs">
          <div className="flex justify-between items-center text-ink font-medium">
            <span>📍 Location: {successData.canteen.location}</span>
            <span>🕒 Hours: {successData.canteen.openingHours.open}–{successData.canteen.openingHours.close}</span>
          </div>
          <p className="text-muted text-[11px]">
            Once the owner activates their account via the link below, they can configure their food
            menu, categories, and onboard their kitchen & delivery staff.
          </p>
        </div>

        <InviteLinkCard
          name={successData.ownerResult.user.name}
          link={successData.ownerResult.inviteLink}
        />

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              setSuccessData(null);
              setForm(INITIAL);
            }}
            className="btn btn-secondary text-xs"
          >
            Onboard Another Canteen
          </button>
          <button type="button" onClick={onDone} className="btn btn-primary text-xs">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* SECTION 1: Canteen Information */}
      <div className="space-y-4">
        <div className="border-b border-line pb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
            <span>🏢</span>
            <span>Part 1: Canteen Information</span>
          </h4>
          <p className="text-xs text-muted font-light mt-0.5">
            Campus location and operating profile visible to students.
          </p>
        </div>

        <ImageUploadField
          label="Canteen Banner Photo"
          value={form.image}
          onChange={(url) => setForm((prev) => ({ ...prev, image: url }))}
          folder="canteens"
          hint="Upload a clear photo of the canteen storefront or food court stall (direct S3 storage)."
        />

        <Field
          label="Canteen Name"
          name="name"
          value={form.name}
          onChange={update}
          placeholder="e.g. SRU Food Court, Green Bowl"
          error={errors.name}
        />

        <Field
          label="Campus Location"
          name="location"
          value={form.location}
          onChange={update}
          placeholder="e.g. Ground Floor, Student Activity Center"
          error={errors.location}
        />

        <div>
          <label htmlFor="description" className="block text-xs font-semibold text-ink">
            Short Description / Specialties
          </label>
          <input
            id="description"
            name="description"
            value={form.description}
            onChange={update}
            placeholder="e.g. Fresh juices, South Indian meals, and evening snacks"
            className="input mt-1.5 text-sm"
          />
          {errors.description && <p className="mt-1 text-xs text-danger">{errors.description}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Opening Time"
            name="open"
            value={form.open}
            onChange={update}
            placeholder="08:00"
            error={errors.open}
          />
          <Field
            label="Closing Time"
            name="close"
            value={form.close}
            onChange={update}
            placeholder="22:00"
            error={errors.close}
          />
        </div>
      </div>

      {/* SECTION 2: Canteen Partner (Owner) */}
      <div className="space-y-4">
        <div className="border-b border-line pb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
            <span>👤</span>
            <span>Part 2: Canteen Partner (Owner)</span>
          </h4>
          <p className="text-xs text-muted font-light mt-0.5">
            The contractor or manager who runs this canteen and hires staff.
          </p>
        </div>

        <Field
          label="Owner Full Name"
          name="ownerName"
          value={form.ownerName}
          onChange={update}
          placeholder="e.g. Ramesh Kumar"
          error={errors.ownerName}
          autoComplete="name"
        />

        <Field
          label="Owner Email Address (Login)"
          name="ownerEmail"
          type="email"
          value={form.ownerEmail}
          onChange={update}
          placeholder="e.g. ramesh.canteen@gmail.com"
          error={errors.ownerEmail}
          autoComplete="email"
        />

        <Field
          label="10-Digit Mobile Number"
          name="ownerPhone"
          type="tel"
          value={form.ownerPhone}
          onChange={update}
          placeholder="e.g. 9876543210"
          error={errors.ownerPhone}
          autoComplete="tel"
        />
      </div>

      <div className="flex justify-end gap-2.5 pt-3 border-t border-line">
        <button
          type="button"
          onClick={onDone}
          className="btn btn-secondary text-xs"
          disabled={mutation.isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary text-xs cursor-pointer shadow-xs"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Onboarding Canteen…' : 'Onboard Canteen & Send Invite'}
        </button>
      </div>
    </form>
  );
}

