import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 檢查本地存儲的登入狀態
  useEffect(() => {
    // On every page load, try to sync the stored user's info (permissions etc.) with the authoritative /user.json
    // This allows permission changes to take effect without forcing re-login.
    const checkAuthStatus = async () => {
      const storedUser = localStorage.getItem('currentUser');
      const authToken = localStorage.getItem('authToken');

      if (storedUser && authToken) {
        try {
          const parsed = JSON.parse(storedUser);
          const username = parsed && parsed.username;

          if (username) {
            try {
              const resp = await fetch('/user.json', { cache: 'no-store' });
              if (resp.ok) {
                const data = await resp.json();
                const userFromFile = data.users && data.users.find(u => u.username === username);
                if (userFromFile) {
                  // Build user info without password
                  const userInfo = {
                    username: userFromFile.username,
                    role: userFromFile.role,
                    permissions: userFromFile.permissions
                  };
                  localStorage.setItem('currentUser', JSON.stringify(userInfo));
                  setCurrentUser(userInfo);
                  setIsAuthenticated(true);
                  setLoading(false);
                  return;
                }
                // if not found in file, fall back to parsed stored user
              }
            } catch (err) {
              // network error - fall back to local stored user
              console.warn('Failed to fetch user.json for auth sync, falling back to local user:', err);
            }
          }

          // fallback: use stored user (parsed)
          setCurrentUser(parsed);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          logout();
        }
      }

      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  // 登入函數
  const login = async (username, password) => {
    try {
      // 從 user.json 讀取使用者資料
      const response = await fetch('/user.json');
      const data = await response.json();
      
      // 驗證帳號密碼
      const user = data.users.find(
        u => u.username === username && u.password === password
      );

      if (user) {
        // 儲存使用者資訊（不包含密碼）和權限
        const userInfo = { 
          username: user.username,
          role: user.role,
          permissions: user.permissions
        };
        const authToken = btoa(`${username}:${Date.now()}`); // 簡單的 token 生成
        
        localStorage.setItem('currentUser', JSON.stringify(userInfo));
        localStorage.setItem('authToken', authToken);
        
        setCurrentUser(userInfo);
        setIsAuthenticated(true);
        
        return { success: true };
      } else {
        return { success: false, error: '帳號或密碼錯誤' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: '登入失敗，請稍後再試' };
    }
  };

  // 登出函數
  const logout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // 檢查權限函數
  const hasPermission = (module, action) => {
    if (!currentUser || !currentUser.permissions) {
      return false;
    }
    
    const modulePermissions = currentUser.permissions[module];
    if (!modulePermissions) {
      return false;
    }
    
    return modulePermissions[action] === true;
  };

  const value = {
    isAuthenticated,
    currentUser,
    loading,
    login,
    logout,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
