import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Gamepad2, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { useUserStore, ADMIN_REGISTRATION_CODE } from '../stores/userStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useUserStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !email || !password || !confirmPassword) {
      setError('请填写所有必填字段');
      return;
    }
    
    if (username.length < 3) {
      setError('用户名至少需要3个字符');
      return;
    }
    
    if (password.length < 6) {
      setError('密码至少需要6个字符');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    
    const result = register(username, email, password, adminCode);
    if (result) {
      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } else {
      setError('该邮箱已被注册');
    }
  };
  
  if (success) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-4">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="font-orbitron text-2xl font-bold text-white mb-2">注册成功!</h2>
          <p className="text-gray-400">正在跳转至首页...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pt-20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 mb-4">
            <Gamepad2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-orbitron text-3xl font-bold text-gradient">智荐优游</h1>
          <p className="text-gray-400 mt-2">创建新账户</p>
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
                <User className="w-4 h-4 inline mr-1" />
                用户名 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="input-field"
                placeholder="请输入用户名（至少3个字符）"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                邮箱 <span className="text-red-400">*</span>
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
                密码 <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                placeholder="请输入密码（至少6个字符）"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                <Lock className="w-4 h-4 inline mr-1" />
                确认密码 <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="请再次输入密码"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                <Shield className="w-4 h-4 inline mr-1" />
                管理员识别码 <span className="text-gray-500">（选填）</span>
              </label>
              <input
                type="text"
                value={adminCode}
                onChange={e => setAdminCode(e.target.value)}
                className="input-field"
                placeholder="如有管理员识别码请填写"
              />
            </div>
            
            <button type="submit" className="btn-primary w-full">
              注册
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              已有账户?{' '}
              <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold">
                立即登录
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
