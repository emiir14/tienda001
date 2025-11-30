
import React from 'react';

// The size prop is removed to allow for flexible sizing via className.
interface InstagramIconProps extends React.SVGProps<SVGSVGElement> {}

export const InstagramIcon: React.FC<InstagramIconProps> = ({ className, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      // The width and height attributes are removed. Size will be controlled by Tailwind classes.
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className} // Example: className="w-8 h-8 text-blue-500"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
    </svg>
  );
};
