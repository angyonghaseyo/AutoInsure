import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionLink?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  actionLink,
  onAction
}) => {
  return (
    <div className="text-center py-12 px-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-6">
        <Icon className="h-8 w-8" />
      </div>
      
      <h3 className="text-xl font-medium text-gray-900 mb-2">{title}</h3>
      
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        {description}
      </p>
      
      {actionText && actionLink && (
        <Link
          href={actionLink}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {actionText}
        </Link>
      )}
      
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;