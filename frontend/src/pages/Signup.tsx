import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground';
import { authAPI } from '../services/api';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.register({ email, password });
      navigate('/login');
    } catch (errorObj: any) {
      setError(errorObj.response?.data?.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <AnimatedBackground />
      <main className="auth-container">
        <section className="panel auth-card">
          <h1>Create Account</h1>
          <p>Start organizing your tasks in one place.</p>

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
                  minLength={6}
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
            <div>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-field">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeSlashIcon width={18} height={18} /> : <EyeIcon width={18} height={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <p className="auth-link">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </section>
      </main>
    </div>
  );
};

export default Signup;
