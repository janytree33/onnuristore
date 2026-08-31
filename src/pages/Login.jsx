import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      // Supabase 기본 이메일/비밀번호 로그인
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // 로그인 성공 시 메인으로 이동
      navigate('/');
    } catch (err) {
      console.error(err);
      setErrorMsg('이메일 또는 비밀번호가 일치하지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--jt-bg-layout)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 'var(--jt-space-4)'
    }}>
      <div style={{
        backgroundColor: 'var(--jt-bg-surface)',
        borderRadius: 'var(--jt-r-md)',
        boxShadow: 'var(--jt-shadow-sm)',
        padding: 'var(--jt-space-8) var(--jt-space-6)',
        width: '100%',
        maxWidth: '420px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--jt-space-7)' }}>
          <h2 style={{ 
            color: 'var(--jt-color-text)', 
            margin: 0, 
            fontWeight: 700,
            fontSize: '22px'
          }}>
            관리자 로그인
          </h2>
          <p style={{ color: 'var(--jt-color-text-secondary)', fontSize: '14px', marginTop: 'var(--jt-space-3)' }}>
            로그인하여 민감한 가격 정보를 확인하세요.
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--jt-space-5)' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--jt-color-text)', fontWeight: 600, marginBottom: 'var(--jt-space-2)', fontSize: '14px' }}>
              이메일
            </label>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-rounded" style={{
                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--jt-color-text-tertiary)', fontSize: '20px'
              }}>mail</span>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="jt-input"
                style={{ width: '100%', paddingLeft: '40px', boxSizing: 'border-box' }}
                placeholder="이메일을 입력하세요"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--jt-color-text)', fontWeight: 600, marginBottom: 'var(--jt-space-2)', fontSize: '14px' }}>
              비밀번호
            </label>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-rounded" style={{
                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--jt-color-text-tertiary)', fontSize: '20px'
              }}>lock</span>
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="jt-input"
                style={{ width: '100%', paddingLeft: '40px', paddingRight: '40px', boxSizing: 'border-box' }}
                placeholder="비밀번호를 입력하세요"
              />
              <span 
                className="material-symbols-rounded" 
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--jt-color-text-tertiary)', fontSize: '20px', cursor: 'pointer'
                }}
              >
                {showPassword ? 'visibility' : 'visibility_off'}
              </span>
            </div>
          </div>

          {errorMsg && (
            <div style={{
              color: 'var(--jt-color-error)', fontSize: '13px', textAlign: 'center', 
              backgroundColor: 'var(--jt-bg-error-subtle)', padding: 'var(--jt-space-3)', borderRadius: 'var(--jt-r-sm)',
              fontWeight: 600
            }}>
              {errorMsg}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="jt-btn"
            style={{
              width: '100%',
              marginTop: 'var(--jt-space-3)'
            }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
