import React from 'react';
import { motion } from 'motion/react';

interface SettingToggleProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  activeColor?: string; // default amber #D97706
}

export const SettingToggle: React.FC<SettingToggleProps> = ({
  id,
  checked,
  onChange,
  disabled = false,
  activeColor = '#D97706',
}) => {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]/40 ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      }`}
      style={{
        backgroundColor: checked ? activeColor : '#2A2926',
      }}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
};
