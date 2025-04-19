import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isConfigured } from '@/lib/config-store'; // Import isConfigured

const SetupDetector = () => {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const configured = isConfigured(); // Use isConfigured
    if (!configured) {
      console.log('Application not configured, redirecting to setup.');
      navigate('/setup', { replace: true });
    } else {
      console.log('Application is configured.');
    }
    setChecked(true); // Mark check as complete
  }, [navigate]);

  // Optionally render a loading state while checking
  // if (!checked) return <div>Checking configuration...</div>;

  return null; // This component doesn't render anything itself
};

export default SetupDetector;
