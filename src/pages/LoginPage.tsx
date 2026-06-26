import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Gamepad2, AlertCircle } from 'lucide-react';
import { useUserStore } from '../stores/userStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useUserStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('请填写所有字段');
      return;
    }
    
    const success = login(email, password);
    if (success) {
      navigate('/');
    } else {
      setError('邮箱或密码错误，请检查后重试');
    }
  };
  
  return (
    <div className="min-h-screen pt-20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 mb-4">
            <Gamepad2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-orbitron text-3xl font-bold text-gradient">智荐优游</h1>
          <p className="text-gray-400 mt-2">登录您的账户</p>
        </div>
        
        <div className="glass-card rounded-2xl p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="请输入您的邮箱"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                <Lock className="w-4 h-4 inline mr-1" />
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                placeholder="请输入密码"
                required
              />
            </div>
            
            <button type="submit" className="btn-primary w-full">
              登录
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              还没有账户?{' '}
              <Link to="/register" className="text-purple-400 hover:text-purple-300 font-semibold">
                立即注册
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
