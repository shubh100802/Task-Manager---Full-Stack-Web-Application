import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground';
import { authAPI } from '../services/api';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiResponse = await authAPI.login({ email, password });
      localStorage.setItem('token', apiResponse.data.token);
      localStorage.setItem('user', JSON.stringify(apiResponse.data.user));
      navigate('/dashboard');
    } catch (errorObj: any) {
      setError(errorObj.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <AnimatedBackground />
      <main className="auth-container">
        <section className="panel auth-card">
          <h1>Sign In</h1>
          <p>Access your tasks and analytics dashboard.</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeSlashIcon width={18} height={18} /> : <EyeIcon width={18} height={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="auth-link">
            No account yet? <Link to="/signup">Create one</Link>
          </p>
        </section>
      </main>
    </div>
  );
};

export default Login;
