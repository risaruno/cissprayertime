import React from 'react';
import { Palette, Check } from 'lucide-react';
import { UIProfile } from '../types/profiles';

interface ProfileSelectorProps {
  profiles: UIProfile[];
  activeProfile: UIProfile;
  onSelectProfile: (profile: UIProfile) => void;
}

const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  profiles,
  activeProfile,
  onSelectProfile,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/90 hover:bg-white backdrop-blur-md rounded-full p-3 shadow-2xl transition-all duration-300 hover:scale-110 group"
        title="Change UI Profile"
      >
        <Palette className="w-6 h-6 text-gray-800 group-hover:text-blue-600 transition-colors" />
      </button>

      {/* Profile Menu */}
      {isOpen && (
        <div className="absolute top-14 right-0 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-4 min-w-[320px] max-w-[380px] border border-gray-200/50 animate-fadeIn">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Palette className="w-5 h-5" />
            UI Profiles
          </h3>
          
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => {
                  onSelectProfile(profile);
                  setIsOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                  activeProfile.id === profile.id
                    ? 'bg-blue-500 text-white shadow-lg scale-105'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-semibold text-base mb-1 flex items-center gap-2">
                      {profile.name}
                      {activeProfile.id === profile.id && (
                        <Check className="w-4 h-4" />
                      )}
                    </div>
                    <p className={`text-sm ${
                      activeProfile.id === profile.id
                        ? 'text-blue-100'
                        : 'text-gray-600'
                    }`}>
                      {profile.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="mt-3 w-full py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileSelector;
