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
    const checkAuthStatus = () => {
      const storedUser = localStorage.getItem('currentUser');
      const authToken = localStorage.getItem('authToken');
      
      if (storedUser && authToken) {
        try {
          const user = JSON.parse(storedUser);
          setCurrentUser(user);
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
        // 不儲存密碼，只儲存使用者名稱
        const userInfo = { username: user.username };
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

  const value = {
    isAuthenticated,
    currentUser,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
