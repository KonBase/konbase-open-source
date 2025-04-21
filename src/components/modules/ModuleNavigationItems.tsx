import React from 'react';
import { useModules } from './ModuleContext';
import { Link } from 'react-router-dom';
import { ModuleNavigationItem as ModuleNavItem } from '../../types/modules';

export const ModuleNavigationItems: React.FC = () => {
  const { navigationItems, isInitialized } = useModules();
  
  // Ensure all navigation items have a label or title property
  const validNavigationItems = navigationItems.filter(
    (item): item is ModuleNavItem => Boolean(item.label || item.title)
  );
  
  if (!isInitialized || validNavigationItems.length === 0) {
    return null;
  }
  
  return (
    <>
      {validNavigationItems.map((item, index) => (
        <li key={`${item.path}-${index}`}>
          <Link 
            to={item.path}
            className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
          >
            {item.icon && typeof item.icon !== 'string' && React.isValidElement(item.icon) && (
              React.cloneElement(item.icon as React.ReactElement<any>, {
                className: "w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
              })
            )}
            <span className="ml-3">{item.label || item.title}</span>
          </Link>
        </li>
      ))}        </>
  );
};