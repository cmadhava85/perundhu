import React from 'react';
// TEMPORARILY DISABLED (Issue #3) - Re-enable these imports when re-enabling authentication
// import { Navigate, useLocation } from 'react-router-dom';
// import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  // TEMPORARILY DISABLED AUTHENTICATION CHECK (Issue #3)
  // Authentication is bypassed to allow automatic access to admin panel
  // To re-enable authentication:
  // 1. Uncomment the useAdminAuth and useLocation hooks below
  // 2. Uncomment the authentication check logic
  // 3. Uncomment the admin login route in AppRoutes.tsx
  
  // const { isAdminAuthenticated, isLoading } = useAdminAuth();
  // const location = useLocation();

  // Show loading state while checking auth
  // if (isLoading) {
  //   return (
  //     <div style={{
  //       display: 'flex',
  //       alignItems: 'center',
  //       justifyContent: 'center',
  //       minHeight: '100vh',
  //       background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
  //     }}>
  //       <div style={{
  //         display: 'flex',
  //         flexDirection: 'column',
  //         alignItems: 'center',
  //         gap: '16px',
  //         color: 'white',
  //       }}>
  //         <div style={{
  //           width: '40px',
  //           height: '40px',
  //           border: '3px solid rgba(255, 255, 255, 0.2)',
  //           borderTopColor: 'white',
  //           borderRadius: '50%',
  //           animation: 'spin 0.8s linear infinite',
  //         }} />
  //         <p style={{ fontSize: '14px', opacity: 0.8 }}>Checking authentication...</p>
  //         <style>{`
  //           @keyframes spin {
  //             to { transform: rotate(360deg); }
  //           }
  //         `}</style>
  //       </div>
  //     </div>
  //   );
  // }

  // Redirect to admin login if not authenticated
  // if (!isAdminAuthenticated) {
  //   return <Navigate to="/admin/login" state={{ from: location }} replace />;
  // }

  // Render the protected content (no authentication check)
  return <>{children}</>;
};

export default ProtectedAdminRoute;
