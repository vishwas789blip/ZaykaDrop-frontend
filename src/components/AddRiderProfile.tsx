import { useState } from 'react';
import { useAppData } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { riderService } from '../utils/constant';

interface AddRiderProfileProps {
  onSuccess: () => void;
}

const AddRiderProfile = ({ onSuccess }: AddRiderProfileProps) => {
  const { user } = useAppData();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [picture, setPicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    setPicture(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber || !aadharNumber || !drivingLicenseNumber || !vehicleNumber) {
      toast.error('All fields are required');
      return;
    }

    if (!/^\d{10}$/.test(phoneNumber)) {
      toast.error('Phone number must be 10 digits');
      return;
    }

    if (!/^\d{12}$/.test(aadharNumber)) {
      toast.error('Aadhar number must be 12 digits');
      return;
    }

    if (!picture) {
      toast.error('Profile picture is required');
      return;
    }

    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setSubmitting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const formData = new FormData();
          formData.append('picture', picture);
          formData.append('phoneNumber', phoneNumber);
          formData.append('aadharNumber', aadharNumber);
          formData.append('drivingLicenseNumber', drivingLicenseNumber);
          formData.append('vehicleNumber', vehicleNumber);
          formData.append(
            'location',
            JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            })
          );

          await axios.post(`${riderService}/api/rider/new`, formData, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'multipart/form-data',
            },
          });

          toast.success('Rider profile created successfully');
          onSuccess();
        } catch (error: any) {
          console.error('Error creating rider profile:', error);
          toast.error(error.response?.data?.message || 'Failed to create rider profile');
        } finally {
          setSubmitting(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        toast.error('Location access is required to complete your profile');
        setSubmitting(false);
      }
    );
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Complete Your Rider Profile</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Profile preview"
              className="w-24 h-24 rounded-full object-cover border"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
              No Photo
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>

        <input
          type="text"
          placeholder="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          maxLength={10}
          className="border rounded-lg px-3 py-2"
        />

        <input
          type="text"
          placeholder="Aadhar Number"
          value={aadharNumber}
          onChange={(e) => setAadharNumber(e.target.value)}
          maxLength={12}
          className="border rounded-lg px-3 py-2"
        />

        <input
          type="text"
          placeholder="Driving License Number"
          value={drivingLicenseNumber}
          onChange={(e) => setDrivingLicenseNumber(e.target.value)}
          className="border rounded-lg px-3 py-2"
        />

        <input
          type="text"
          placeholder="Vehicle Number"
          value={vehicleNumber}
          onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
          className="border rounded-lg px-3 py-2 uppercase"
        />

        <button
          type="submit"
          disabled={submitting}
          className="bg-orange-500 text-white font-medium py-2 rounded-lg disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Create Profile'}
        </button>
      </form>
    </div>
  );
};

export default AddRiderProfile;